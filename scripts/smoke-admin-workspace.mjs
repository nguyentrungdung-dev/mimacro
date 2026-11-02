import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import nextEnv from "@next/env";
import pg from "pg";
nextEnv.loadEnvConfig(process.cwd());
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "/Users/trungdung_james/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const origin = process.env.APP_ORIGIN || "http://127.0.0.1:3006";
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 15000,
});
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const admin = await browser.newContext({ baseURL: origin });
const learner = await browser.newContext({ baseURL: origin });
const guest = await browser.newContext({ baseURL: origin });
const run = randomUUID();
const title = "Kiểm thử quản trị " + run;
const user = "qa_" + Date.now();
const checks = [];
const uploads = [];
const sources = [];
const exams = [];
let uid;
let attempt;
let reportId;
let adminHash;
const temp = mkdtempSync(join(tmpdir(), "mimacro-admin-check-"));
const say = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
const post = (path, data, ctx = admin) =>
  ctx.request.post("/api/" + path, { data, headers: { Origin: origin } });
const get = (path, ctx = admin) => ctx.request.get("/api/" + path);
const makeDoc = String.raw`import zipfile,sys
from xml.sax.saxutils import escape
parts=['1) Choose the second option for the '+sys.argv[2]+' fixture.','A)  first  B)  second  C)  third  D)  fourth','Answer Key','1) B','The second option is explicitly requested in this test fixture.']
with zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+''.join('<w:p><w:r><w:t>'+escape(t)+'</w:t></w:r></w:p>' for t in parts)+'</w:body></w:document>')
 z.writestr('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>')
`;
try {
  const credential =
    process.env.ADMIN_SMOKE_PASSWORD ||
    readFileSync(".local/adminsci-credentials.txt", "utf8").match(
      /^Mật khẩu: (.+)$/m,
    )[1];
  assert.equal(
    (
      await post("auth/login", { username: "adminsci", password: credential })
    ).status(),
    200,
  );
  const cookie = (await admin.cookies()).find(
    (c) => c.name === "mimacro-session",
  );
  adminHash = createHash("sha256").update(cookie.value).digest("hex");
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM sessions WHERE token_hash=$1",
        [adminHash],
      )
    ).rows[0].n,
    1,
    "API must use configured DB",
  );
  say(
    "Authenticated admin is connected to DATABASE_URL configured for this run",
  );
  const beforeQuestions = (
    await db.query("SELECT count(*)::int AS n FROM questions")
  ).rows[0].n;
  assert.equal(
    (
      await post("attempts", {
        sourceIds: ["fake"],
        kind: "mixed",
        mode: "exam",
        count: 1,
        minutes: 1,
      })
    ).status(),
    403,
  );
  assert.equal((await get("attempts/" + randomUUID())).status(), 403);
  const bootstrap = await (await get("bootstrap")).json();
  assert.equal(bootstrap.history.length, 0);
  assert.equal(bootstrap.sources.length, 0);
  say(
    "Admin cannot create/read learner attempts; bootstrap contains no learner workspace",
  );
  await guest.request.get("/api/bootstrap");
  for (const path of [
    "admin/overview",
    "admin/sources",
    "admin/users",
    "admin/exams",
    "admin/operations",
    "admin/billing",
    "admin/reports",
    "admin/activity",
  ]) {
    assert.equal((await get(path)).status(), 200, path);
    assert.equal((await get(path, guest)).status(), 403, path);
  }
  say("All admin sections use real backend data and refuse guest access");
  const file = join(temp, "fixture.docx");
  execFileSync("python3", ["-c", makeDoc, file, run]);
  const form = {
    title,
    topic: "Nội dung kiểm thử có nhãn riêng",
    subject: "micro",
    language: "en",
    chapter: "9",
    file: {
      name: "qa-" + run + ".docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: readFileSync(file),
    },
  };
  const denied = await guest.request.post("/api/admin/uploads", {
    multipart: form,
    headers: { Origin: origin },
  });
  assert.equal(denied.status(), 403);
  const cross = await admin.request.post("/api/admin/uploads", {
    multipart: form,
    headers: { Origin: "https://example.invalid" },
  });
  assert.equal(cross.status(), 403);
  const upload = await admin.request.post("/api/admin/uploads", {
    multipart: form,
    headers: { Origin: origin },
    timeout: 120000,
  });
  assert.equal(upload.status(), 200, await upload.text());
  const uploadId = (await upload.json()).id;
  uploads.push(uploadId);
  const imported = (
    await db.query(
      "SELECT status,source_id,report FROM source_uploads WHERE id=$1",
      [uploadId],
    )
  ).rows[0];
  assert.equal(
    imported.status,
    "needs_review",
    JSON.stringify(imported.report),
  );
  sources.push(imported.source_id);
  const sid = imported.source_id;
  const raw = await get("admin/uploads/" + uploadId + "/file");
  assert.equal(raw.status(), 200);
  assert.equal(
    (await get("admin/uploads/" + uploadId + "/file", guest)).status(),
    403,
  );
  const dup = await admin.request.post("/api/admin/uploads", {
    multipart: form,
    headers: { Origin: origin },
  });
  assert.equal((await dup.json()).id, uploadId);
  say(
    "DOCX upload retains private source, imports as needs_review, rejects duplicates/cross-origin/guest access",
  );
  const question = (
    await db.query("SELECT id,content FROM questions WHERE source_id=$1", [sid])
  ).rows[0];
  const qid = question.id;
  let d = await (await get("admin/questions/" + qid)).json();
  assert.equal(
    (
      await post("admin/exams", {
        title,
        sourceIds: [sid],
        count: 1,
        minutes: 5,
      })
    ).status(),
    400,
  );
  assert.equal(
    (
      await post("admin/questions/" + qid + "/validate", {
        expectedVersion: d.version,
        reason: "Đối chiếu fixture theo đáp án gốc",
        confirmed: false,
      })
    ).status(),
    400,
  );
  const page = await admin.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForURL("**/quan-tri");
  await page.getByRole("heading", { name: "Tổng quan", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("link", { name: "Kho đề", exact: true }).count(),
    0,
  );
  await page.goto("/quan-tri/cho-duyet");
  await page.getByRole("heading", { name: "Ngân hàng câu hỏi" }).waitFor();
  await page.getByLabel("Tìm câu hỏi", { exact: true }).fill(qid);
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.locator("a.bank-row").filter({ hasText: run }).first().click();
  await page
    .getByLabel("Lý do / cách xử lý")
    .fill("Duyệt fixture kiểm thử theo nguồn đã biết");
  await page
    .getByLabel("Đã đối chiếu câu, đáp án, lời giải và hình với nguồn")
    .check();
  await page
    .getByRole("button", { name: "Duyệt và phát hành", exact: true })
    .click();
  await page.getByText("Phiên bản 2", { exact: true }).waitFor();
  assert.equal(
    (await db.query("SELECT status FROM questions WHERE id=$1", [qid])).rows[0]
      .status,
    "validated",
  );
  say(
    "Review queue exposes approval; browser approves fixture with source confirmation and version history",
  );
  const created = await post("admin/exams", {
    title,
    sourceIds: [sid],
    count: 1,
    minutes: 5,
    freeCandidate: true,
  });
  assert.equal(created.status(), 200, await created.text());
  const eid = (await created.json()).id;
  exams.push(eid);
  const preview = await (await get("admin/exams/" + eid)).json();
  assert.equal(preview.snapshot[0].answer, "B");
  assert.equal(
    (
      await post("admin/exams/" + eid, {
        status: "published",
        version: 1,
        reason: "Phát hành đề kiểm thử có nguồn duyệt",
      })
    ).status(),
    200,
  );
  assert.equal(
    (
      await post("admin/exams/" + eid, {
        status: "retired",
        version: 1,
        reason: "Kiểm tra phiên bản cũ bị chặn",
      })
    ).status(),
    409,
  );
  const adminAttempts = (
    await db.query("SELECT count(*)::int AS n FROM attempts WHERE user_id=$1", [
      bootstrap.user.id,
    ])
  ).rows[0].n;
  assert.equal(adminAttempts, 0);
  say(
    "Admin creates/previews/publishes managed exam without an attempt; stale status writes rejected",
  );
  const password = randomBytes(16).toString("hex");
  const registered = await post(
    "auth/register",
    { username: user, password, displayName: title },
    learner,
  );
  assert.equal(registered.status(), 200);
  uid = (await registered.json()).user.id;
  assert.equal((await get("admin/users", learner)).status(), 403);
  const begin = await post(
    "attempts",
    { managedExamId: eid, mode: "exam" },
    learner,
  );
  assert.equal(begin.status(), 200);
  attempt = (await begin.json()).id;
  const publicAttempt = await (
    await get("attempts/" + attempt, learner)
  ).json();
  assert.ok(!("answer" in publicAttempt.questions[0]));
  await post(
    "attempts/" + attempt + "/answer",
    { questionId: qid, optionId: "B" },
    learner,
  );
  const result = await (
    await post("attempts/" + attempt + "/submit", {}, learner)
  ).json();
  assert.equal(result.score, 10);
  const feedback = await post(
    "reports",
    {
      attemptId: attempt,
      questionId: qid,
      detail: "Phản hồi fixture để kiểm tra luồng admin",
    },
    learner,
  );
  assert.equal(feedback.status(), 200);
  reportId = (await feedback.json()).id;
  assert.equal(
    (
      await post("admin/reports/" + reportId, {
        status: "resolved",
        resolution: "Đã đối chiếu fixture và giữ nguyên điểm",
      })
    ).status(),
    200,
  );
  say(
    "Learner starts published exam, key remains hidden, scores correctly and submits report admin can resolve",
  );
  assert.equal(
    (
      await post("admin/users/" + uid, {
        role: "student",
        isActive: false,
        reason: "Khóa tài khoản fixture để kiểm thử",
      })
    ).status(),
    200,
  );
  assert.equal((await get("attempts/" + attempt, learner)).status(), 401);
  assert.equal(
    (await post("auth/login", { username: user, password }, learner)).status(),
    401,
  );
  assert.equal(
    (
      await post("admin/users/" + uid, {
        role: "student",
        isActive: true,
        reason: "Mở lại tài khoản fixture để kiểm thử",
      })
    ).status(),
    200,
  );
  assert.equal(
    (await post("auth/login", { username: user, password }, learner)).status(),
    200,
  );
  assert.equal(
    (
      await post("admin/users/" + bootstrap.user.id, {
        role: "student",
        isActive: false,
        reason: "Không được tự khóa quản trị",
      })
    ).status(),
    400,
  );
  say(
    "Account locking revokes sessions and login; unlock works; self-demotion protected",
  );
  const bad = await admin.request.post("/api/admin/uploads", {
    multipart: {
      ...form,
      title: "Lỗi " + run,
      file: {
        name: "broken.docx",
        mimeType: form.file.mimeType,
        buffer: Buffer.from("PK\u0003\u0004broken-" + run),
      },
    },
    headers: { Origin: origin },
  });
  assert.equal(bad.status(), 200);
  const bid = (await bad.json()).id;
  uploads.push(bid);
  assert.equal(
    (await db.query("SELECT status FROM source_uploads WHERE id=$1", [bid]))
      .rows[0].status,
    "failed",
  );
  assert.equal(
    (await post("admin/uploads/" + bid + "/retry", {})).status(),
    200,
  );
  say(
    "Unsupported/corrupt DOCX remains stored with failed report and safe retry",
  );
  const operations = await (await get("admin/operations")).json();
  assert.equal(operations.ai.connected, false);
  const billing = await (await get("admin/billing")).json();
  assert.equal(billing.configured, false);
  assert.ok(
    (await (await get("admin/activity")).json()).rows.some(
      (r) => r.entity_id === eid,
    ),
  );
  say(
    "Operations reports parser jobs/audit honestly; AI and SePay remain explicitly unconnected",
  );
  // Isolated browser coverage. Labels stay QA; source fixtures are removed below.
  mkdirSync(".taste-skill/inspect/admin-workspace", { recursive: true });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
    for (const area of [
      "",
      "/nguon",
      "/cho-duyet",
      "/de",
      "/nguoi-dung",
      "/tac-vu",
      "/thanh-toan",
      "/phan-hoi",
      "/nhat-ky",
    ]) {
      await page.goto("/quan-tri" + area);
      await page.waitForSelector(".admin-canvas");
      const headingByArea = {
        "": "Ngân hàng và người học",
        "/nguon": "Đăng tải bank câu hỏi",
        "/cho-duyet": "Danh sách câu hỏi",
        "/de": "Tạo bản đề từ kho đã duyệt",
        "/nguoi-dung": "Tài khoản",
        "/tac-vu": "AI và hạn mức vận hành",
        "/thanh-toan": "Gói và đối soát SePay",
        "/phan-hoi": "Vấn đề từ nguồn / kiểm tra nội dung",
        "/nhat-ky": "Thao tác quản trị gần nhất",
      };
      await page
        .getByRole("heading", { name: headingByArea[area], exact: true })
        .waitFor();
      await page
        .locator(".admin-canvas .skeleton")
        .waitFor({ state: "hidden" });
      if (width === 1440)
        assert.ok(
          await page
            .getByRole("link", { name: "Nguồn & nhập bank", exact: true })
            .isVisible(),
        );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${area} at ${width}`,
      );
      await page.screenshot({
        path: `.taste-skill/inspect/admin-workspace/${area.slice(1) || "overview"}-${width}.png`,
        fullPage: true,
      });
    }
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  say("All nine admin areas fit desktop/tablet/phone without runtime errors");
  await page.goto("/quan-tri/nguon");
  await page.waitForSelector(".admin-upload");
  await page.route("**/api/admin/sources?*", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Lỗi mạng mô phỏng" }),
    }),
  );
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await page.getByText("Lỗi mạng mô phỏng", { exact: true }).waitFor();
  await page.unroute("**/api/admin/sources?*");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await page
    .getByText("Lỗi mạng mô phỏng", { exact: true })
    .waitFor({ state: "hidden" });
  say("Admin data block recovers from a network error via Retry");
  mkdirSync(".local/reports", { recursive: true });
  writeFileSync(
    ".local/reports/admin-workspace-smoke.json",
    JSON.stringify(
      { at: new Date().toISOString(), run, checks, costUSD: 0 },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  const cookies = await admin.cookies();
  writeFileSync(
    ".local/reports/admin-inspect-session.json",
    JSON.stringify({
      cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
      username: "adminsci",
    }),
    { mode: 0o600 },
  );
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM questions")).rows[0].n,
    beforeQuestions + 1,
  );
} finally {
  // Cleanup uses exact IDs returned for this run, never source bank or real user data.
  await db.query("BEGIN");
  try {
    if (reportId)
      await db.query("DELETE FROM content_reports WHERE id=$1", [reportId]);
    if (attempt)
      await db.query("DELETE FROM attempts WHERE id=$1 AND user_id=$2", [
        attempt,
        uid,
      ]);
    if (exams.length)
      await db.query(
        "DELETE FROM managed_exams WHERE id=ANY($1::uuid[]) AND title=$2",
        [exams, title],
      );
    if (uploads.length)
      await db.query("DELETE FROM source_uploads WHERE id=ANY($1::uuid[])", [
        uploads,
      ]);
    if (sources.length) {
      await db.query(
        "DELETE FROM content_issues WHERE source_id=ANY($1::text[])",
        [sources],
      );
      await db.query(
        "DELETE FROM question_revisions WHERE question_id IN (SELECT id FROM questions WHERE source_id=ANY($1::text[]))",
        [sources],
      );
      await db.query("DELETE FROM questions WHERE source_id=ANY($1::text[])", [
        sources,
      ]);
      await db.query(
        "DELETE FROM sources WHERE id=ANY($1::text[]) AND title=$2",
        [sources, title],
      );
    }
    const entities = [
      ...sources,
      ...exams,
      ...uploads,
      ...(uid ? [uid] : []),
      ...(reportId ? [reportId] : []),
    ];
    if (sources.length) {
      const hashes = sources.map((s) => s + "-q1");
      entities.push(...hashes);
    }
    if (entities.length)
      await db.query(
        "DELETE FROM admin_audit WHERE entity_id=ANY($1::text[])",
        [entities],
      );
    if (uid) {
      await db.query("DELETE FROM sessions WHERE user_id=$1", [uid]);
      await db.query("DELETE FROM auth_limits WHERE key=$1", [user]);
      await db.query("DELETE FROM users WHERE id=$1 AND username=$2", [
        uid,
        user,
      ]);
    }
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    console.error("Fixture cleanup failed:", e.code || "unknown");
  }
  await db.end();
  await browser.close();
  rmSync(temp, { recursive: true, force: true });
}
