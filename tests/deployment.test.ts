import { test } from "node:test";
import assert from "node:assert/strict";
import { appOrigin, mediaStorage } from "../src/server/deployment";
import { readBankMedia } from "../src/server/media-files";

test("remote origin must be explicit HTTPS; rejects malformed and extra-path origins", () => {
  assert.throws(() => appOrigin({ VERCEL: "1" }), /required/);
  for (const origin of [
    "http://example.com",
    "https://example.com/",
    "https://example.com/path",
    "https://user:pass@example.com",
  ])
    assert.throws(() => appOrigin({ VERCEL: "1", APP_ORIGIN: origin }));
  assert.equal(
    appOrigin({ VERCEL: "1", APP_ORIGIN: "https://example.com" }),
    "https://example.com",
  );
  assert.equal(appOrigin({}), "http://127.0.0.1:3006");
});

test("serverless never falls back to unavailable local media", () => {
  assert.equal(mediaStorage({ VERCEL: "1" }), "postgres");
  assert.equal(mediaStorage({}), "local");
  assert.throws(() => mediaStorage({ VERCEL: "1", MEDIA_STORAGE: "local" }));
  assert.throws(() => mediaStorage({ MEDIA_STORAGE: "public" }));
});

test("media importer refuses paths outside private storage", async () => {
  await assert.rejects(readBankMedia("../outside.png"), /Invalid media path/);
  await assert.rejects(readBankMedia("/etc/passwd"), /Invalid media path/);
});
