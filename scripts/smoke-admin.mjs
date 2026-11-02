import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import nextEnv from "@next/env";
import pg from "pg";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL?.includes("@127.0.0.1:55438/mimacro"))
  throw Error("Admin smoke only runs against dedicated local DB.");
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/trungdung_james/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const origin = "http://127.0.0.1:3006";
const admin = await browser.newContext({ baseURL: origin });
const guest = await browser.newContext({ baseURL: origin });
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const bank = JSON.parse(readFileSync("data/imports/frank.json", "utf8"));
const run = randomUUID(),
  sid = "admin-smoke-" + run,
  qid = sid + "-q1";
const username = "smoke_admin_" + Date.now();
const pass = randomBytes(20).toString("hex");
const checks = [];
const report = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
const post = (path, data, ctx = admin) =>
  ctx.request.post("/api/" + path, { data, headers: { origin } });
const get = (suffix) => admin.request.get("/api/admin/questions" + suffix);
const question = async () => (await get("/" + qid)).json();
const edit = (d) => ({
  expectedVersion: d.version,
  reason: "Đối chiếu mẫu kiểm thử tự động",
  html: d.content.html,
  text: d.content.text,
  options: d.content.options.map((o) => ({ ...o, html: o.html || o.text })),
  answer: d.content.answer,
  explanation: d.content.explanation,
  explanationHtml: d.content.explanationHtml,
  topic: d.content.topic,
});
const mutate = (action, body) =>
  post("admin/questions/" + qid + "/" + action, body);
