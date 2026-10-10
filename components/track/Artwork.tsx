// Artwork: a grey square with initials (AGENTS.md §4); the design sizes are
// listed per variant. Players and the mini player use a crossed box. `src`
// shows a real image in the same box: a Spotify album cover in the pickers, or
// a generated track's album art (tracks.artwork_url) once it's made.

type Variant = "grid" | "hero" | "row" | "list" | "cover" | "mini";

const TONES = ["#2e2e2e", "#474747", "#5e5e5e"];

/** Tone used for the k-th item in a list (CfRemix1 cycles three greys). */
export function toneAt(k: number, offset = 0): string {
  return TONES[(k + offset) % TONES.length];
}

const STYLES: Record<Variant, string> = {
  grid: "aspect-square w-full rounded-art text-[17px]",
  hero: "size-[136px] rounded-card-sm text-[32px]",
  row: "size-[52px] rounded-art text-lg",
  // CfLibrary: 56 px content-box + 1 px border.
  list: "size-[58px] rounded-lg border border-raised",
  cover: "size-[342px] rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
  mini: "size-11 rounded-md",
};

const DEFAULT_TONE: Record<Variant, string> = {
  grid: TONES[0],
  hero: "#474747",
  row: "#474747",
  list: "#2e2e2e",
  cover: "#2e2e2e",
  mini: "#2e2e2e",
};

type ArtworkProps = {
  variant: Variant;
  initials?: string;
  tone?: string;
  /** A real image (Spotify album cover, or a track's album art); null/absent shows the placeholder. */
  src?: string | null;
  /** Lazy-load `src` (long grids). */
  lazy?: boolean;
};

export function Artwork({ variant, initials, tone, src, lazy }: ArtworkProps) {
  const crossed = variant === "cover" || variant === "mini";
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-bold text-[rgba(217,217,217,0.55)] ${STYLES[variant]}`}
      style={{ background: tone ?? DEFAULT_TONE[variant] }}
    >
      {src ? (
        // A plain <img>: Spotify CDN thumbnails and our own stored JPEGs, no optimiser needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading={lazy ? "lazy" : undefined} className="absolute inset-0 size-full object-cover" />
      ) : crossed ? (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
          <line x1="0" y1="0" x2="100" y2="100" stroke="#5e5e5e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#5e5e5e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        initials
      )}
    </span>
  );
}
