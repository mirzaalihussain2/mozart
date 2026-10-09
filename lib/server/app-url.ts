import "server-only";
import { headers } from "next/headers";
import { originFromHeaders, resolveAppUrl } from "../app-url-core";

const env = () => ({ APP_URL: process.env.APP_URL, VERCEL_URL: process.env.VERCEL_URL });

/** Origin from env only (APP_URL → VERCEL_URL → 127.0.0.1); no request needed. */
export function getEnvAppUrl(): string {
  return resolveAppUrl(env());
}

/** The app's origin (no trailing slash): APP_URL → https://VERCEL_URL → this request's origin. */
export async function getAppUrl(): Promise<string> {
  const e = env();
  if (e.APP_URL?.trim() || e.VERCEL_URL?.trim()) return resolveAppUrl(e);
  const h = await headers();
  return resolveAppUrl(e, originFromHeaders((n) => h.get(n)));
}

/** The clean public URL of a track — what Copy link and WhatsApp share. */
export async function trackUrl(slug: string): Promise<string> {
  return `${await getAppUrl()}/track/${slug}`;
}
