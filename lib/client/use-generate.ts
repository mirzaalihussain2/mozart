"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { ModeId } from "../config/modes";

export type GenerationRequest = {
  mode: ModeId;
  /** Shown on the Generating screen, from lib/generation.ts. */
  quote: string;
  /** Where the player opens when the track is ready. */
  destination: string;
};

/**
 * Milestone 2 mock: every Generate button runs through here.
 * TODO(M3): replace with POST /api/generate (creates the track, returns its slug).
 */
export function useGenerate() {
  const router = useRouter();
  const [request, setRequest] = useState<GenerationRequest | null>(null);
  const start = useCallback(
    (req: GenerationRequest) => {
      setRequest(req);
      router.push(req.destination);
    },
    [router],
  );
  return { request, start };
}
