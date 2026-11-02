import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  grade,
  publicQuestions,
  selectBalanced,
  shuffled,
} from "../src/lib/exams";
import type { Question } from "../src/lib/types";
const sample = (id: string, chapter = 1): Question => ({
  id,
  number: 1,
  html: "<p>Question</p>",
  text: "Question",
  options: [
    { id: "a", text: "First" },
    { id: "b", text: "Second" },
  ],
  answer: "b",
  explanation: "Reference",
  explanationHtml: "<p>Reference</p>",
  solutionMediaIds: ["secret-media"],
  sourceId: "s" + chapter,
  sourceTitle: "Source",
  topic: "Topic " + chapter,
  chapter,
  familyKey: id,
  mediaIds: [],
  difficulty: "unrated",
});
test("unsubmitted exam projection never contains key, explanation or solution-media", () => {
  const q = sample("q");
  const output = publicQuestions(
    [q],
    { q: { optionId: "b", answeredAt: "now" } },
    "exam",
    false,
  )[0];
  for (const key of [
    "answer",
    "explanation",
    "explanationHtml",
    "solutionMediaIds",
    "familyKey",
    "review",
  ])
    assert.ok(!(key in output));
  assert.equal(publicQuestions([q], {}, "exam", true)[0].review?.answer, "b");
  assert.equal(
    publicQuestions(
      [q],
      { q: { optionId: "b", answeredAt: "now" } },
      "practice",
      false,
    )[0].review?.correct,
    true,
  );
});
test("stable option ID is graded correctly after shuffling", () => {
  const q = sample("q");
  q.options = shuffled(q.options, () => 0);
  assert.equal(q.options[0].id, "b");
  assert.deepEqual(grade([q], { q: { optionId: "b", answeredAt: "now" } }), {
    correctCount: 1,
    score: 10,
  });
  assert.equal(grade([q], {}).score, 0);
});
test("assembly covers chapters, removes exact family duplicates, refuses impossible requests", () => {
  const groups = [
    [sample("a"), sample("b"), sample("c")],
    [sample("d", 2), sample("e", 2), sample("f", 2)],
  ];
  const picked = selectBalanced(groups, 5, () => 0.5);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((q) => q.id)).size, 5);
  assert.equal(picked.filter((q) => q.chapter === 1).length, 3);
  assert.equal(picked.filter((q) => q.chapter === 2).length, 2);
  const duplicate = { ...sample("copy", 2), familyKey: "a" };
  assert.throws(
    () => selectBalanced([[sample("a")], [duplicate]], 2),
    /Không đủ câu/,
  );
  assert.throws(() => selectBalanced(groups, 1), /ít nhất một câu/);
});
test("shared families cannot starve a chapter or silently redistribute its quota", () => {
  const shared = { ...sample("copy", 2), familyKey: "a" };
  const picked = selectBalanced(
    [[sample("a"), sample("b")], [shared]],
    2,
    () => 0.99,
  );
  assert.deepEqual(picked.map((q) => q.chapter).sort(), [1, 2]);
  assert.equal(new Set(picked.map((q) => q.familyKey)).size, 2);
  assert.throws(
    () =>
      selectBalanced(
        [[sample("a"), sample("b"), sample("c"), sample("d")], [shared]],
        4,
      ),
    /giữ phân bổ/,
  );
});
test("deterministic Frank import agrees with source keys and preserves formulas/media", () => {
  const file = new URL("../data/imports/frank.json", import.meta.url);
  if (!readFileSync(file)) throw Error("Run extractor before tests");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    sources: {
      id: string;
      subject: string;
      chapter: number;
      questionCount: number;
    }[];
    questions: Question[];
    issues: unknown[];
  };
  assert.equal(data.sources.length, 10);
  assert.equal(data.questions.length, 1741);
  assert.equal(data.issues.length, 2);
  for (const source of data.sources) {
    const qs = data.questions.filter((q) => q.sourceId === source.id);
    assert.equal(qs.length, source.questionCount);
    assert.deepEqual(
      qs.map((q) => q.number),
      Array.from({ length: qs.length }, (_, i) => i + 1),
    );
  }
  for (const q of data.questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.some((o) => o.id === q.answer));
    assert.ok(q.html.trim());
    assert.ok(q.explanation.trim());
    assert.ok(!q.html.includes("Answer Key"));
  }
  const macro3 = data.sources.find(
    (s) => s.subject === "macro" && s.chapter === 3,
  )!;
  const graph = data.questions.find(
    (q) => q.sourceId === macro3.id && q.number === 91,
  )!;
  assert.equal(graph.options.length, 4);
  assert.match(graph.options[1].text, /D\(A\)/);
  assert.ok(graph.mediaIds.length > 0);
  assert.match(graph.html, /<img/);
  const micro5 = data.sources.find(
    (s) => s.subject === "micro" && s.chapter === 5,
  )!;
  const formula = data.questions.find(
    (q) => q.sourceId === micro5.id && q.number === 93,
  )!;
  assert.match(formula.options[3].html!, /<sub>A<\/sub>/);
  assert.equal(formula.answer, "D");
});
