import type { NextRequest } from "next/server";
import { parseGenerateInput } from "@/lib/generation-input";
import { countAnonTracks, getAnonId, getOrCreateAnonId } from "@/lib/server/anon";
import { isSameOrigin } from "@/lib/server/auth";
import { createGeneratedTrack, type Maker } from "@/lib/server/generate/create-track";
import { getCurrentUser } from "@/lib/server/session";
import { catalogueFor } from "@/lib/server/taste";
import { sendToName } from "@/lib/server/tracks";

// POST /api/generate — mock generation: validate, pick a
// catalogue file, name the track and save it to the user's library. No
// artificial delay; the Generating screen owns the wait.
//
// Signed out (a recipient on a shared link): one make, only from a track.
// The track is unowned, tagged with this browser's mozart_anon id (created
// here, never on page views) and claimed when they sign in.

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json(403, { error: "forbidden" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "bad_request", message: "Expected a JSON body." });
  }
  // Songs and singers are validated against what this viewer could pick.
  const user = await getCurrentUser();
  const catalogue = catalogueFor(user);
  const parsed = parseGenerateInput(body, catalogue);
  if (!parsed.ok) return json(400, { error: "bad_request", message: parsed.error });

  const input = parsed.input;
  let maker: Maker;
  if (user) {
    maker = { userId: user.id };
  } else {
    // Anonymous makes only come from a player (a source track); Create needs sign-in.
    if (!("sourceTrackId" in input) || !input.sourceTrackId) return json(401, { error: "signin_required" });
    const existing = await getAnonId();
    if (existing && (await countAnonTracks(existing)) >= 1) {
      return json(403, { error: "anon_limit", sendTo: (await sendToName(input.sourceTrackId)) ?? "them" });
    }
    maker = { anonId: existing ?? (await getOrCreateAnonId()) };
  }

  try {
    const result = await createGeneratedTrack(maker, input, catalogue);
    if (!result.ok) {
      return json(result.status, { error: result.status === 429 ? "rate_limited" : "not_found", message: result.error });
    }
    const { id, publicSlug, title, mode, audioUrl } = result.track;
    return json(201, { track: { id, slug: publicSlug, title, mode, audioUrl, isAnonymous: !user } });
  } catch (err) {
    console.error("POST /api/generate failed", err);
    return json(500, { error: "server_error", message: "Couldn’t make that one. Try again." });
  }
}
