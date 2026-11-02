import { Pool, type PoolClient } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { databaseUrl } from "./deployment";
const globalDb = globalThis as unknown as { mimacroPool?: Pool };
export function pool() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Chưa cấu hình DATABASE_URL. Chạy các bước khởi tạo database trong README.",
    );
  if (globalDb.mimacroPool) return globalDb.mimacroPool;
  const db = new Pool({
    connectionString: databaseUrl(process.env.DATABASE_URL),
    max: process.env.VERCEL ? 2 : 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });
  if (process.env.VERCEL) attachDatabasePool(db);
  globalDb.mimacroPool = db;
  return db;
}
export async function transaction<T>(fn: (c: PoolClient) => Promise<T>) {
  const c = await pool().connect();
  try {
    await c.query("BEGIN");
    const v = await fn(c);
    await c.query("COMMIT");
    return v;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
