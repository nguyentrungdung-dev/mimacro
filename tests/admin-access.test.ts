import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLearner } from "../src/lib/exams";
import { requireAdmin } from "../src/server/question-bank";
test("Admin has no learner access; guest/student retain learner access", () => {
  assert.throws(
    () => checkLearner({ role: "admin" }),
    (e) => (e as { status: number }).status === 403,
  );
  assert.doesNotThrow(() => checkLearner(null));
  assert.doesNotThrow(() => checkLearner({ role: "student" }));
});
test("Admin authorization refuses guest/student, accepts admin", () => {
  for (const user of [
    null,
    {
      id: "s",
      username: "student",
      displayName: "Student",
      role: "student" as const,
    },
  ])
    assert.throws(
      () => requireAdmin({ hash: "test", user }),
      (e) => (e as { status: number }).status === 403,
    );
  assert.equal(
    requireAdmin({
      hash: "test",
      user: { id: "a", username: "admin", displayName: "Admin", role: "admin" },
    }).id,
    "a",
  );
});
