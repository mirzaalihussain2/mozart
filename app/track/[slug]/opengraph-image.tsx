import { ImageResponse } from "next/og";
import { MODES } from "@/lib/config/modes";
import { ogTitleLines } from "@/lib/og";
import { ogFonts } from "@/lib/server/og/fonts";
import { getTrackBySlug } from "@/lib/server/tracks";

// Link preview for a shared track: the track's album art (or, before it has
// any, a mode-coloured square) beside its title. Nothing session-specific.
// 600 × 315, half the usual 1200 × 630: next/og only makes PNGs, and a photo
// at full size is 400–850 KB, over WhatsApp's 300 KB limit. The layout is
// drawn at 1200 × 630 and scaled by K. A preview that still comes out too
// big falls back to the coloured square.

export const alt = "A track made on Mozart";
export const size = { width: 600, height: 315 };
export const contentType = "image/png";

const K = size.width / 1200;
const px = (n: number) => n * K;
/** WhatsApp ignores preview images over 300 KB; keep a margin. */
const MAX_BYTES = 280 * 1024;

type Card = { title: string; owner?: string; modeHex: string; initial: string; artworkUrl: string | null };

function card({ title, owner, modeHex, initial, artworkUrl }: Card) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#121212", padding: px(60), gap: px(56), fontFamily: "DM Sans" }}>
      {artworkUrl ? (
        <img src={artworkUrl} alt="" width={px(510)} height={px(510)} style={{ borderRadius: px(40), objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div
          style={{
            width: px(510),
            height: px(510),
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: modeHex,
            borderRadius: px(40),
          }}
        >
          <div
            style={{
              width: px(290),
              height: px(290),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#2e2e2e",
              borderRadius: px(32),
              fontSize: px(120),
              fontWeight: 700,
              color: "rgba(217,217,217,0.55)",
            }}
          >
            {initial}
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${px(6)}px 0` }}>
        <div style={{ fontSize: px(36), fontWeight: 700, color: "#d9d9d9", letterSpacing: "-0.01em" }}>Mozart</div>
        <div style={{ display: "flex", flexDirection: "column", gap: px(18) }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ogTitleLines(title).map((line) => (
              <div key={line} style={{ fontSize: px(60), fontWeight: 700, color: "#d9d9d9", lineHeight: 1.12, whiteSpace: "nowrap" }}>
                {line}
              </div>
            ))}
          </div>
          {owner ? <div style={{ fontSize: px(36), fontWeight: 500, color: "#bababa" }}>{`by ${owner}`}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: px(14), fontSize: px(28), fontWeight: 500, color: "#bababa" }}>
          <div style={{ width: px(14), height: px(14), borderRadius: px(7), background: modeHex }} />
          Tap to listen & make your own
        </div>
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  const fonts = await ogFonts();
  const base = {
    title: track?.title ?? "Mozart",
    // Unowned (anonymous) tracks are "by a friend": nothing about the viewer or cookie.
    owner: track ? (track.owner?.firstName ?? "a friend") : undefined,
    modeHex: MODES[track?.mode ?? "remix"].hex,
    initial: (track?.owner?.firstName ?? (track ? "A" : "M")).charAt(0).toUpperCase(),
  };
  const render = (artworkUrl: string | null) => new ImageResponse(card({ ...base, artworkUrl }), { ...size, fonts });

  if (!track?.artworkUrl) return render(null);
  const withArt = render(track.artworkUrl);
  const png = await withArt.arrayBuffer();
  if (png.byteLength <= MAX_BYTES) return new Response(png, { headers: withArt.headers });
  console.warn(`og: ${slug} preview with art is ${Math.round(png.byteLength / 1024)} KB; using the plain card`);
  return render(null);
}
