import { ImageResponse } from "next/og";
import { MODES } from "@/lib/config/modes";
import { ogTitleLines } from "@/lib/og";
import { OG_SIZE, ogFonts } from "@/lib/server/og/fonts";
import { getTrackBySlug } from "@/lib/server/tracks";

// Link preview for a shared track: 1200 × 630, flat colours (well under
// WhatsApp's 300 KB). Nothing session-specific.

export const alt = "A track made on Mozart";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = await getTrackBySlug(slug);
  const fonts = await ogFonts();
  const title = track?.title ?? "Mozart";
  // Unowned (anonymous) tracks are "by a friend": nothing about the viewer or cookie.
  const owner = track ? (track.owner?.firstName ?? "a friend") : undefined;
  const mode = MODES[track?.mode ?? "remix"];
  const initial = (track?.owner?.firstName ?? (track ? "A" : "M")).charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#121212", padding: 60, gap: 56, fontFamily: "DM Sans" }}>
        <div
          style={{
            width: 510,
            height: 510,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: mode.hex,
            borderRadius: 40,
          }}
        >
          <div
            style={{
              width: 290,
              height: 290,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#2e2e2e",
              borderRadius: 32,
              fontSize: 120,
              fontWeight: 700,
              color: "rgba(217,217,217,0.55)",
            }}
          >
            {initial}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "6px 0" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#d9d9d9", letterSpacing: "-0.01em" }}>Mozart</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ogTitleLines(title).map((line) => (
                <div key={line} style={{ fontSize: 60, fontWeight: 700, color: "#d9d9d9", lineHeight: 1.12, whiteSpace: "nowrap" }}>
                  {line}
                </div>
              ))}
            </div>
            {owner ? <div style={{ fontSize: 36, fontWeight: 500, color: "#bababa" }}>{`by ${owner}`}</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 500, color: "#bababa" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: mode.hex }} />
            Tap to listen & make your own
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
