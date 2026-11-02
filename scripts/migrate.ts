import nextEnv from "@next/env";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pool, transaction } from "../src/server/db";
nextEnv.loadEnvConfig(process.cwd());
try {
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(59403321)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const name of (await readdir("migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const sql = await readFile("migrations/" + name, "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const old = await c.query(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (old.rowCount) {
        if (old.rows[0].checksum !== hash)
          throw Error("Applied migration changed: " + name);
        continue;
      }
      await c.query(sql);
      await c.query(
        "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
        [name, hash],
      );
      console.log("Applied", name);
    }
  });
} finally {
  await pool().end();
}
