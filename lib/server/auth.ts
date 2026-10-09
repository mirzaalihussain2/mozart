import "server-only";
import type { NextRequest } from "next/server";
import { DUMMY_USER } from "../config/dummy-user";
import { safeReturnTo } from "../return-to";
import { db } from "./db";
import { users } from "./db/schema";
import { getSession } from "./session";

/** Create or refresh the predefined dummy user (Ali) and return its id. */
export async function upsertDummyUser(): Promise<string> {
  const { id, ...fields } = DUMMY_USER;
  await db.insert(users).values({ id, ...fields }).onConflictDoUpdate({ target: users.id, set: fields });
  return id;
}

/** Sign in as the dummy user and 303-redirect to a validated returnTo. */
export async function signInAsDummy(returnTo: unknown): Promise<Response> {
  const userId = await upsertDummyUser();
  const session = await getSession();
  session.userId = userId;
  await session.save();
  return seeOther(safeReturnTo(returnTo));
}

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
