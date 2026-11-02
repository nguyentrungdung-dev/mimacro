import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { pool, transaction } from "./db";
import { AppError } from "../lib/exams";
import type { UserView } from "../lib/types";
import { appOrigin } from "./deployment";
const scrypt = promisify(scryptCb);
const cookieName = "mimacro-session";
export type Actor = { hash: string; user: UserView | null };
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentActor(create = false): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const hash = digest(token);
    const r = await pool().query(
      `SELECT u.id,u.username,u.display_name,u.role FROM sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND (u.id IS NULL OR u.is_active)`,
      [hash],
    );
    if (r.rowCount) {
      const u = r.rows[0];
      return {
        hash,
        user: u.id
          ? {
              id: u.id,
              username: u.username,
              displayName: u.display_name,
              role: u.role,
            }
          : null,
      };
    }
  }
  return create ? newSession(null) : null;
}
async function newSession(user: UserView | null): Promise<Actor> {
  const token = randomBytes(32).toString("hex"),
    hash = digest(token);
  await pool().query(
    `INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')`,
    [hash, user?.id || null],
  );
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: appOrigin().startsWith("https://"),
    path: "/",
    maxAge: 30 * 86400,
  });
  return { hash, user };
}
export async function requireActor() {
  const a = await currentActor();
  if (!a)
    throw new AppError("Phiên làm việc đã hết hạn. Hãy tải lại trang.", 401);
  return a;
}
export async function authenticate(
  mode: "register" | "login",
  username: string,
  password: string,
  displayName?: string,
) {
  const normalized = username.toLowerCase();
  // Persistent throttling survives restart; generic errors do not reveal usernames.
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO auth_limits(key) VALUES($1) ON CONFLICT DO NOTHING",
      [normalized],
    );
    const row = (
      await c.query("SELECT * FROM auth_limits WHERE key=$1 FOR UPDATE", [
        normalized,
      ])
    ).rows[0];
    const recent =
      Date.now() - new Date(row.window_started).getTime() < 15 * 60 * 1000;
    if (recent && row.failures >= 10)
      throw new AppError("Bạn đã thử nhiều lần. Vui lòng chờ 15 phút.", 429);
    await c.query(
      `UPDATE auth_limits SET failures=$2,window_started=CASE WHEN $3 THEN window_started ELSE now() END WHERE key=$1`,
      [normalized, recent ? row.failures + 1 : 1, recent],
    );
  });
  let user: UserView;
  if (mode === "register") {
    const salt = randomBytes(16).toString("hex");
    const key = (await scrypt(password, salt, 64)) as Buffer;
    const id = randomUUID();
    try {
      await pool().query(
        "INSERT INTO users(id,username,display_name,password_hash) VALUES($1,$2,$3,$4)",
        [id, normalized, displayName, salt + ":" + key.toString("hex")],
      );
    } catch (e) {
      if ((e as { code: string }).code === "23505")
        throw new AppError("Tên đăng nhập này chưa thể sử dụng.");
      throw e;
    }
    user = {
      id,
      username: normalized,
      displayName: displayName!,
      role: "student",
    };
  } else {
    const row = (
      await pool().query("SELECT * FROM users WHERE username=$1", [normalized])
    ).rows[0];
    const [salt, stored] = (
      row?.password_hash || "missing:" + "00".repeat(64)
    ).split(":");
    const key = (await scrypt(password, salt, 64)) as Buffer;
    if (
      !row ||
      !row.is_active ||
      !timingSafeEqual(key, Buffer.from(stored, "hex"))
    )
      throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng.", 401);
    user = {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      role: row.role,
    };
  }
  await pool().query("DELETE FROM auth_limits WHERE key=$1", [normalized]);
  const old = await currentActor();
  if (old?.user)
    await pool().query(
      "UPDATE sessions SET expires_at=now() WHERE token_hash=$1",
      [old.hash],
    );
  // New identity gets a new session. Guest-history merge is intentionally not assumed.
  return newSession(user);
}
export async function logout() {
  const a = await currentActor();
  if (a)
    await pool().query(
      "UPDATE sessions SET expires_at=now() WHERE token_hash=$1",
      [a.hash],
    );
  (await cookies()).delete(cookieName);
}
