import type { NextRequest } from "next/server";
import { isSameOrigin, seeOther } from "@/lib/server/auth";
import { getSession } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const session = await getSession();
  session.destroy();
  return seeOther("/");
}
