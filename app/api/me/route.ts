import { getCurrentUser } from "@/lib/server/session";

export type MeResponse = {
  user: { id: string; firstName: string; displayName: string; avatarUrl: string | null } | null;
};

export async function GET() {
  const user = await getCurrentUser();
  const body: MeResponse = {
    user: user
      ? { id: user.id, firstName: user.firstName, displayName: user.displayName, avatarUrl: user.avatarUrl }
      : null,
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
