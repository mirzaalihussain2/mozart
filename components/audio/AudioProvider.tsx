"use client";

import { usePathname } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AudioTrack = {
  slug: string;
  title: string;
  artist: string;
  src: string;
  /** From the catalogue; used until the file's metadata loads. */
  durationSec?: number;
};

export type AudioState = {
  track: AudioTrack | null;
  playing: boolean;
  current: number;
  duration: number;
  buffering: boolean;
  error: boolean;
  /** Loads a track into the one <audio> element (no-op if it's already loaded). */
  load: (track: AudioTrack) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (sec: number) => void;
};

const AudioContext = createContext<AudioState | null>(null);

/** The one global <audio> element (AGENTS.md §3, tech-spec §14). */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);

  const loaded = useRef<AudioTrack | null>(null);
  const load = useCallback((next: AudioTrack) => {
    const el = audio.current;
    if (!el || (loaded.current?.slug === next.slug && loaded.current.src === next.src)) return;
    loaded.current = next;
    el.src = next.src;
    el.load();
    setTrack(next);
    setCurrent(0);
    setDuration(next.durationSec ?? 0);
    setError(false);
    if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({ title: next.title, artist: next.artist });
    }
  }, []);

  const play = useCallback(() => {
    const el = audio.current;
    if (!el?.getAttribute("src")) return;
    el.play().catch((err: unknown) => {
      // Autoplay blocked: stay paused, say nothing. Anything else is a real error.
      if ((err as DOMException)?.name !== "NotAllowedError" && (err as DOMException)?.name !== "AbortError") setError(true);
      setPlaying(false);
    });
  }, []);

  const pause = useCallback(() => audio.current?.pause(), []);
  const toggle = useCallback(() => (audio.current?.paused ? play() : pause()), [play, pause]);
  const seek = useCallback((sec: number) => {
    const el = audio.current;
    if (!el) return;
    const max = Number.isFinite(el.duration) ? el.duration : sec;
    el.currentTime = Math.max(0, Math.min(sec, max));
    setCurrent(el.currentTime);
  }, []);

  // Element events.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const on: Record<string, () => void> = {
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      ended: () => setPlaying(false),
      waiting: () => setBuffering(true),
      playing: () => setBuffering(false),
      canplay: () => setBuffering(false),
      loadedmetadata: () => Number.isFinite(el.duration) && setDuration(el.duration),
      durationchange: () => Number.isFinite(el.duration) && setDuration(el.duration),
      timeupdate: () => setCurrent(el.currentTime),
      error: () => {
        setError(true);
        setPlaying(false);
        setBuffering(false);
      },
    };
    for (const [name, fn] of Object.entries(on)) el.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of Object.entries(on)) el.removeEventListener(name, fn);
    };
  }, []);

  // Smooth progress while playing.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      if (audio.current) setCurrent(audio.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // TODO(M6): remove once the mini player keeps audio going across pages.
  // Until then, leaving a player (/track/{slug}) pauses playback.
  const pathname = usePathname();
  useEffect(() => {
    if (!/^\/track\/[^/]+$/.test(pathname)) audio.current?.pause();
  }, [pathname]);

  const value = useMemo<AudioState>(
    () => ({ track, playing, current, duration, buffering, error, load, play, pause, toggle, seek }),
    [track, playing, current, duration, buffering, error, load, play, pause, toggle, seek],
  );

  return (
    <AudioContext value={value}>
      {children}
      <audio ref={audio} preload="metadata" />
    </AudioContext>
  );
}

export function useAudio(): AudioState {
  const ctx = use(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside <AudioProvider>");
  return ctx;
}
