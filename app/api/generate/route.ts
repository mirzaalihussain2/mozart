import type { NextRequest } from "next/server";
import { parseGenerateInput } from "@/lib/generation-input";
import { isSameOrigin } from "@/lib/server/auth";
import { createGeneratedTrack } from "@/lib/server/generate/create-track";
import { getCurrentUser } from "@/lib/server/session";

// POST /api/generate — mock generation (tech-spec §6): validate, pick a
// catalogue file, name the track and save it to the user's library. No
// artificial delay; the Generating screen owns the wait.

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json(403, { error: "forbidden" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "bad_request", message: "Expected a JSON body." });
  }
  const parsed = parseGenerateInput(body);
  if (!parsed.ok) return json(400, { error: "bad_request", message: parsed.error });

  const user = await getCurrentUser();
  // TODO(M5): anonymous recipients may make one track from a shared track
  // (mozart_anon cookie) instead of being refused here.
  if (!user) return json(401, { error: "signin_required" });

  try {
    const result = await createGeneratedTrack(user.id, parsed.input);
    if (!result.ok) {
      return json(result.status, { error: result.status === 429 ? "rate_limited" : "not_found", message: result.error });
    }
    const { id, publicSlug, title, mode, audioUrl } = result.track;
    return json(201, { track: { id, slug: publicSlug, title, mode, audioUrl } });
  } catch (err) {
    console.error("POST /api/generate failed", err);
    return json(500, { error: "server_error", message: "Couldn’t make that one. Try again." });
  }
}
