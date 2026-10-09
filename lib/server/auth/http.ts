import "server-only";
import type { NextRequest } from "next/server";

/**
 * 303 to a same-site path with a relative Location. In dev, request.url reports
 * "localhost" even when bound to 127.0.0.1, and an absolute redirect there would
 * drop the session cookie; a relative Location resolves against the real host.
 */
export function seeOther(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: path } });
}

/** Reject form posts from other sites (login/logout CSRF). Missing Origin is allowed. */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
