import { resolve, sep } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export async function readBankMedia(relativePath: string, expectedId?: string) {
  const base = resolve(
    /* turbopackIgnore: true */ process.env.PRIVATE_STORAGE_DIR ||
      ".local/storage",
  );
  const filename = resolve(/* turbopackIgnore: true */ base, relativePath);
  if (!filename.startsWith(base + sep)) throw new Error("Invalid media path");
  const data = await readFile(/* turbopackIgnore: true */ filename);
  if (
    expectedId &&
    createHash("sha256").update(data).digest("hex") !== expectedId
  )
    throw new Error("Media checksum mismatch");
  return data;
}
