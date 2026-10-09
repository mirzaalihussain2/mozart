import type { NextRequest } from "next/server";
import { isSameOrigin, signInAsDummy } from "@/lib/server/auth";

// "Log in" on the landing page: sign in as the predefined dummy user.
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const form = await request.formData().catch(() => null);
  const returnTo = form?.get("returnTo") ?? request.nextUrl.searchParams.get("returnTo");
  return signInAsDummy(returnTo);
}
