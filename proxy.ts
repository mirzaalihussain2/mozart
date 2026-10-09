import { NextResponse, type NextRequest } from "next/server";

// /dev/* (the screen gallery) is for local development and Vercel previews.
// In production it's a hard 404 before anything renders. (The pages also
// check, via lib/server/dev-gate.ts, as a second line.)
export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.next({ request });
}

export const config = {
  matcher: "/dev/:path*",
};
