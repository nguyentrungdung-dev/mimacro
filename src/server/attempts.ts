import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool, transaction } from "./db";
import type { Actor } from "./auth";
import { AppError, grade, publicQuestions, selectBalanced } from "../lib/exams";
import type {
  Question,
  AnswerRecord,
  AttemptView,
  SourceView,
  HistoryRow,
} from "../lib/types";
type Row = {
  id: string;
  session_hash: string;
  user_id: string | null;
  title: string;
  mode: "practice" | "exam";
  subject: "micro" | "macro";
  language: "en" | "vi";
  status: "in_progress" | "completed";
  snapshot: Question[];
  responses: Record<string, AnswerRecord>;
  started_at: Date;
  deadline_at: Date;
  score: string | null;
  correct_count: number | null;
};
export async function catalog(): Promise<SourceView[]> {
  const r = await pool()
    .query(`SELECT s.id,s.title,s.subject,s.language,s.chapter,s.topic,s.question_count,
 (SELECT count(*)::int FROM questions q WHERE q.source_id=s.id AND q.status='validated') AS available,
 (SELECT count(*)::int FROM content_issues i WHERE i.source_id=s.id AND i.status='open') AS issues FROM sources s ORDER BY s.subject,s.chapter`);
  return r.rows.map((r) => ({
    id: r.id,
    title: r.title,
    subject: r.subject,
    language: r.language,
    chapter: r.chapter,
    topic: r.topic,
    questionCount: r.question_count,
    available: r.available,
    issues: r.issues,
  }));
}
export async function createAttempt(
  actor: Actor,
  input: {
    sourceIds: string[];
    mode: "practice" | "exam";
    kind: "original" | "mixed";
    count: number;
    minutes: number;
    difficulty: "unrated" | "any";
    choicePercent: number;
  },
) {
  if (input.choicePercent !== 100)
    throw new AppError(
      "Kho đã nhập hiện chỉ có câu trắc nghiệm; chưa đủ dữ liệu cho tỷ lệ dạng bài này.",
    );
  const sources = await catalog();
  const chosen = input.sourceIds.map((id) => sources.find((s) => s.id === id));
  if (chosen.some((s) => !s) || !chosen.length)
    throw new AppError("Chọn ít nhất một chương có trong kho.");
  const base = chosen[0]!;
  if (
    chosen.some(
      (s) => s!.subject !== base.subject || s!.language !== base.language,
    )
  )
    throw new AppError("Một đề chỉ dùng một môn và ngôn ngữ.");
  let questions: Question[];
  let title: string;
  if (input.kind === "original") {
    if (chosen.length !== 1) throw new AppError("Đề gốc chỉ dùng một nguồn.");
    const r = await pool().query(
      "SELECT content,status FROM questions WHERE source_id=$1 ORDER BY source_number",
      [base.id],
    );
    if (r.rows.some((q) => q.status !== "validated"))
      throw new AppError(
        "Nguồn này có câu đang chờ kiểm tra. Chọn chương khác hoặc tạo đề mới từ các câu hợp lệ.",
      );
    questions = r.rows.map((q) => q.content);
    title = base.title;
  } else {
    const r = await pool().query(
      `SELECT content FROM questions WHERE source_id=ANY($1::text[]) AND status='validated' ORDER BY source_id,source_number`,
      [input.sourceIds],
    );
    questions = selectBalanced(
      input.sourceIds.map((id) =>
        r.rows
          .map((q) => q.content as Question)
          .filter((q) => q.sourceId === id),
      ),
      input.count,
    );
    title = `${base.subject === "micro" ? "Vi mô" : "Vĩ mô"} · Đề tổng hợp ${questions.length} câu`;
  }
  if (!questions.length) throw new AppError("Chưa có câu đủ điều kiện.");
  const id = randomUUID();
  await pool().query(
    `INSERT INTO attempts(id,session_hash,user_id,title,mode,subject,language,kind,snapshot,deadline_at,question_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()+($10 * interval '1 minute'),$11)`,
    [
      id,
      actor.hash,
      actor.user?.id || null,
      title,
      input.mode,
      base.subject,
      base.language,
      input.kind,
      JSON.stringify(questions),
      input.minutes,
      questions.length,
    ],
  );
  return id;
}
function owns(r: Row, a: Actor) {
  return r.user_id ? r.user_id === a.user?.id : r.session_hash === a.hash;
}
async function locked(c: PoolClient, id: string, actor: Actor): Promise<Row> {
  const r = (
    await c.query("SELECT * FROM attempts WHERE id=$1 FOR UPDATE", [id])
  ).rows[0] as Row | undefined;
  if (!r || !owns(r, actor))
    throw new AppError("Không tìm thấy lượt làm bài.", 404);
  return r;
}
async function finish(c: PoolClient, r: Row) {
  const g = grade(r.snapshot, r.responses);
  await c.query(
    `UPDATE attempts SET status='completed',submitted_at=now(),score=$2,correct_count=$3 WHERE id=$1`,
    [r.id, g.score, g.correctCount],
  );
  r.status = "completed";
  r.score = String(g.score);
  r.correct_count = g.correctCount;
}
function view(r: Row): AttemptView {
  return {
    id: r.id,
    title: r.title,
    mode: r.mode,
    subject: r.subject,
    language: r.language,
    status: r.status,
    startedAt: r.started_at.toISOString(),
    deadlineAt: r.deadline_at.toISOString(),
    serverNow: new Date().toISOString(),
    responses: r.responses,
    questions: publicQuestions(
      r.snapshot,
      r.responses,
      r.mode,
      r.status === "completed",
    ),
    score: r.score === null ? null : Number(r.score),
    correctCount: r.correct_count,
  };
}
export async function readAttempt(id: string, actor: Actor) {
  return transaction(async (c) => {
    const r = await locked(c, id, actor);
    if (r.status === "in_progress" && r.deadline_at.getTime() <= Date.now())
      await finish(c, r);
    return view(r);
  });
}
export async function answerAttempt(
  id: string,
  actor: Actor,
  qid: string,
  optionId: string,
) {
  return transaction(async (c) => {
    const r = await locked(c, id, actor);
    if (r.status === "completed") return view(r);
    if (r.deadline_at.getTime() <= Date.now()) {
      await finish(c, r);
      return view(r);
    }
    const q = r.snapshot.find((q) => q.id === qid);
    if (!q || !q.options.some((o) => o.id === optionId))
      throw new AppError("Lựa chọn không hợp lệ.");
    if (r.mode === "practice" && r.responses[qid]) return view(r);
    r.responses[qid] = { optionId, answeredAt: new Date().toISOString() };
    await c.query("UPDATE attempts SET responses=$2 WHERE id=$1", [
      id,
      r.responses,
    ]);
    return view(r);
  });
}
export async function submitAttempt(id: string, actor: Actor) {
  return transaction(async (c) => {
    const r = await locked(c, id, actor);
    if (r.status !== "completed") await finish(c, r);
    return view(r);
  });
}
export async function history(actor: Actor): Promise<HistoryRow[]> {
  const r = actor.user
    ? await pool().query(
        "SELECT * FROM attempts WHERE user_id=$1 ORDER BY started_at DESC LIMIT 100",
        [actor.user.id],
      )
    : await pool().query(
        "SELECT * FROM attempts WHERE session_hash=$1 AND user_id IS NULL ORDER BY started_at DESC LIMIT 100",
        [actor.hash],
      );
  return r.rows.map((r) => ({
    id: r.id,
    title: r.title,
    mode: r.mode,
    subject: r.subject,
    status: r.status,
    startedAt: r.started_at.toISOString(),
    score: r.score === null ? null : Number(r.score),
    correctCount: r.correct_count,
    questionCount: r.question_count,
  }));
}
export async function topicStats(actor: Actor) {
  const r = actor.user
    ? await pool().query(
        `SELECT snapshot,responses FROM attempts WHERE user_id=$1 AND status='completed'`,
        [actor.user.id],
      )
    : await pool().query(
        `SELECT snapshot,responses FROM attempts WHERE session_hash=$1 AND user_id IS NULL AND status='completed'`,
        [actor.hash],
      );
  const map = new Map<
    string,
    { topic: string; total: number; correct: number }
  >();
  for (const row of r.rows)
    for (const q of row.snapshot as Question[]) {
      const item = map.get(q.topic) || { topic: q.topic, total: 0, correct: 0 };
      item.total++;
      if (row.responses[q.id]?.optionId === q.answer) item.correct++;
      map.set(q.topic, item);
    }
  return [...map.values()];
}
