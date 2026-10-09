// The anonymous-recipient cookie (AGENTS.md §3): pure parts, unit-tested.

export const ANON_COOKIE = "mozart_anon";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** RFC 4122 v1–v5 UUID, as crypto.randomUUID() makes. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** httpOnly, Secure in production, SameSite=Lax, path /, 1 year. */
export function anonCookieOptions(production: boolean) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };
}
