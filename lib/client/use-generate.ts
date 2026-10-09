"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { ModeId } from "../config/modes";
import type { GenerateInput } from "../generation-input";

export type GenerationRequest = {
  mode: ModeId;
  /** Shown on the Generating screen, from lib/generation.ts. */
  quote: string;
  /** The POST /api/generate body. */
  input: GenerateInput;
  /** Where to go if the API says sign-in is required (the source track or step). */
  signInFallback: string;
};

export type GenerationState =
  | { phase: "idle" }
  | { phase: "generating"; request: GenerationRequest }
  | { phase: "error"; request: GenerationRequest; message: string };

/** The Generating screen shows for at least this long, even if the API is instant. */
export const GENERATING_MS = 3500;

const ERROR_MESSAGE = "Couldn’t make that one. Try again.";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Every Generate button runs through here: shows the mode's Generating screen
 * (the caller renders it while `state.phase !== "idle"`), calls POST
 * /api/generate in parallel, and opens the new track once both the request
 * has succeeded and GENERATING_MS have passed. A double tap never sends twice.
 */
export function useGenerate() {
  const router = useRouter();
  const [state, setState] = useState<GenerationState>({ phase: "idle" });
  const inFlight = useRef(false);

  const run = useCallback(
    async (request: GenerationRequest) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setState({ phase: "generating", request });
      const minWait = sleep(GENERATING_MS);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.input),
        });
        const body = (await res.json().catch(() => null)) as { track?: { slug: string } } | null;
        await minWait;
        if (res.ok && body?.track) {
          // replace: Back from the new player returns to the step screen.
          router.replace(`/track/${body.track.slug}?autoplay=1`);
          return;
        }
        if (res.status === 401) {
          // TODO(M5): anonymous recipients make their one track here instead.
          router.replace(request.signInFallback);
          return;
        }
        setState({ phase: "error", request, message: ERROR_MESSAGE });
        inFlight.current = false;
      } catch {
        await minWait;
        setState({ phase: "error", request, message: ERROR_MESSAGE });
        inFlight.current = false;
      }
    },
    [router],
  );

  const retry = useCallback(() => {
    if (state.phase === "error") void run(state.request);
  }, [state, run]);

  /** Back to the step screen with its choices intact. */
  const cancel = useCallback(() => {
    inFlight.current = false;
    setState({ phase: "idle" });
  }, []);

  return { state, start: run, retry, cancel };
}
