import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appOrigin, mediaStorage } from "@/server/deployment";
import { readBankMedia } from "@/server/media-files";
import {
  authenticate,
  currentActor,
  logout,
  requireActor,
} from "@/server/auth";
import {
  catalog,
  createAttempt,
  readAttempt,
  answerAttempt,
  submitAttempt,
  history,
  topicStats,
} from "@/server/attempts";
import { AppError } from "@/lib/exams";
import { pool } from "@/server/db";
import type { Question } from "@/lib/types";
export const runtime = "nodejs";
const credentials = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]{3,32}$/),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(2).max(80).optional(),
});
async function dispatch(req: NextRequest, parts: string[]) {
  const path = parts.join("/");
  if (req.method === "GET") {
    if (path === "bootstrap") {
      const actor = await currentActor(true);
      return {
        user: actor!.user,
        sources: await catalog(),
        history: await history(actor!),
        topics: await topicStats(actor!),
        environment: process.env.VERCEL ? "remote-test" : "local-development",
        commercialConfigured: false,
      };
    }
    if (parts[0] === "attempts" && parts.length === 2) {
      z.uuid().parse(parts[1]);
      return readAttempt(parts[1], await requireActor());
    }
    if (parts[0] === "media" && parts.length === 2) {
      const id = z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(parts[1]);
      const actor = await requireActor();
      const r = await pool().query(
        `SELECT snapshot,responses,mode,status FROM attempts WHERE ${actor.user ? "user_id=$1" : "session_hash=$1 AND user_id IS NULL"}`,
        [actor.user?.id || actor.hash],
      );
      const allowed = r.rows.some((row) =>
        (row.snapshot as Question[]).some(
          (q) =>
            q.mediaIds.includes(id) ||
            ((row.status === "completed" ||
              (row.mode === "practice" && row.responses[q.id])) &&
              q.solutionMediaIds.includes(id)),
        ),
      );
      if (!allowed) throw new AppError("Không có quyền xem hình này.", 404);
      const storage = mediaStorage();
      const m = (
        await pool().query(
          storage === "postgres"
            ? "SELECT mime,data FROM media WHERE id=$1"
            : "SELECT mime,relative_path FROM media WHERE id=$1",
          [id],
        )
      ).rows[0];
      if (!m) throw new AppError("Không tìm thấy hình.", 404);
      const data =
        storage === "postgres" ? m.data : await readBankMedia(m.relative_path);
      if (!data)
        throw new AppError("Hình chưa được chuyển lên kho dữ liệu.", 503);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": m.mime,
          "Cache-Control": "private, no-store",
        },
      });
    }
  } else if (req.method === "POST") {
    if (req.headers.get("origin") !== appOrigin())
      throw new AppError("Nguồn yêu cầu không hợp lệ.", 403);
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new AppError("Yêu cầu cần JSON.", 415);
    if (Number(req.headers.get("content-length") || 0) > 65536)
      throw new AppError("Yêu cầu quá lớn.", 413);
    const text = await req.text();
    if (text.length > 65536) throw new AppError("Yêu cầu quá lớn.", 413);
    const body = JSON.parse(text);
    if (path === "auth/register" || path === "auth/login") {
      const input = credentials.parse(body);
      if (path.endsWith("register") && !input.displayName)
        throw new AppError("Nhập tên hiển thị.");
      const a = await authenticate(
        path.endsWith("register") ? "register" : "login",
        input.username,
        input.password,
        input.displayName,
      );
      return { user: a.user };
    }
    if (path === "auth/logout") {
      await logout();
      return { ok: true };
    }
    const actor = await requireActor();
    if (path === "attempts") {
      const input = z
        .object({
          sourceIds: z
            .array(z.string().max(80))
            .min(1)
            .max(20)
            .refine((a) => new Set(a).size === a.length),
          mode: z.enum(["practice", "exam"]),
          kind: z.enum(["original", "mixed"]),
          count: z.number().int().min(1).max(250),
          minutes: z.number().int().min(1).max(600),
          difficulty: z.enum(["unrated", "any"]).default("any"),
          choicePercent: z.number().int().min(0).max(100).default(100),
        })
        .parse(body);
      const id = await createAttempt(actor, input);
      return { id };
    }
    if (parts[0] === "attempts" && parts.length === 3) {
      z.uuid().parse(parts[1]);
      if (parts[2] === "answer") {
        const b = z
          .object({
            questionId: z.string().max(100),
            optionId: z.string().max(10),
          })
          .parse(body);
        return answerAttempt(parts[1], actor, b.questionId, b.optionId);
      }
      if (parts[2] === "submit") return submitAttempt(parts[1], actor);
    }
  }
  throw new AppError("Không tìm thấy chức năng.", 404);
}
async function handle(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const data = await dispatch(req, (await context.params).path);
    return data instanceof NextResponse
      ? data
      : NextResponse.json(data, {
          headers: { "Cache-Control": "private, no-store" },
        });
  } catch (e) {
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError || e instanceof SyntaxError)
      return NextResponse.json(
        { error: "Thông tin gửi lên chưa hợp lệ." },
        { status: 400 },
      );
    console.error(
      "Request failed:",
      e instanceof Error ? e.message : "unknown",
    );
    return NextResponse.json(
      {
        error:
          "Không xử lý được yêu cầu. Bài đã lưu vẫn được giữ. Kiểm tra kết nối database hoặc thử lại.",
      },
      { status: 503 },
    );
  }
}
export { handle as GET, handle as POST };
