"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * iOS Safari (and Android Chrome by default) keep the layout viewport full
 * height when the keyboard opens, so an `h-dvh` screen leaves its Generate
 * button behind the keyboard. While the keyboard covers part of the screen,
 * this returns a style that pins the screen to the visible area, so Generate
 * sits just above the keyboard (02-08, 04-05); otherwise `undefined`.
 * Screens using it need `mx-auto w-full max-w-[390px]` to stay centred.
 */
export function useKeyboardViewport(active: boolean): CSSProperties | undefined {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => {
      // Ignore pinch-zoom and small toolbar changes; a keyboard takes far more.
      const covered = Math.abs(vv.scale - 1) < 0.01 && document.documentElement.clientHeight - vv.height > 120;
      setBox(covered ? { top: vv.offsetTop, height: vv.height } : null);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setBox(null);
    };
  }, [active]);

  return active && box ? { position: "fixed", top: box.top, left: 0, right: 0, height: box.height } : undefined;
}
