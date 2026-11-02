import { z } from "zod";
import type { Question } from "./types";
export const editSchema = z.object({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(8).max(2000),
  html: z.string().max(20000),
  text: z.string().trim().max(15000),
  options: z
    .array(
      z.object({
        id: z.string().min(1).max(10),
        text: z.string().max(6000),
        html: z.string().max(10000),
      }),
    )
    .min(2)
    .max(10),
  answer: z.string().max(10),
  explanation: z.string().max(15000),
  explanationHtml: z.string().max(20000),
  topic: z.string().trim().max(200),
});
export type QuestionEdit = z.infer<typeof editSchema>;
export type Check = { code: string; message: string };
// Deliberately small HTML language shared with the DOCX importer. No arbitrary attributes,
// URLs, styles, comments or active content can be introduced by an editor.
export function safeBankHtml(html: string) {
  const rest = html.replace(
    /<\/?(?:p|strong|em|table|tbody|thead|tr|td|th|sup|sub|ul|ol|li)>|<br\s*\/?\s*>|<img src="\/api\/media\/[a-f0-9]{64}" alt="[^"<>]*"(?: loading="lazy")?\s*\/?\s*>/g,
    "",
  );
  return !/[<>]/.test(rest);
}
export function checkQuestion(q: Question): Check[] {
  const errors: Check[] = [];
  const add = (code: string, message: string) => errors.push({ code, message });
  if (!q.text.trim() || !q.html.replace(/<[^>]*>/g, "").trim())
    add("stem", "Nội dung câu hỏi đang trống.");
  if (!q.topic.trim()) add("topic", "Chưa có chủ đề.");
  if (
    q.options.length < 2 ||
    new Set(q.options.map((o) => o.id)).size !== q.options.length
  )
    add("options", "Cần ít nhất hai lựa chọn với ID khác nhau.");
  if (
    q.options.some(
      (o) => !o.text.trim() || !(o.html || "").replace(/<[^>]*>/g, "").trim(),
    )
  )
    add("option_empty", "Có lựa chọn trống.");
  const normal = q.options.map((o) =>
    o.text.trim().replace(/\s+/g, " ").toLowerCase(),
  );
  if (new Set(normal).size !== normal.length)
    add("option_duplicate", "Có lựa chọn trùng nội dung.");
  if (!q.options.some((o) => o.id === q.answer))
    add("answer", "Đáp án không thuộc các ID lựa chọn.");
  if (
    !q.explanation.trim() ||
    !q.explanationHtml.replace(/<[^>]*>/g, "").trim()
  )
    add("explanation", "Chưa có lời giải.");
  const html = [
    q.html,
    q.explanationHtml,
    ...q.options.map((o) => o.html || ""),
  ];
  if (html.some((h) => !safeBankHtml(h)))
    add(
      "html",
      "HTML không được hỗ trợ. Chỉ dùng đoạn, bảng, nhấn mạnh, sup/sub và hình ngân hàng.",
    );
  const refs = html.flatMap((h) =>
    [...h.matchAll(/src="\/api\/media\/([a-f0-9]{64})"/g)].map((m) => m[1]),
  );
  if (refs.some((id) => ![...q.mediaIds, ...q.solutionMediaIds].includes(id)))
    add("media_reference", "Hình tham chiếu chưa được gắn với câu nguồn.");
  const stemHtml = q.html + q.options.map((o) => o.html || "").join("");
  if (
    q.mediaIds.some((id) => !stemHtml.includes(`/api/media/${id}`)) ||
    q.solutionMediaIds.some(
      (id) => !q.explanationHtml.includes(`/api/media/${id}`),
    )
  )
    add(
      "media_missing",
      "Có hình nguồn chưa xuất hiện ở phần câu hỏi hoặc lời giải tương ứng.",
    );
  return errors;
}