const common = (d) => ({
  expectedVersion: d.version,
  reason: "Đối chiếu mẫu kiểm thử tự động",
  confirmed: true,
  resolveIssues: true,
});
let createdAttempt;
try {
  await guest.request.get("/api/bootstrap");
  assert.equal((await guest.request.get("/api/admin/questions")).status(), 403);
  assert.equal(
    (
      await guest.request.get("/api/admin/questions/" + bank.questions[0].id)
    ).status(),
    403,
  );
  assert.equal(
    (
      await post(
        "admin/questions/" + bank.questions[0].id + "/check",
        { expectedVersion: 1, reason: "Không có quyền kiểm tra" },
        guest,
      )
    ).status(),
    403,
  );
  report("Guest cannot list, read keys or mutate bank");
  assert.equal(
    (
      await post("auth/register", {
        username,
        password: pass,
        displayName: "Kiểm thử quản trị",
      })
    ).status(),
    200,
  );
  assert.equal((await get("")).status(), 403);
  report("Registration never grants admin; student cannot read bank");
  await db.query("UPDATE users SET role='admin' WHERE username=$1", [username]);
  const mediaId = bank.questions.find((q) => q.mediaIds.length).mediaIds[0];
  assert.equal(
    (await admin.request.get("/api/media/" + mediaId)).status(),
    200,
  );
  assert.equal(
    (await guest.request.get("/api/media/" + mediaId)).status(),
    404,
  );
  report("Admin can read source media while a guest without an attempt cannot");
  const source = bank.sources[0];
  const q = {
    ...bank.questions.find(
      (q) => q.sourceId === source.id && !q.mediaIds.length,
    ),
    id: qid,
    sourceId: sid,
    sourceTitle: "Mẫu kiểm thử quản trị",
    number: 1,
    version: 1,
  };
  await db.query(
    `INSERT INTO sources(id,title,subject,language,chapter,topic,file_hash,question_count,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,1,$8)`,
    [
      sid,
      q.sourceTitle,
      source.subject,
      source.language,
      source.chapter,
      source.topic,
      createHash("sha256").update(run).digest("hex"),
      { testRun: run },
    ],
  );
  await db.query(
    "INSERT INTO questions(id,source_id,source_number,family_key,status,content) VALUES($1,$2,1,$3,'validated',$4)",
    [qid, sid, q.familyKey, q],
  );
  await db.query(
    "INSERT INTO question_revisions(question_id,version,content,status,reason) VALUES($1,1,$2,'validated','Mẫu kiểm thử; không phải nội dung phát hành')",
    [qid, q],
  );
  const a = await post("attempts", {
    sourceIds: [sid],
    kind: "original",
    mode: "exam",
    count: 1,
    minutes: 45,
  });
  assert.equal(a.status(), 200);
  createdAttempt = (await a.json()).id;
  const snapshot = (
    await db.query("SELECT snapshot FROM attempts WHERE id=$1", [
      createdAttempt,
    ])
  ).rows[0].snapshot;
  let d = await question();
  const initial = JSON.stringify(d.revisions[0]);
  assert.equal(
    (
      await mutate("save", {
        ...edit(d),
        options: [...edit(d).options].reverse(),
      })
    ).status(),
    400,
  );
  assert.equal(
    (
      await mutate("save", { ...edit(d), html: '<p onclick="alert(1)">x</p>' })
    ).status(),
    400,
  );
  assert.equal(
    (
      await mutate("save", {
        ...edit(d),
        html: `<img src="/api/media/${"a".repeat(64)}" alt="x"/>`,
      })
    ).status(),
    400,
  );
  report(
    "Stable option IDs/order, active HTML and foreign media are protected",
  );
  const invalid = { ...edit(d), explanation: "", explanationHtml: "" };
  let r = await mutate("save", invalid);
  assert.equal(r.status(), 200);
  let result = await r.json();
  assert.equal(result.status, "needs_review");
  assert.ok(result.checks.some((c) => c.code === "explanation"));
  d = await question();
  assert.equal(d.version, 2);
  assert.equal(d.content.familyKey, q.familyKey);
  assert.equal(JSON.stringify(d.revisions.at(-1)), initial);
  assert.equal((await mutate("save", invalid)).status(), 409);
  assert.equal((await mutate("validate", common(d))).status(), 400);
  assert.equal(
    (
      await post("attempts", {
        sourceIds: [sid],
        kind: "mixed",
        mode: "exam",
        count: 1,
        minutes: 45,
      })
    ).status(),
    400,
  );
  report(
    "Failed draft preserved, excluded from assembly; stale writes and invalid publication rejected",
  );
  r = await mutate("save", {
    ...edit(d),
    answer: q.options.find((o) => o.id !== q.answer).id,
    explanation: q.explanation,
    explanationHtml: q.explanationHtml,
  });
  assert.equal(r.status(), 200);
  d = await question();
  await db.query(
    "INSERT INTO content_issues(id,source_id,question_id,kind,detail) VALUES($1,$2,$3,'smoke','Vấn đề mẫu để kiểm tra lưu bằng chứng')",
    [sid + "-issue", sid, qid],
  );
  assert.equal(
    (await mutate("validate", { ...common(d), resolveIssues: false })).status(),
    400,
  );
  assert.equal(
    (await mutate("validate", { ...common(d), confirmed: false })).status(),
    400,
  );
  r = await mutate("validate", common(d));
  assert.equal(r.status(), 200);
  d = await question();
  assert.equal(d.status, "validated");
  assert.equal(d.issues[0].status, "resolved");
  assert.equal(d.issues[0].resolved_version, d.version);
  assert.ok(d.issues[0].resolution);
  report(
    "Publication requires source confirmation and recorded issue resolution",
  );
  const concurrent = await Promise.all([
    mutate("check", common(d)),
    mutate("check", common(d)),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status()).sort(), [200, 409]);
  report("Concurrent edits serialize and reject one stale version");
  const old = (
    await db.query("SELECT snapshot FROM attempts WHERE id=$1", [
      createdAttempt,
    ])
  ).rows[0].snapshot;
  assert.deepEqual(old, snapshot);
  await post(`attempts/${createdAttempt}/answer`, {
    questionId: qid,
    optionId: q.answer,
  });
  const submitted = await (
    await post(`attempts/${createdAttempt}/submit`, {})
  ).json();
  assert.equal(submitted.score, 10);
  assert.equal(submitted.questions[0].review.answer, q.answer);
  report(
    "Existing attempt snapshot and grade retain original key after bank change",
  );
  d = await question();
  const page = await admin.newPage();
  await page.goto("/quan-tri/ngan-hang/" + qid);
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  await page
    .getByLabel("Chủ đề", { exact: true })
    .fill("Chủ đề được sửa qua giao diện kiểm thử");
  await page
    .getByLabel("Lý do / cách xử lý")
    .fill("Kiểm thử lưu từ trình duyệt bằng bàn phím");
  await page.getByRole("button", { name: "Lưu phiên bản mới" }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByText("Phiên bản " + (d.version + 1), { exact: true })
    .waitFor();
  d = await question();
  assert.equal(d.status, "needs_review");
  assert.equal(d.content.topic, "Chủ đề được sửa qua giao diện kiểm thử");
  await page.getByRole("button", { name: /Lịch sử \(/ }).click();
  await page.getByText("v1 · Đủ điều kiện", { exact: true }).click();
  assert.ok(
    await page
      .getByText("Mẫu kiểm thử; không phải nội dung phát hành", { exact: true })
      .isVisible(),
  );
  report("Browser edits by keyboard and reads complete prior version");
  d = await question();
  await mutate("retire", common(d));
  assert.equal((await question()).status, "retired");
  report("Retired question remains auditable and unavailable to new exams");
  await db.query(
    "UPDATE questions SET content=jsonb_set(content,'{mediaIds}',$2::jsonb) WHERE id=$1",
    [qid, JSON.stringify(["a".repeat(64)])],
  );
  d = await question();
  const missing = await (await mutate("check", common(d))).json();
  assert.ok(missing.checks.some((c) => c.code === "media"));
  assert.ok(missing.checks.some((c) => c.code === "media_missing"));
  report("Recheck detects missing source image and private media bytes");

  await page.goto("/quan-tri/ngan-hang");
  await page.getByRole("button", { name: "Chờ kiểm tra", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("a.bank-row").length === 2,
  );
  report("Real review queue contains the two original unresolved questions");
  await page.getByRole("button", { name: "Tất cả", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("a.bank-row").length === 25,
  );
  await page.getByRole("button", { name: "Trang sau" }).click();
  await page.waitForFunction(() =>
    document.querySelector(".bank-pagination")?.textContent.includes("26–50"),
  );
  report("Pagination and review filter use real bank data");
  await page
    .getByLabel("Tìm câu hỏi", { exact: true })
    .fill("zz-no-question-" + run);
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.getByText("Không có câu hỏi phù hợp bộ lọc này.").waitFor();
  report("Empty search renders honest zero result");
  await page.route("**/api/admin/questions?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Lỗi mạng mô phỏng trong kiểm thử" }),
    }),
  );
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await page.getByText("Lỗi mạng mô phỏng trong kiểm thử").waitFor();
  await page.unroute("**/api/admin/questions?*");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await page
    .getByText("Lỗi mạng mô phỏng trong kiểm thử")
    .waitFor({ state: "hidden" });
  report("Network error stays in bank block and retry recovers");
  await page.getByLabel("Tìm câu hỏi", { exact: true }).fill("");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll("a.bank-row").length === 25,
  );
  mkdirSync(".taste-skill/inspect/admin", { recursive: true });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
    await page.screenshot({
      path: `.taste-skill/inspect/admin/list-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `List overflow at ${width}`,
    );
    await page.goto("/quan-tri/ngan-hang/" + bank.issues[0].questionId);
    await page.getByRole("heading", { name: "Câu hỏi và lời giải" }).waitFor();
    await page.screenshot({
      path: `.taste-skill/inspect/admin/detail-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Detail overflow at ${width}`,
    );
    await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
    await page.screenshot({
      path: `.taste-skill/inspect/admin/edit-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Edit overflow at ${width}`,
    );
    await page.goto("/quan-tri/ngan-hang");
    await page.waitForFunction(
      () => document.querySelectorAll("a.bank-row").length === 25,
    );
  }
  report(
    "List/detail/editor render without horizontal overflow at desktop/tablet/phone",
  );
  const cookies = await admin.cookies();
  mkdirSync(".local/reports", { recursive: true });
  writeFileSync(
    ".local/reports/admin-inspect-session.json",
    JSON.stringify({
      cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
      username,
    }),
    { mode: 0o600 },
  );
  writeFileSync(
    ".local/reports/admin-smoke.json",
    JSON.stringify(
      { at: new Date().toISOString(), checks, fixtureRun: run, costUSD: 0 },
      null,
      2,
    ),
  );
} finally {
  // Remove only fixtures created by this run. Real bank, user attempts and source evidence are untouched.
  if (createdAttempt)
    await db.query(
      "DELETE FROM attempts WHERE id=$1 AND snapshot->0->>'sourceId'=$2",
      [createdAttempt, sid],
    );
  await db.query("DELETE FROM content_issues WHERE source_id=$1", [sid]);
  await db.query("DELETE FROM question_revisions WHERE question_id=$1", [qid]);
  await db.query("DELETE FROM questions WHERE id=$1 AND source_id=$2", [
    qid,
    sid,
  ]);
  await db.query(
    "DELETE FROM sources WHERE id=$1 AND metadata->>'testRun'=$2",
    [sid, run],
  );
  await db.end();
  await browser.close();
}
