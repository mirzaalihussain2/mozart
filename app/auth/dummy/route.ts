import type { NextRequest } from "next/server";
import { DEREK } from "@/lib/config/personas";
import { isSameOrigin, signInAsPersona } from "@/lib/server/auth";

// "Log in" on the landing page: always Derek, the demo user (library reset to his starter tracks).
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const form = await request.formData().catch(() => null);
  const returnTo = form?.get("returnTo") ?? request.nextUrl.searchParams.get("returnTo");
  return signInAsPersona(DEREK, returnTo);
}
