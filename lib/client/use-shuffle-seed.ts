"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { newSeed } from "@/lib/shuffle";

// The step-1 picker's shuffle seed lives in its history entry
// (history.state.shuffleSeed; Next keeps custom keys on Back/Forward and on
// reload). A visit from Create is a new entry with no seed, so it gets a new
// one. Step 2's Back pill and "change song" card are links, so they also push
// a new entry: they set a one-shot flag (markPickerReturn) and the picker
// reuses the last seed it showed in this tab.

const LAST = "mozart:picker-seed:";
const RETURN = "mozart:picker-return";
const CHANGED = "mozart:shuffle-seed";

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // e.g. storage disabled: every visit just reshuffles
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function savedSeed(): number | null {
  const seed: unknown = window.history.state?.shuffleSeed;
  return typeof seed === "number" ? seed : null;
}

/** Call when leaving step 2 for the step-1 picker at `basePath`. */
export function markPickerReturn(basePath: string) {
  storage()?.setItem(RETURN, basePath);
}

/**
 * The seed for the picker at `basePath`, or null until it's known (the server
 * and hydration render, and the first render of a client navigation, which
 * still sees the previous entry). The layout effect runs after the router
 * has pushed the new entry and before paint; a store change there re-renders
 * synchronously, so the grid never paints in the server's order.
 */
export function useShuffleSeed(basePath: string, enabled: boolean): number | null {
  const seed = useSyncExternalStore(subscribe, savedSeed, () => null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const store = storage();
    const returning = store?.getItem(RETURN) === basePath;
    store?.removeItem(RETURN);

    let next = savedSeed();
    if (next === null) {
      const last = Number(store?.getItem(LAST + basePath) ?? NaN);
      next = returning && Number.isInteger(last) ? last : newSeed();
      window.history.replaceState({ ...window.history.state, shuffleSeed: next }, "");
    }
    store?.setItem(LAST + basePath, String(next));
    // Always notify: the render may have read another entry's seed.
    window.dispatchEvent(new Event(CHANGED));
  }, [basePath, enabled]);

  return enabled ? seed : null;
}
