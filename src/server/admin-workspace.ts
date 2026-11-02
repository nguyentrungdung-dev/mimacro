import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction } from "./db";
import { requireAdmin } from "./question-bank";
import type { Actor } from "./auth";
import type { Question } from "../lib/types";
import { AppError, selectBalanced, checkLearner } from "../lib/exams";
export async function audit(
  actorId: string,
  action: string,
  entityId: string,
  detail: object = {},
) {
  await pool().query(
    "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
    [randomUUID(), actorId, action, entityId, detail],
  );
}
export async function adminWorkspace(
  actor: Actor,
  area: string,
  query: Record<string, string> = {},
) {
  requireAdmin(actor);
  const search = z
    .string()
    .max(160)
    .parse(query.search || "");
  if (area === "overview") {
    const counts = (
      await pool().query(
        `SELECT (SELECT count(*)::int FROM questions) AS questions,(SELECT count(*)::int FROM questions WHERE status='needs_review') AS pending,(SELECT count(*)::int FROM content_issues WHERE status='open') AS issues,(SELECT count(*)::int FROM sources) AS sources,(SELECT count(*)::int FROM source_uploads WHERE status IN ('failed','processing','queued')) AS imports,(SELECT count(*)::int FROM users WHERE role='student') AS students,(SELECT count(*)::int FROM managed_exams WHERE status='published') AS exams,(SELECT count(*)::int FROM content_reports WHERE status='open') AS reports`,
      )
    ).rows[0];
    return {
      counts,
      recent: (
        await pool().query(
          "SELECT id,filename,status,source_id,report,created_at FROM source_uploads ORDER BY created_at DESC LIMIT 5",
        )
      ).rows,
    };
  }
  if (area === "sources")
    return {
      sources: (
        await pool().query(
          `SELECT s.id,s.title,s.subject,s.language,s.chapter,s.question_count,(SELECT count(*)::int FROM questions q WHERE q.source_id=s.id AND q.status='needs_review') AS pending FROM sources s WHERE $1='' OR position(lower($1) in lower(s.title))>0 ORDER BY s.imported_at DESC LIMIT 100`,
          [search],
        )
      ).rows,
      uploads: (
        await pool().query(
          "SELECT id,filename,status,source_id,report,created_at,updated_at FROM source_uploads ORDER BY created_at DESC LIMIT 50",
        )
      ).rows,
      limits: {
        maxMB: 25,
        format: "docx",
        parser: "Frank — câu 1), lựa chọn A)–D), Answer Key và lời giải",
      },
    };
  if (area === "users")
    return {
      rows: (
        await pool().query(
          `SELECT u.id,u.username,u.display_name,u.role,u.is_active,u.created_at,(SELECT count(*)::int FROM attempts a WHERE a.user_id=u.id) AS attempts FROM users u WHERE $1='' OR position(lower($1) in lower(u.username||' '||u.display_name))>0 ORDER BY u.created_at DESC LIMIT 100`,
          [search],
        )
      ).rows,
    };
  if (area === "exams")
    return {
      rows: (
        await pool().query(
          "SELECT id,title,subject,language,minutes,status,free_candidate,version,jsonb_array_length(snapshot) AS questions,updated_at FROM managed_exams ORDER BY updated_at DESC LIMIT 100",
        )
      ).rows,
      sources: (
        await pool().query(
          "SELECT s.id,s.title,s.subject,s.language,count(q.id)::int AS available FROM sources s LEFT JOIN questions q ON q.source_id=s.id AND q.status='validated' GROUP BY s.id ORDER BY s.title",
        )
      ).rows,
      freePolicyConfigured: false,
    };
  if (area === "activity")
    return {
      rows: (
        await pool().query(
          "SELECT a.id,a.action,a.entity_id,a.detail,a.created_at,u.display_name AS actor FROM admin_audit a JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100",
        )
      ).rows,
    };
  if (area === "reports")
    return {
      rows: (
        await pool().query(
          "SELECT r.id,r.attempt_id,r.question_id,r.detail,r.status,r.resolution,r.created_at,u.username FROM content_reports r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 100",
        )
      ).rows,
      issues: (
        await pool().query(
          "SELECT id,question_id,kind,detail,status FROM content_issues WHERE status='open' ORDER BY created_at DESC LIMIT 100",
        )
      ).rows,
    };
  if (area === "operations")
    return {
      jobs: (
        await pool().query(
          "SELECT id,filename,status,report,created_at,updated_at FROM source_uploads ORDER BY created_at DESC LIMIT 50",
        )
      ).rows,
      usage: (
        await pool().query(
          "SELECT task,model,sum(input_tokens)::bigint AS input_tokens,sum(output_tokens)::bigint AS output_tokens,sum(cost_usd)::text AS cost_usd,count(*)::int AS calls FROM ai_usage GROUP BY task,model ORDER BY task",
        )
      ).rows,
      ai: {
        connected: false,
        keyConfigured: !!process.env.OPENROUTER_API_KEY,
        message:
          "Chưa có AI gateway/kiểm định học thuật. Tác vụ nhập hiện dùng parser cấu trúc, không gọi AI hoặc phát sinh chi phí model.",
      },
    };
  if (area === "billing")
    return {
      configured: false,
      priceVnd: 150000,
      message:
        "Chưa kết nối SePay, chưa có đơn hàng/giao dịch từ hệ thống. Quyền gói, hạn mức và chu kỳ tháng còn chờ chốt (O04/O09). Không cấp quyền trả phí thủ công.",
      openQuestions: [
        "Quyền và hạn mức từng gói",
        "Cách tính thời hạn tháng",
        "Tài khoản SePay, nhận tiền và xác thực webhook",
      ],
    };
  throw new AppError("Không tìm thấy mục quản trị.", 404);
}
export async function updateUser(actor: Actor, id: string, body: unknown) {
  const admin = requireAdmin(actor);
  z.uuid().parse(id);
  const b = z
    .object({
      role: z.enum(["admin", "student"]),
      isActive: z.boolean(),
      reason: z.string().trim().min(8).max(1000),
    })
    .parse(body);
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(59403323)");
    const old = (
      await c.query(
        "SELECT id,role,is_active FROM users WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!old) throw new AppError("Không tìm thấy người dùng.", 404);
    if (admin.id === id && (b.role !== "admin" || !b.isActive))
      throw new AppError(
        "Không tự khóa hoặc thu hồi quyền quản trị của chính phiên đang dùng.",
      );
    if (old.role === "admin" && (!b.isActive || b.role !== "admin")) {
      const n = (
        await c.query(
          "SELECT count(*)::int AS n FROM users WHERE role='admin' AND is_active",
        )
      ).rows[0].n;
      if (n <= 1)
        throw new AppError("Phải giữ ít nhất một admin đang hoạt động.");
    }
    await c.query("UPDATE users SET role=$2,is_active=$3 WHERE id=$1", [
      id,
      b.role,
      b.isActive,
    ]);
    if (!b.isActive || old.role !== b.role)
      await c.query("UPDATE sessions SET expires_at=now() WHERE user_id=$1", [
        id,
      ]);
    await c.query(
      "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
      [
        randomUUID(),
        admin.id,
        "user.update",
        id,
        { before: old, role: b.role, isActive: b.isActive, reason: b.reason },
      ],
    );
  });
  return { ok: true };
}
const examInput = z.object({
  title: z.string().trim().min(3).max(160),
  sourceIds: z.array(z.string().max(100)).min(1).max(20),
  count: z.number().int().min(1).max(250),
  minutes: z.number().int().min(1).max(600),
  freeCandidate: z.boolean().default(false),
});
export async function createManagedExam(actor: Actor, body: unknown) {
  const user = requireAdmin(actor);
  const b = examInput.parse(body);
  return transaction(async (c) => {
    const sources = (
      await c.query(
        "SELECT id,subject,language FROM sources WHERE id=ANY($1::text[])",
        [b.sourceIds],
      )
    ).rows;
    if (
      sources.length !== b.sourceIds.length ||
      sources.some(
        (s) =>
          s.subject !== sources[0].subject ||
          s.language !== sources[0].language,
      )
    )
      throw new AppError(
        "Chọn các chương cùng môn/ngôn ngữ và không lặp nguồn.",
      );
    const rows = (
      await c.query(
        "SELECT content FROM questions WHERE source_id=ANY($1::text[]) AND status='validated' ORDER BY source_id,source_number FOR SHARE",
        [b.sourceIds],
      )
    ).rows;
    const snapshot = selectBalanced(
      b.sourceIds.map((id) =>
        rows.map((r) => r.content as Question).filter((q) => q.sourceId === id),
      ),
      b.count,
    );
    const id = randomUUID();
    await c.query(
      "INSERT INTO managed_exams(id,title,subject,language,minutes,snapshot,status,free_candidate,created_by) VALUES($1,$2,$3,$4,$5,$6,'draft',$7,$8)",
      [
        id,
        b.title,
        sources[0].subject,
        sources[0].language,
        b.minutes,
        JSON.stringify(snapshot),
        b.freeCandidate,
        user.id,
      ],
    );
    await c.query(
      "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
      [
        randomUUID(),
        user.id,
        "exam.create",
        id,
        { title: b.title, count: snapshot.length, sourceIds: b.sourceIds },
      ],
    );
    return { id };
  });
}
export async function readManagedExam(actor: Actor, id: string) {
  requireAdmin(actor);
  z.uuid().parse(id);
  const row = (
    await pool().query("SELECT * FROM managed_exams WHERE id=$1", [id])
  ).rows[0];
  if (!row) throw new AppError("Không tìm thấy đề.", 404);
  return row;
}
export async function updateManagedExam(
  actor: Actor,
  id: string,
  body: unknown,
) {
  const admin = requireAdmin(actor);
  z.uuid().parse(id);
  const b = z
    .object({
      version: z.number().int().positive(),
      status: z.enum(["draft", "published", "retired"]),
      reason: z.string().trim().min(8).max(1000),
    })
    .parse(body);
  return transaction(async (c) => {
    const exam = (
      await c.query("SELECT * FROM managed_exams WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (!exam) throw new AppError("Không có đề.", 404);
    if (exam.version !== b.version)
      throw new AppError("Đề đã có thay đổi, hãy tải lại.", 409);
    if (b.status === "published")
      await assertSnapshotAvailable(c, exam.snapshot);
    await c.query(
      "UPDATE managed_exams SET status=$2,version=version+1,updated_at=now() WHERE id=$1",
      [id, b.status],
    );
    await c.query(
      "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
      [
        randomUUID(),
        admin.id,
        "exam." + b.status,
        id,
        { reason: b.reason, version: b.version + 1 },
      ],
    );
    return { ok: true };
  });
}
async function assertSnapshotAvailable(
  c: { query: typeof import("pg").Pool.prototype.query },
  snapshot: Question[],
) {
  const rows = (
    await c.query(
      "SELECT id,version,status FROM questions WHERE id=ANY($1::text[]) FOR SHARE",
      [snapshot.map((q) => q.id)],
    )
  ).rows;
  if (
    snapshot.some(
      (q) =>
        !rows.some(
          (r) =>
            r.id === q.id &&
            r.status === "validated" &&
            r.version === (q.version || 1),
        ),
    )
  )
    throw new AppError(
      "Câu trong đề đã đổi phiên bản hoặc chưa đủ điều kiện. Tạo bản đề mới từ kho đã duyệt.",
    );
}
export async function publishedExams() {
  return (
    await pool().query(
      "SELECT id,title,subject,language,minutes,jsonb_array_length(snapshot) AS questions FROM managed_exams WHERE status='published' ORDER BY updated_at DESC LIMIT 100",
    )
  ).rows;
}
export async function startManagedExam(
  actor: Actor,
  id: string,
  mode: "practice" | "exam",
) {
  checkLearner(actor.user);
  z.uuid().parse(id);
  return transaction(async (c) => {
    const e = (
      await c.query(
        "SELECT * FROM managed_exams WHERE id=$1 AND status='published' FOR SHARE",
        [id],
      )
    ).rows[0];
    if (!e) throw new AppError("Đề chưa được phát hành.", 404);
    await assertSnapshotAvailable(c, e.snapshot);
    const aid = randomUUID();
    await c.query(
      `INSERT INTO attempts(id,session_hash,user_id,title,mode,subject,language,kind,snapshot,deadline_at,question_count) VALUES($1,$2,$3,$4,$5,$6,$7,'mixed',$8,now()+($9*interval '1 minute'),$10)`,
      [
        aid,
        actor.hash,
        actor.user?.id || null,
        e.title,
        mode,
        e.subject,
        e.language,
        JSON.stringify(e.snapshot),
        e.minutes,
        e.snapshot.length,
      ],
    );
    return { id: aid };
  });
}
export async function submitReport(actor: Actor, body: unknown) {
  checkLearner(actor.user);
  const b = z
    .object({
      attemptId: z.uuid(),
      questionId: z.string().max(100),
      detail: z.string().trim().min(8).max(2000),
    })
    .parse(body);
  const a = (
    await pool().query(
      "SELECT snapshot,user_id,session_hash FROM attempts WHERE id=$1",
      [b.attemptId],
    )
  ).rows[0];
  if (
    !a ||
    (a.user_id
      ? a.user_id !== actor.user?.id
      : a.session_hash !== actor.hash) ||
    !a.snapshot.some((q: Question) => q.id === b.questionId)
  )
    throw new AppError("Không tìm thấy câu trong bài làm của bạn.", 404);
  const id = randomUUID();
  await pool().query(
    "INSERT INTO content_reports(id,attempt_id,question_id,user_id,session_hash,detail) VALUES($1,$2,$3,$4,$5,$6)",
    [
      id,
      b.attemptId,
      b.questionId,
      actor.user?.id || null,
      actor.hash,
      b.detail,
    ],
  );
  return { id };
}
export async function updateReport(actor: Actor, id: string, body: unknown) {
  const user = requireAdmin(actor);
  z.uuid().parse(id);
  const b = z
    .object({
      status: z.enum(["reviewing", "resolved"]),
      resolution: z.string().trim().min(8).max(2000),
    })
    .parse(body);
  return transaction(async (c) => {
    const r = await c.query(
      "UPDATE content_reports SET status=$2,resolution=$3,resolved_by=$4,updated_at=now() WHERE id=$1 RETURNING id",
      [id, b.status, b.resolution, user.id],
    );
    if (!r.rowCount) throw new AppError("Không tìm thấy phản hồi.", 404);
    await c.query(
      "INSERT INTO admin_audit(id,actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4,$5)",
      [
        randomUUID(),
        user.id,
        "report." + b.status,
        id,
        { resolution: b.resolution },
      ],
    );
    return { ok: true };
  });
}
