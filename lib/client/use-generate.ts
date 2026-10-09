"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ModeId } from "../config/modes";

export type GenerationRequest = {
  mode: ModeId;
  /** Shown on the Generating screen, from lib/generation.ts. */
  quote: string;
  /** Where the player opens when the track is ready. */
  destination: string;
};

/** How long the Generating screen shows before the player opens. */
export const GENERATING_MS = 3500;

/**
 * Milestone 2 mock: every Generate button runs through here. It shows the
 * Generating screen (the caller renders GeneratingScreen while `request` is
 * set) for ~3.5 s, then opens `destination`.
 * TODO(M3): replace with POST /api/generate, which creates the track and
 * returns its slug; the destination becomes /track/{slug}.
 */
export function useGenerate() {
  const router = useRouter();
  const [request, setRequest] = useState<GenerationRequest | null>(null);

  useEffect(() => {
    if (!request) return;
    router.prefetch(request.destination);
    const t = setTimeout(() => router.push(request.destination), GENERATING_MS);
    return () => clearTimeout(t);
  }, [request, router]);

  const start = useCallback((req: GenerationRequest) => setRequest(req), []);
  return { request, start };
}
