import "server-only";
import { eq } from "drizzle-orm";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { users, type User } from "./db/schema";

export type SessionData = { userId?: string };

const SESSION_COOKIE = "mozart_session";
const ANON_COOKIE = "mozart_anon";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return {
    cookieName: SESSION_COOKIE,
    password,
    ttl: THIRTY_DAYS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

/** Read/write in route handlers and server functions; read-only in server components. */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/** The signed-in user's row, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId } = await getSession();
  if (!userId || !UUID_RE.test(userId)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
});

/** For protected pages: the signed-in user, or a redirect to the landing page. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

/** Anonymous recipient id from `mozart_anon`. Read-only here; set in milestone 5. */
export async function getAnonId(): Promise<string | null> {
  const value = (await cookies()).get(ANON_COOKIE)?.value;
  return value && UUID_RE.test(value) ? value : null;
}
