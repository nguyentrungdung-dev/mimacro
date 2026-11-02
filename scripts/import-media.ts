import nextEnv from "@next/env";
import { pool, transaction } from "../src/server/db";
import { readBankMedia } from "../src/server/media-files";
nextEnv.loadEnvConfig(process.cwd());
try {
  const result = await transaction(async (c) => {
    const { rows } = await c.query(
      "SELECT id,relative_path,data FROM media ORDER BY id",
    );
    let bytes = 0;
    for (const row of rows) {
      const data = await readBankMedia(row.relative_path, row.id);
      if (row.data && !data.equals(row.data))
        throw new Error("Stored media differs; refusing overwrite");
      await c.query("UPDATE media SET data=$2 WHERE id=$1 AND data IS NULL", [
        row.id,
        data,
      ]);
      bytes += data.length;
    }
    return { media: rows.length, bytes };
  });
  console.log(result);
} finally {
  await pool().end();
}
