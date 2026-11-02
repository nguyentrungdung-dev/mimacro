import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkQuestion, safeBankHtml } from "../src/lib/question-checks";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(readFileSync("data/imports/frank.json", "utf8"));
const q: Question = bank.questions[0];
test("Imported markup remains editable, including media, tables and sub/superscripts", () => {
  for (const q of bank.questions as Question[])
    for (const h of [
      q.html,
      q.explanationHtml,
      ...q.options.map((o) => o.html || ""),
    ])
      assert.ok(safeBankHtml(h));
});
test("Active markup, URL/attribute injection and malformed tags cannot reach previews or persisted edits", () => {
  for (const h of [
    "<script>alert(1)</script>",
    '<p onclick="x">a</p>',
    '<img src="https://example.org/x">',
    "<svg onload=x>",
    "<!-- x -->",
    "<p><",
    '<img src="/api/media/' + "a".repeat(64) + '" alt="x" onerror="x" />',
    "<P>x</P>",
  ])
    assert.equal(safeBankHtml(h), false, h);
  assert.equal(safeBankHtml("<p>x &lt; 3 <sup>2</sup></p>"), true);
});
test("Checks catch empty/duplicate options, missing key and explanation and foreign media", () => {
  assert.deepEqual(checkQuestion(q), []);
  const broken = {
    ...q,
    text: "",
    topic: "",
    answer: "absent",
    explanation: "",
    options: [q.options[0], { ...q.options[0], id: "Z" }],
    html: '<img src="/api/media/' + "a".repeat(64) + '" alt="Hình" />',
  };
  const codes = checkQuestion(broken).map((c) => c.code);
  for (const code of [
    "stem",
    "topic",
    "answer",
    "explanation",
    "option_duplicate",
    "media_reference",
  ])
    assert.ok(codes.includes(code), code);
});
