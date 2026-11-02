import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import nextEnv from "@next/env";
import pg from "pg";
nextEnv.loadEnvConfig(process.cwd());
const origin = "http://127.0.0.1:3006";
if (!process.env.DATABASE_URL?.includes("@127.0.0.1:55438/mimacro"))
  throw Error("Smoke only runs against the dedicated local database.");
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
const context = await browser.newContext({
  baseURL: origin,
  viewport: { width: 1440, height: 1000 },
});
const other = await browser.newContext({ baseURL: origin });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const checks = [];
const report = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
const post = (path, data, ctx = context) =>
  ctx.request.post("/api/" + path, { data, headers: { origin } });
const bank = JSON.parse(readFileSync("data/imports/frank.json", "utf8"));
let uiAttempt;
try {
  const boot = await (await context.request.get("/api/bootstrap")).json();
  assert.equal(boot.sources.length, 10);
  report("10 sources served from PostgreSQL");
  const source = boot.sources.find(
    (s) => s.subject === "micro" && s.chapter === 2,
  );
  const create = {
    sourceIds: [source.id],
    mode: "exam",
    kind: "original",
    count: 30,
    minutes: 45,
  };
  const created = await post("attempts", create);
  assert.equal(created.status(), 200);
  const { id } = await created.json();
  uiAttempt = id;
  let a = await (await context.request.get("/api/attempts/" + id)).json();
  assert.equal(a.questions.length, 174);
  assert.ok(
    a.questions.every(
      (q) =>
        !("answer" in q) &&
        !("explanation" in q) &&
        !("explanationHtml" in q) &&
        !("solutionMediaIds" in q) &&
        !("review" in q),
    ),
  );
  report("exam projection hides all answer and solution fields");
  const q = a.questions[0],
    key = bank.questions.find((x) => x.id === q.id).answer;
  a = await (
    await post(`attempts/${id}/answer`, { questionId: q.id, optionId: key })
  ).json();
  assert.equal(a.responses[q.id].optionId, key);
  assert.ok(!a.questions[0].review);
  report("answer saved without revealing exam key");
  assert.equal(
    (await context.request.get("/api/attempts/" + id)).status(),
    200,
  );
  await other.request.get("/api/bootstrap");
  assert.equal((await other.request.get("/api/attempts/" + id)).status(), 404);
  report("another guest cannot access attempt");
  const bad = await context.request.post("/api/attempts", {
    data: create,
    headers: { origin: "https://example.invalid" },
  });
  assert.equal(bad.status(), 403);
  report("cross-origin mutation rejected");
  const media = a.questions.find((x) => x.mediaIds.length)?.mediaIds[0];
  assert.ok(media);
  assert.equal(
    (await context.request.get("/api/media/" + media)).status(),
    200,
  );
  assert.equal((await other.request.get("/api/media/" + media)).status(), 404);
  report("question media requires an assigned owned attempt");
  const p = await (
    await post("attempts", { ...create, mode: "practice" })
  ).json();
  let practice = await (
    await context.request.get("/api/attempts/" + p.id)
  ).json();
  const pq = practice.questions[0];
  practice = await (
    await post(`attempts/${p.id}/answer`, {
      questionId: pq.id,
      optionId: pq.options[0].id,
    })
  ).json();
  assert.ok(practice.questions[0].review);
  assert.ok(!practice.questions[1].review);
  practice = await (
    await post(`attempts/${p.id}/answer`, {
      questionId: pq.id,
      optionId: pq.options[1].id,
    })
  ).json();
  assert.equal(practice.responses[pq.id].optionId, pq.options[0].id);
  report("practice reveals only submitted question and locks its first answer");
  const mixed = await post("attempts", {
    ...create,
    sourceIds: boot.sources
      .filter((s) => s.subject === "micro" && s.chapter <= 3)
      .map((s) => s.id),
    kind: "mixed",
    count: 12,
  });
  assert.equal(mixed.status(), 200);
  const mid = (await mixed.json()).id;
  const m = await (await context.request.get("/api/attempts/" + mid)).json();
  assert.equal(m.questions.length, 12);
  assert.equal(new Set(m.questions.map((x) => x.chapter)).size, 3);
  assert.ok(!m.questions.some((x) => x.chapter === 3 && x.number === 195));
  report(
    "mixed exam covers selected chapters and excludes quarantined content",
  );
  const invalid = await post("attempts", {
    ...create,
    kind: "mixed",
    count: 250,
  });
  assert.equal(invalid.status(), 400);
  report("impossible assembly returns a clear error");
  await pool.query(
    `UPDATE attempts SET deadline_at=now()-interval '1 second' WHERE id=$1`,
    [mid],
  );
  const expired = await (
    await context.request.get("/api/attempts/" + mid)
  ).json();
  assert.equal(expired.status, "completed");
  assert.equal(expired.score, 0);
  report("server deadline finalizes attempt");
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  await page.goto(origin + "/bai-lam/" + id);
  await page.getByRole("heading", { name: "Câu 1 / 174" }).waitFor();
  await page.locator(".option").first().click();
  await page.getByText("Đã lưu câu trả lời", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Câu 1 / 174" }).waitFor();
  assert.ok(await page.getByRole("radio").first().isChecked());
  report("browser answer survives page reload");
  await page.getByRole("button", { name: "Câu tiếp", exact: true }).click();
  await page.route("**/api/attempts/*/answer", (route) => route.abort());
  await page.locator(".option").first().click();
  await page
    .getByRole("button", { name: "Thử lưu lại", exact: true })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Nộp bài", exact: true })
      .isDisabled(),
  );
  await page.unroute("**/api/attempts/*/answer");
  await page.getByRole("button", { name: "Thử lưu lại", exact: true }).click();
  await page.getByText("Đã lưu câu trả lời", { exact: true }).waitFor();
  report("failed autosave preserves draft and blocks submit until saved");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await page
    .getByRole("button", { name: "Xác nhận nộp bài", exact: true })
    .click();
  await page.getByText("Điểm bài làm", { exact: true }).waitFor();
  await page.getByText("Đáp án đúng:", { exact: false }).waitFor();
  const before = await (
    await context.request.get("/api/attempts/" + id)
  ).json();
  const again = await (await post(`attempts/${id}/submit`, {})).json();
  assert.equal(before.score, again.score);
  assert.equal(before.status, "completed");
  const expectedCorrect = before.questions.filter(
    (q) =>
      before.responses[q.id]?.optionId ===
      bank.questions.find((b) => b.id === q.id).answer,
  ).length;
  assert.equal(before.correctCount, expectedCorrect);
  assert.equal(
    before.score,
    Math.round((expectedCorrect / before.questions.length) * 1000) / 100,
  );
  report("submit, explanation display and repeated-submit idempotency");
  mkdirSync(".taste-skill/inspect", { recursive: true });
  await page.screenshot({
    path: ".taste-skill/inspect/result-desktop.png",
    fullPage: true,
  });
  const graphIndex = before.questions.findIndex((q) => q.mediaIds.length);
  await page.locator(".question-grid button").nth(graphIndex).click();
  await page.locator(".question-content img").first().waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".question-content img")].every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `.taste-skill/inspect/graph-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  report("source diagram renders in owned result on desktop, tablet and phone");
  await page.goto(origin + "/");
  await page.getByRole("heading", { name: "Ngân hàng vi mô" }).waitFor();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `.taste-skill/inspect/catalog-${width}.png`,
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page
    .getByRole("button", { name: "Mở bộ gốc", exact: true })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() =>
      document
        .querySelector('[role="dialog"]')
        .contains(document.activeElement),
    ),
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  report("start dialog traps keyboard focus and closes with Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + "/tao-de");
  await page.getByRole("heading", { name: "Tạo đề của bạn" }).waitFor();
  await page.screenshot({
    path: ".taste-skill/inspect/builder-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".taste-skill/inspect/builder-phone.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  report("catalog and builder fit desktop, tablet and phone");
  await page.goto(origin + "/tai-khoan");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  const username = "smoke_" + Date.now();
  const password = "Smoke_" + crypto.randomUUID();
  await page
    .getByLabel("Tên hiển thị", { exact: true })
    .fill("Kiểm thử tự động");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await page.getByRole("heading", { name: "Tài khoản của bạn" }).waitFor();
  const userBoot = await (await context.request.get("/api/bootstrap")).json();
  assert.equal(userBoot.user.username, username);
  assert.equal(userBoot.history.length, 0);
  assert.equal(
    (await context.request.get("/api/attempts/" + id)).status(),
    404,
  );
  report(
    "registration creates isolated account without implicit guest-history merge",
  );
  const accountExam = await (
    await post("attempts", { ...create, kind: "mixed", count: 5 })
  ).json();
  const accountView = await (
    await context.request.get("/api/attempts/" + accountExam.id)
  ).json();
  assert.equal(accountView.questions.length, 5);
  await post(`attempts/${accountExam.id}/submit`, {});
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("heading", { name: "Đăng nhập", exact: true }).waitFor();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("heading", { name: "Tài khoản của bạn" }).waitFor();
  assert.equal(
    (await context.request.get("/api/attempts/" + accountExam.id)).status(),
    200,
  );
  const restored = await (await context.request.get("/api/bootstrap")).json();
  assert.equal(restored.history.length, 1);
  report("logout and password login preserve owned attempts across sessions");
  assert.deepEqual(consoleErrors, []);
  report("no browser runtime errors");
  mkdirSync(".local/reports", { recursive: true });
  writeFileSync(
    ".local/reports/smoke.json",
    JSON.stringify(
      { at: new Date().toISOString(), checks, uiAttempt, paidApiCalls: 0 },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
  await browser.close();
}
