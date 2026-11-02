import nextEnv from "@next/env";
import { pool } from "../src/server/db";
nextEnv.loadEnvConfig(process.cwd());
const [username, role] = process.argv.slice(2);
if (!username || !["admin", "student"].includes(role))
  throw Error("Usage: npm run admin:role -- <username> <admin|student>");
try {
  const r = await pool().query(
    "UPDATE users SET role=$2 WHERE username=$1 RETURNING username,role",
    [username.toLowerCase(), role],
  );
  if (!r.rowCount) throw Error("Không có tài khoản. Đăng ký tài khoản trước.");
  console.log(r.rows[0]);
} finally {
  await pool().end();
}
