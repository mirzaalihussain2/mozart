// Accept only same-site paths for post-login redirects ("/track/abc", not
// "//evil.com", "/\evil.com" or "https://evil.com").

export const DEFAULT_RETURN_TO = "/create";

export function safeReturnTo(value: unknown, fallback: string = DEFAULT_RETURN_TO): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Browsers treat "\" like "/", and control characters can smuggle a host.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  const base = "http://same.site";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
