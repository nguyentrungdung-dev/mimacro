import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
const password = readFileSync(".local/db-password", "utf8").trim();
if (!/^[a-f0-9]{64}$/.test(password))
  throw Error("Invalid dedicated local DB password file.");
const [command, ...args] = process.argv.slice(2);
if (!command) throw Error("Usage: npm run local -- <command> [args]");
// Override only this child process; never rewrite another environment configuration.
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://mimacro:${password}@127.0.0.1:55438/mimacro`,
  APP_ORIGIN: "http://127.0.0.1:3006",
  MEDIA_STORAGE: "local",
  PRIVATE_STORAGE_DIR: ".local/storage",
};
const child = spawn(command, args, { stdio: "inherit", env });
child.on("error", () => {
  console.error("Could not start local command.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
