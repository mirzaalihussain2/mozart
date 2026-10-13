import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/return-to";
import { isSpotifyAppKey } from "@/lib/server/spotify/registry";

export async function GET(request: NextRequest, { params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo")) || "/";

  const targetUrl = new URL(returnTo, request.nextUrl.origin);
  const response = NextResponse.redirect(targetUrl);

  const cleanApp = app.toLowerCase();
  if (isSpotifyAppKey(cleanApp)) {
    response.cookies.set("mozart_invite_app", cleanApp, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }

  return response;
}
