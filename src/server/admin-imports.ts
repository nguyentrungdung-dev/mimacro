import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { pool, transaction } from "./db";
import { requireAdmin } from "./question-bank";
import type { Actor } from "./auth";
import type { Question } from "../lib/types";
import { checkQuestion } from "../lib/question-checks";
import { AppError } from "../lib/exams";
const execute = promisify(execFile);
const metadataSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subject: z.enum(["micro", "macro"]),
  language: z.enum(["en", "vi"]),
  chapter: z.coerce.number().int().min(1).max(100),
  topic: z.string().trim().min(3).max(200),
});
export const MAX_UPLOAD = 25 * 1024 * 1024;
export async function receiveUpload(actor: Actor, form: FormData) {
  const user = requireAdmin(actor);
  const meta = metadataSchema.parse(Object.fromEntries(form));
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > MAX_UPLOAD ||
    !file.name.toLowerCase().endsWith(".docx")
  )
    throw new AppError(
      "Chọn DOCX tối đa 25 MB. File .doc cũ cần lưu lại thành .docx.",
    );
  if (
    ![
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "application/zip",
      "",
    ].includes(file.type)
  )
    throw new AppError("Loại file không phải DOCX.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== 0x04034b50)
    throw new AppError("File không có cấu trúc DOCX hợp lệ.");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const id = randomUUID();
  const existing = await pool().query(
    "SELECT id,source_id,status FROM source_uploads WHERE file_hash=$1",
    [hash],
  );
  if (existing.rowCount) return { id: existing.rows[0].id, duplicate: true };
  const inserted = await pool().query(
    `INSERT INTO source_uploads(id,file_hash,filename,data,metadata,actor_id,status) VALUES($1,$2,$3,$4,$5,$6,'queued') ON CONFLICT(file_hash) DO NOTHING RETURNING id`,
    [
      id,
      hash,
      file.name.slice(0, 180),
      bytes,
      { ...meta, filename: file.name.slice(0, 180) },
      user.id,
    ],
  );
  if (!inserted.rowCount) {
    const r = await pool().query(
      "SELECT id FROM source_uploads WHERE file_hash=$1",
      [hash],
    );
    return { id: r.rows[0].id, duplicate: true };
  }
  await processUpload(actor, id);
  return { id, duplicate: false };
}
export async function processUpload(actor: Actor, id: string) {
  const user = requireAdmin(actor);
  z.uuid().parse(id);
  const claim = await pool().query(
    `UPDATE source_uploads SET status='processing',updated_at=now() WHERE id=$1 AND (status IN ('queued','failed') OR (status='processing' AND updated_at<now()-interval '2 minutes')) RETURNING *`,
    [id],
  );
  if (!claim.rowCount)
    throw new AppError(
      "Phiên đã xử lý hoặc đang chạy. Chỉ thử lại phiên lỗi hoặc quá hạn xử lý.",
      409,
    );
  const run = claim.rows[0];
  let folder: string | undefined;
  let phase = "parser";
  try {
    const existing = (
      await pool().query("SELECT id FROM sources WHERE file_hash=$1", [
        run.file_hash,
      ])
    ).rows[0];
    if (existing) {
      await pool().query(
        "UPDATE source_uploads SET status='ready',source_id=$2,report=$3,updated_at=now() WHERE id=$1",
        [
          id,
          existing.id,
          {
            message:
              "Nguồn này đã có trong kho. Không nhập trùng hoặc ghi đè câu.",
            duplicate: true,
          },
        ],
      );
      return;
    }
    folder = await mkdtemp(join(tmpdir(), "mimacro-import-"));
    await writeFile(join(folder, "source.docx"), run.data, { mode: 0o600 });
    await writeFile(
      join(folder, "metadata.json"),
      JSON.stringify(run.metadata),
      { mode: 0o600 },
    );
    await execute(
      process.env.PYTHON_BIN || "python3",
      [
        join(process.cwd(), "scripts/parse-upload.py"),
        join(folder, "source.docx"),
        join(folder, "metadata.json"),
        join(folder, "output"),
      ],
      {
        timeout: 45000,
        maxBuffer: 1024 * 1024,
        env: {
          PATH: process.env.PATH,
          LANG: "en_US.UTF-8",
          NODE_ENV: process.env.NODE_ENV,
        },
      },
    );
    const payload = JSON.parse(
      await readFile(join(folder, "output/frank.json"), "utf8"),
    );
    if (
      payload.sources.length !== 1 ||
      !payload.questions.length ||
      payload.questions.length > 2500
    )
      throw Error("Invalid parser output");
    const source = payload.sources[0];
    const questions = payload.questions as Question[];
    const media = new Map<
      string,
      { data: Buffer; mime: string; relativePath: string }
    >();
    for (const m of payload.media) {
      if (!/^[a-f0-9]{64}\.(png|jpe?g|webp)$/.test(m.relativePath))
        throw Error("Invalid media path");
      const data = await readFile(join(folder, "output/media", m.relativePath));
      if (createHash("sha256").update(data).digest("hex") !== m.id)
        throw Error("Media hash mismatch");
      media.set(m.id, {
        data,
        mime: m.mime,
        relativePath: "media/" + m.relativePath,
      });
    }
    const issues = questions.flatMap((q) =>
      checkQuestion(q).map((c) => ({
        questionId: q.id,
        kind: c.code,
        detail: c.message,
      })),
    );
    for (const i of payload.issues) issues.push(i);
    phase = "database";
    await transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(59403322)");
      const duplicate = (
        await c.query("SELECT id FROM sources WHERE file_hash=$1", [
          run.file_hash,
        ])
      ).rows[0];
      if (duplicate) {
        await c.query(
          "UPDATE source_uploads SET status='ready',source_id=$2,report=$3,updated_at=now() WHERE id=$1",
          [
            id,
            duplicate.id,
            { duplicate: true, message: "Nguồn đã được nhập bởi phiên khác." },
          ],
        );
        return;
      }
      await c.query(
        "INSERT INTO sources(id,title,subject,language,chapter,topic,file_hash,question_count,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          source.id,
          source.title,
          source.subject,
          source.language,
          source.chapter,
          source.topic,
          run.file_hash,
          questions.length,
          { ...source.metadata, importRun: id },
        ],
      );
      const mediaRows = [...media].map(([mid, m]) => ({
        id: mid,
        path: m.relativePath,
        mime: m.mime,
        data: m.data.toString("base64"),
      }));
      if (mediaRows.length) {
        const written = await c.query(
          `INSERT INTO media(id,relative_path,mime,data)
        SELECT j.id,j.path,j.mime,decode(j.data,'base64') FROM jsonb_to_recordset($1::jsonb) AS j(id text,path text,mime text,data text)
        ON CONFLICT(id) DO UPDATE SET data=COALESCE(media.data,EXCLUDED.data) WHERE media.data IS NULL OR media.data=EXCLUDED.data RETURNING id`,
          [JSON.stringify(mediaRows)],
        );
        if (written.rowCount !== mediaRows.length)
          throw Error("Existing media mismatch");
      }
      const batch = JSON.stringify(
        questions.map((q) => ({
          content: { ...q, version: 1 },
          checks: checkQuestion(q),
        })),
      );
      await c.query(
        `INSERT INTO questions(id,source_id,source_number,family_key,status,content)
        SELECT j.content->>'id',$2,(j.content->>'number')::int,j.content->>'familyKey','needs_review',j.content
        FROM jsonb_to_recordset($1::jsonb) AS j(content jsonb,checks jsonb)`,
        [batch, source.id],
      );
      await c.query(
        `INSERT INTO question_revisions(question_id,version,content,status,actor_id,reason,checks)
        SELECT j.content->>'id',1,j.content,'needs_review',$2,'Nhập DOCX: giữ bản nguồn, chờ admin đối chiếu và duyệt',j.checks
        FROM jsonb_to_recordset($1::jsonb) AS j(content jsonb,checks jsonb)`,
        [batch, user.id],
      );
      if (issues.length)
        await c.query(
          `INSERT INTO content_issues(id,source_id,question_id,kind,detail)
        SELECT j.id,$2,j."questionId",j.kind,j.detail FROM jsonb_to_recordset($1::jsonb) AS j(id text,"questionId" text,kind text,detail text)`,
          [
            JSON.stringify(issues.map((i) => ({ ...i, id: randomUUID() }))),
            source.id,
          ],
        );
      await c.query(
        "UPDATE source_uploads SET status='needs_review',source_id=$2,report=$3,updated_at=now() WHERE id=$1",
        [
          id,
          source.id,
          {
            questions: questions.length,
            issues: issues.length,
            media: media.size,
            parser: "frank-docx-v1",
            aiUsed: false,
            message:
              "Đã đọc cấu trúc DOCX. Các câu đang chờ admin duyệt; chưa kiểm định học thuật bằng AI.",
          },
        ],
      );
      await c.query(
        "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
        [
          randomUUID(),
          user.id,
          "source.import",
          source.id,
          { runId: id, questions: questions.length, issues: issues.length },
        ],
      );
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    await pool().query(
      "UPDATE source_uploads SET status='failed',report=$2,updated_at=now() WHERE id=$1",
      [
        id,
        {
          phase,
          aiUsed: false,
          message:
            phase === "database"
              ? "Lỗi lưu kết quả nhập. Transaction đã rollback; file gốc vẫn giữ riêng tư. Thử xử lý lại khi dịch vụ ổn định."
              : code === "ENOENT"
                ? "Máy chủ chưa có Python để đọc DOCX. File đã lưu riêng tư; cần cấu hình runtime rồi thử lại."
                : "Chưa đọc được định dạng này. Hỗ trợ bank DOCX trắc nghiệm kiểu Frank có Answer Key và lời giải, giữ bảng/ảnh/sup/sub. OMML, đề nhiều phần hoặc cấu trúc khác cần parser riêng. File gốc đã được giữ riêng tư để xử lý lại.",
        },
      ],
    );
  } finally {
    if (folder) await rm(folder, { recursive: true, force: true });
  }
}
