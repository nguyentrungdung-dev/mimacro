import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { pool, transaction } from "../src/server/db";
nextEnv.loadEnvConfig(process.cwd());
const data = JSON.parse(
  await readFile(process.argv[2] || "data/imports/frank.json", "utf8"),
);
try {
  await transaction(async (c) => {
    for (const s of data.sources)
      await c.query(
        `INSERT INTO sources(id,title,subject,language,chapter,topic,file_hash,question_count,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING`,
        [
          s.id,
          s.title,
          s.subject,
          s.language,
          s.chapter,
          s.topic,
          s.fileHash,
          s.questionCount,
          s.metadata,
        ],
      );
    for (const q of data.questions) {
      const review = data.issues.some(
        (i: { questionId: string }) => i.questionId === q.id,
      );
      await c.query(
        `INSERT INTO questions(id,source_id,source_number,family_key,status,content) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING`,
        [
          q.id,
          q.sourceId,
          q.number,
          q.familyKey,
          review ? "needs_review" : "validated",
          { ...q, version: 1 },
        ],
      );
    }
    // Future imports also retain their initial snapshot after migration 003.
    for (const q of data.questions)
      await c.query(
        `INSERT INTO question_revisions(question_id,version,content,status,reason)
      SELECT id,version,content,status,'Bản nhập ban đầu; chưa nghiệm thu học thuật toàn bộ' FROM questions
      WHERE id=$1 AND version=1 ON CONFLICT DO NOTHING`,
        [q.id],
      );
    for (const m of data.media)
      await c.query(
        "INSERT INTO media(id,relative_path,mime) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING",
        [m.id, m.relativePath, m.mime],
      );
    for (const i of data.issues)
      await c.query(
        `INSERT INTO content_issues(id,source_id,question_id,kind,detail) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`,
        [i.id, i.sourceId, i.questionId, i.kind, i.detail],
      );
  });
  const r = await pool().query(
    "SELECT status,count(*)::int AS count FROM questions GROUP BY status",
  );
  console.log({
    sources: data.sources.length,
    questions: r.rows,
    media: data.media.length,
  });
} finally {
  await pool().end();
}
