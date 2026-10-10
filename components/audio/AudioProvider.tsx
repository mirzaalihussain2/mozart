"use client";

import { usePathname } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldKeepPlaying } from "@/lib/audio-routes";
import type { ModeId } from "@/lib/config/modes";

export type AudioTrack = {
  slug: string;
  title: string;
  artist: string;
  /** The track's audio_url. */
  src: string;
  mode?: ModeId;
  /** The viewer's own track (shows saved ✓ on the mini player). */
  isOwn?: boolean;
  /** From the catalogue; used until the file's metadata loads. */
  durationSec?: number;
  /** The track's album art (mini player); null until it's made. */
  artworkUrl?: string | null;
};

export type AudioState = {
  track: AudioTrack | null;
  playing: boolean;
  current: number;
  duration: number;
  buffering: boolean;
  error: boolean;
  /** Loads a track into the one <audio> element (no-op if that slug is already loaded). */
  load: (track: AudioTrack) => void;
  /** Pauses and unloads: no track, no source, time 0 (Close player, Log out). */
  stop: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (sec: number) => void;
};

const AudioContext = createContext<AudioState | null>(null);

/** Lock screen / notification: title, artist and album art. */
function setMediaMetadata(t: AudioTrack) {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  const artwork = t.artworkUrl ? [{ src: t.artworkUrl, sizes: "1024x1024", type: "image/jpeg" }] : undefined;
  navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, artwork });
}

/** The one global <audio> element (AGENTS.md §3). */
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
    if (!el) return;
    // Already loaded (e.g. back from the mini player): attach, never restart.
    // Album art made after it was loaded still reaches the mini player.
    if (loaded.current?.slug === next.slug) {
      if (next.artworkUrl && next.artworkUrl !== loaded.current.artworkUrl) {
        loaded.current = { ...loaded.current, artworkUrl: next.artworkUrl };
        setTrack(loaded.current);
        setMediaMetadata(loaded.current);
      }
      return;
    }
    loaded.current = next;
    el.src = next.src;
    el.load();
    setTrack(next);
    setCurrent(0);
    setDuration(next.durationSec ?? 0);
    setError(false);
    setMediaMetadata(next);
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
  const stop = useCallback(() => {
    const el = audio.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    loaded.current = null;
    setTrack(null);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setBuffering(false);
    setError(false);
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
  }, []);
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

  // Music keeps going on the player, the Create home and the Library (with
  // the mini player). Anywhere else it pauses but stays loaded.
  const pathname = usePathname();
  useEffect(() => {
    if (!shouldKeepPlaying(pathname)) audio.current?.pause();
  }, [pathname]);

  const value = useMemo<AudioState>(
    () => ({ track, playing, current, duration, buffering, error, load, stop, play, pause, toggle, seek }),
    [track, playing, current, duration, buffering, error, load, stop, play, pause, toggle, seek],
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
