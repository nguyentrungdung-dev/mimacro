import { test } from "node:test";
import assert from "node:assert/strict";
import { appOrigin, mediaStorage, databaseUrl } from "../src/server/deployment";
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

test("legacy pg SSL aliases become explicit verify-full without changing connection target or other options", () => {
  const original = new URL(
    "postgresql://user:p%40ss%2Fword@db.example:5432/mimacro?sslmode=require&channel_binding=require&application_name=mimacro",
  );
  for (const mode of ["prefer", "require", "verify-ca"]) {
    original.searchParams.set("sslmode", mode);
    const normalized = new URL(databaseUrl(original.toString()));
    assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
    for (const key of [
      "protocol",
      "host",
      "pathname",
      "username",
      "password",
    ] as const)
      assert.equal(normalized[key], original[key]);
    assert.equal(normalized.searchParams.get("channel_binding"), "require");
    assert.equal(normalized.searchParams.get("application_name"), "mimacro");
  }
});
test("explicit TLS modes and libpq opt-in remain unchanged; malformed URL errors do not leak credentials", () => {
  for (const suffix of [
    "",
    "?sslmode=verify-full",
    "?sslmode=disable",
    "?sslmode=require&uselibpqcompat=true",
  ]) {
    const url = "postgresql://user:secret@db.example/mimacro" + suffix;
    assert.equal(databaseUrl(url), url);
  }
  assert.throws(
    () => databaseUrl("secret-invalid-url"),
    /^Error: DATABASE_URL must be a valid PostgreSQL URL$/,
  );
  assert.throws(() => databaseUrl("https://db.example"), /must use PostgreSQL/);
});
