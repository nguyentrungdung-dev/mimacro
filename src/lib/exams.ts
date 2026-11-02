import type { Question, PublicQuestion, AnswerRecord } from "./types";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function checkLearner(user: { role: string } | null) {
  if (user?.role === "admin")
    throw new AppError(
      "Tài khoản quản trị không có quyền làm bài. Dùng khu quản trị để quản lý nội dung.",
      403,
    );
}
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function selectBalanced(
  groups: Question[][],
  count: number,
  random = Math.random,
) {
  if (!groups.length || count < groups.length)
    throw new AppError(
      "Số câu phải đủ để mỗi chương được chọn có ít nhất một câu.",
    );
  const queues = groups.map((g) => shuffled(g, random));
  // Match each blueprint slot to a distinct family. Reassignment prevents a
  // shared question from starving another chapter; quotas never silently drift.
  const slotGroups = Array.from({ length: count }, (_, i) => i % groups.length);
  const selected: Question[] = new Array(count);
  const owners = new Map<string, number>();
  function assign(slot: number, seen: Set<string>): boolean {
    for (const q of queues[slotGroups[slot]]) {
      if (seen.has(q.familyKey)) continue;
      seen.add(q.familyKey);
      const occupied = owners.get(q.familyKey);
      if (occupied === undefined || assign(occupied, seen)) {
        owners.set(q.familyKey, slot);
        selected[slot] = q;
        return true;
      }
    }
    return false;
  }
  for (let slot = 0; slot < count; slot++)
    if (!assign(slot, new Set()))
      throw new AppError(
        `Không đủ câu khác họ để giữ phân bổ đã chọn (chương thứ ${slotGroups[slot] + 1}). Hãy giảm số câu hoặc đổi phạm vi.`,
      );
  return shuffled(selected, random).map((q) => ({
    ...q,
    options: shuffled(q.options, random),
  }));
}
export function grade(
  questions: Question[],
  responses: Record<string, AnswerRecord>,
) {
  const correctCount = questions.filter(
    (q) => responses[q.id]?.optionId === q.answer,
  ).length;
  return {
    correctCount,
    score: Math.round((correctCount / questions.length) * 1000) / 100,
  };
}
export function publicQuestions(
  questions: Question[],
  responses: Record<string, AnswerRecord>,
  mode: string,
  completed: boolean,
): PublicQuestion[] {
  return questions.map((q) => {
    const {
      answer,
      explanation,
      explanationHtml,
      solutionMediaIds,
      familyKey,
      ...safe
    } = q;
    void familyKey;
    void solutionMediaIds;
    return {
      ...safe,
      ...(completed || (mode === "practice" && responses[q.id])
        ? {
            review: {
              answer,
              explanation,
              explanationHtml,
              correct: responses[q.id]?.optionId === answer,
            },
          }
        : {}),
    };
  });
}
