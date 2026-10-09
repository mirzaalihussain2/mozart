// Pure URL resolution, shared by lib/server/app-url.ts and unit tests.

export type AppUrlEnv = { APP_URL?: string; VERCEL_URL?: string };

const LOCAL = "http://127.0.0.1:3000";
const trim = (url: string) => url.trim().replace(/\/+$/, "");

/**
 * The app's origin, no trailing slash:
 *   1. APP_URL (local, and Vercel Production)
 *   2. https://VERCEL_URL (Vercel Previews)
 *   3. the current request's origin, if known
 *   4. http://127.0.0.1:3000
 */
export function resolveAppUrl(env: AppUrlEnv, requestOrigin?: string | null): string {
  if (env.APP_URL?.trim()) return trim(env.APP_URL);
  if (env.VERCEL_URL?.trim()) return `https://${trim(env.VERCEL_URL).replace(/^https?:\/\//, "")}`;
  if (requestOrigin) return trim(requestOrigin);
  return LOCAL;
}

/** "https" or "http" + host from forwarded / host headers. */
export function originFromHeaders(get: (name: string) => string | null): string | null {
  const host = get("x-forwarded-host") ?? get("host");
  if (!host) return null;
  const proto = get("x-forwarded-proto")?.split(",")[0].trim() ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
