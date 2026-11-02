import type { PoolClient } from "pg";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction } from "./db";
import type { Actor } from "./auth";
import { AppError } from "../lib/exams";
import { checkQuestion, editSchema, type Check } from "../lib/question-checks";
import type { Question } from "../lib/types";
import { mediaStorage } from "./deployment";
import { readBankMedia } from "./media-files";
export function requireAdmin(actor: Actor) {
  if (actor.user?.role !== "admin")
    throw new AppError(
      "Chỉ quản trị viên được truy cập ngân hàng câu hỏi.",
      403,
    );
  return actor.user;
}
const filters = z.object({
  search: z.string().trim().max(200).default(""),
  source: z.string().max(100).default(""),
  status: z.enum(["", "validated", "needs_review", "retired"]).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export async function listQuestions(
  actor: Actor,
  params: Record<string, string>,
) {
  requireAdmin(actor);
  const f = filters.parse(params);
  const result = await pool().query(
    `SELECT q.id,q.version,q.status,q.source_number AS number,
    q.content->>'text' AS text,q.content->>'topic' AS topic,s.title AS "sourceTitle",s.id AS "sourceId",
    (SELECT count(*)::int FROM content_issues i WHERE i.question_id=q.id AND i.status='open') AS "openIssues",
    count(*) OVER()::int AS total
    FROM questions q JOIN sources s ON s.id=q.source_id
    WHERE ($1='' OR position(lower($1) in lower(q.content->>'text'))>0 OR q.id=$1 OR q.source_number::text=$1)
    AND ($2='' OR q.source_id=$2) AND ($3='' OR q.status=$3)
    ORDER BY CASE q.status WHEN 'needs_review' THEN 0 WHEN 'validated' THEN 1 ELSE 2 END,s.title,q.source_number LIMIT 25 OFFSET $4`,
    [f.search, f.source, f.status, (f.page - 1) * 25],
  );
  let total = result.rows[0]?.total;
  if (total === undefined)
    total = (
      await pool().query(
        `SELECT count(*)::int AS total FROM questions q
    WHERE ($1='' OR position(lower($1) in lower(q.content->>'text'))>0 OR q.id=$1 OR q.source_number::text=$1)
    AND ($2='' OR q.source_id=$2) AND ($3='' OR q.status=$3)`,
        [f.search, f.source, f.status],
      )
    ).rows[0].total;
  const sources = (
    await pool().query("SELECT id,title FROM sources ORDER BY title")
  ).rows;
  return {
    rows: result.rows.map(({ total, ...r }) => r),
    total,
    page: f.page,
    sources,
  };
}
async function checks(q: Question, c: PoolClient): Promise<Check[]> {
  const errors = checkQuestion(q);
  for (const id of new Set([...q.mediaIds, ...q.solutionMediaIds])) {
    const row = (
      await c.query("SELECT relative_path,data FROM media WHERE id=$1", [id])
    ).rows[0];
    try {
      if (
        !row ||
        (mediaStorage() === "postgres"
          ? !row.data?.length
          : !(await readBankMedia(row.relative_path)).length)
      )
        throw Error("missing");
    } catch {
      errors.push({
        code: "media",
        message: `Không đọc được hình ${id.slice(0, 12)}… trong kho riêng tư.`,
      });
    }
  }
  return errors;
}
export async function questionDetail(actor: Actor, id: string) {
  requireAdmin(actor);
  const row = (
    await pool().query(
      `SELECT q.id,q.version,q.status,q.content,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'kind',i.kind,'detail',i.detail,'status',i.status,'resolution',i.resolution,'resolved_version',i.resolved_version) ORDER BY i.created_at,i.id) FROM content_issues i WHERE i.question_id=q.id),'[]'::jsonb) AS issues,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('version',r.version,'status',r.status,'content',r.content,'reason',r.reason,'checks',r.checks,'createdAt',r.created_at,'actorName',u.display_name) ORDER BY r.version DESC) FROM question_revisions r LEFT JOIN users u ON u.id=r.actor_id WHERE r.question_id=q.id),'[]'::jsonb) AS revisions
    FROM questions q WHERE q.id=$1`,
      [id],
    )
  ).rows[0];
  if (!row) throw new AppError("Không tìm thấy câu hỏi.", 404);
  return row;
}
export async function mutateQuestion(
  actor: Actor,
  id: string,
  action: string,
  body: unknown,
) {
  const user = requireAdmin(actor);
  const common = z.object({
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().min(8).max(2000),
    resolveIssues: z.boolean().default(false),
    confirmed: z.boolean().default(false),
  });
  const b = action === "save" ? editSchema.parse(body) : common.parse(body);
  if (!["save", "check", "validate", "retire"].includes(action))
    throw new AppError("Không tìm thấy thao tác.", 404);
  return transaction(async (c) => {
    const row = (
      await c.query("SELECT * FROM questions WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (!row) throw new AppError("Không tìm thấy câu hỏi.", 404);
    if (row.version !== b.expectedVersion)
      throw new AppError(
        "Câu đã có phiên bản mới. Tải lại để đối chiếu trước khi lưu.",
        409,
      );
    let q: Question = row.content;
    if (action === "save") {
      const edit = editSchema.parse(body);
      if (
        edit.options.length !== q.options.length ||
        edit.options.some((o, i) => o.id !== q.options[i].id)
      )
        throw new AppError("Phải giữ nguyên ID và thứ tự lựa chọn nguồn.");
      q = {
        ...q,
        html: edit.html,
        text: edit.text,
        options: edit.options,
        answer: edit.answer,
        explanation: edit.explanation,
        explanationHtml: edit.explanationHtml,
        topic: edit.topic,
      };
      // Unsafe markup is never persisted or rendered, even in a failed draft.
      if (
        checkQuestion(q).some(
          (e) => e.code === "html" || e.code === "media_reference",
        )
      )
        throw new AppError("HTML hoặc tham chiếu hình không hợp lệ.");
      const fingerprint =
        q.text +
        "|" +
        "[" +
        q.options
          .map((o) => o.text)
          .sort()
          .map((t) => JSON.stringify(t))
          .join(", ") +
        "]" +
        "|" +
        q.mediaIds.join(",");
      q.familyKey = createHash("sha256")
        .update(fingerprint.replace(/\s+/g, " "))
        .digest("hex");
    }
    const result = await checks(q, c);
    let status = row.status;
    if (action === "save") status = "needs_review";
    if (action === "retire") status = "retired";
    if (action === "check" && result.length)
      status = row.status === "retired" ? "retired" : "needs_review";
    if (action === "validate") {
      const confirm = common.parse(body);
      if (!confirm.confirmed)
        throw new AppError(
          "Cần xác nhận đã đối chiếu câu, đáp án và lời giải với nguồn.",
        );
      if (result.length)
        throw new AppError(
          "Chưa thể mở câu: " + result.map((e) => e.message).join(" "),
        );
      const open = (
        await c.query(
          "SELECT id FROM content_issues WHERE question_id=$1 AND status='open'",
          [id],
        )
      ).rowCount;
      if (open && !confirm.resolveIssues)
        throw new AppError(
          "Còn vấn đề mở. Cần ghi cách xử lý và xác nhận giải quyết các vấn đề.",
        );
      if (open)
        await c.query(
          `UPDATE content_issues SET status='resolved',resolution=$2,resolved_by=$3,resolved_at=now(),resolved_version=$4 WHERE question_id=$1 AND status='open'`,
          [id, b.reason, user.id, row.version + 1],
        );
      status = "validated";
    }
    const version = row.version + 1;
    q = { ...q, version };
    await c.query(
      "UPDATE questions SET version=$2,status=$3,content=$4,family_key=$5 WHERE id=$1",
      [id, version, status, q, q.familyKey],
    );
    await c.query(
      `INSERT INTO question_revisions(question_id,version,content,status,actor_id,reason,checks) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        version,
        q,
        status,
        user.id,
        `${action}: ${b.reason}`,
        JSON.stringify(result),
      ],
    );
    await c.query(
      "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
      [
        randomUUID(),
        user.id,
        "question." + action,
        id,
        { version, status, reason: b.reason, checks: result },
      ],
    );
    await c.query(
      `UPDATE source_uploads SET status=CASE WHEN EXISTS(SELECT 1 FROM questions q WHERE q.source_id=$1 AND q.status='needs_review') THEN 'needs_review' ELSE 'ready' END,updated_at=now() WHERE source_id=$1 AND status IN ('needs_review','ready')`,
      [q.sourceId],
    );
    return { version, status, checks: result };
  });
}
