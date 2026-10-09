"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ModeId } from "../config/modes";
import type { GenerateInput } from "../generation-input";

export type GenerationRequest = {
  mode: ModeId;
  /** Shown on the Generating screen, from lib/generation.ts. */
  quote: string;
  /** The POST /api/generate body. */
  input: GenerateInput;
};

/**
 * The server said this visitor must sign in first: "more" (403 anon_limit:
 * their one anonymous make is used; `sendTo` from the server) or "save"
 * (401: signed out, and this kind of make needs an account).
 */
export type OnBlocked = (reason: "more" | "save", sendTo?: string) => void;

export type GenerationState =
  | { phase: "idle" }
  | { phase: "generating"; request: GenerationRequest }
  /** Navigating to the new track; the Generating screen stays up until it opens. */
  | { phase: "done"; request: GenerationRequest }
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
export function useGenerate({ onBlocked }: { onBlocked?: OnBlocked } = {}) {
  const router = useRouter();
  const [state, setState] = useState<GenerationState>({ phase: "idle" });
  const inFlight = useRef(false);

  // Back from the new track: Next keeps this screen's state, and re-runs its
  // effects when it's shown again — so show the step (choices intact), not a
  // finished Generating screen.
  useEffect(() => {
    if (state.phase !== "done") return;
    return () => {
      inFlight.current = false;
      setState({ phase: "idle" });
    };
  }, [state.phase]);

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
        const body = (await res.json().catch(() => null)) as { track?: { slug: string }; sendTo?: string } | null;
        // Blocked: no Generating screen at all — straight to the Send-to sheet.
        if (res.status === 401 || res.status === 403) {
          inFlight.current = false;
          setState({ phase: "idle" });
          onBlocked?.(res.status === 403 ? "more" : "save", body?.sendTo);
          return;
        }
        await minWait;
        if (res.ok && body?.track) {
          // push, not replace: the Generating screen has no URL of its own, so
          // Back from the new player lands on this step screen (replace would
          // drop the step screen from history).
          router.push(`/track/${body.track.slug}?autoplay=1`);
          setState({ phase: "done", request });
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
    [router, onBlocked],
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
