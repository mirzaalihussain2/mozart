import type { NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/server/auth";
import { getCurrentUser } from "@/lib/server/session";
import { deleteOwnedTrack } from "@/lib/server/tracks";

// DELETE /api/tracks/{slug}: the owner deletes one of their tracks (Library ⋯
// → Delete). 401 signed out; 404 if it doesn't exist or isn't theirs, so
// nobody can probe other people's tracks.
export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/tracks/[slug]">) {
  if (!isSameOrigin(request)) return Response.json({ error: "forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "signin_required" }, { status: 401 });
  const { slug } = await params;
  if (!(await deleteOwnedTrack(slug, user.id))) return Response.json({ error: "not_found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
