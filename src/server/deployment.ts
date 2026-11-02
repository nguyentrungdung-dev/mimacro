export function appOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env.APP_ORIGIN;
  if (!value) {
    if (env.VERCEL) throw new Error("APP_ORIGIN is required on Vercel");
    return "http://127.0.0.1:3006";
  }
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.origin !== value)
    throw new Error("APP_ORIGIN must be an origin without a trailing slash");
  if (env.VERCEL && url.protocol !== "https:")
    throw new Error("APP_ORIGIN must use HTTPS on Vercel");
  return url.origin;
}

export function mediaStorage(
  env: Record<string, string | undefined> = process.env,
): "local" | "postgres" {
  const value = env.MEDIA_STORAGE || (env.VERCEL ? "postgres" : "local");
  if (value !== "local" && value !== "postgres")
    throw new Error("MEDIA_STORAGE must be local or postgres");
  if (env.VERCEL && value === "local")
    throw new Error("Local media storage is unavailable on Vercel");
  return value;
}

/** Preserve pg 8's certificate + hostname verification for legacy SSL aliases.
 * A URL explicitly opting into libpq compatibility keeps its chosen semantics.
 */
export function databaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL must use PostgreSQL");
  if (
    url.searchParams.get("uselibpqcompat") !== "true" &&
    ["prefer", "require", "verify-ca"].includes(
      url.searchParams.get("sslmode") || "",
    )
  ) {
    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  }
  return value;
}
