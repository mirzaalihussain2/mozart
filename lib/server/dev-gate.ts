import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";

/**
 * /dev/* (the screen gallery) is for local development and Vercel previews
 * only. Checked per request, not at build, so a preview build promoted to
 * production still hides it — and nothing under /dev is prerendered.
 */
export async function devToolsOnly(): Promise<void> {
  await connection();
  if (process.env.VERCEL_ENV === "production") notFound();
}

export const isProduction = () => process.env.VERCEL_ENV === "production";
