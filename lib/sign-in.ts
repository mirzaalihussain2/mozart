// Pure sign-in helpers (unit-tested). The server side is lib/server/auth/.

/** First persona (in order) whose id isn't `ownerId`. */
export function pickPersona<P extends { id: string }>(personas: readonly P[], ownerId: string | null): P {
  return personas.find((p) => p.id !== ownerId) ?? personas[0];
}

/** "/track/abc/remix?x=1" → "abc"; anything else → null. */
export function trackSlugFromPath(path: string): string | null {
  return path.match(/^\/track\/([^/?#]+)(?:[/?#]|$)/)?.[1] ?? null;
}

/**
 * The post-sign-in redirect: `returnTo`, plus `saved=1` only when the sign-in
 * claimed at least one anonymous track (the server decides; sheets never ask).
 */
export function signInRedirect(returnTo: string, claimed: number): string {
  if (claimed < 1) return returnTo;
  const url = new URL(returnTo, "http://same.site");
  url.searchParams.set("saved", "1");
  return url.pathname + url.search + url.hash;
}
