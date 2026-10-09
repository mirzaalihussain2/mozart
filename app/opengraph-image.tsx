import { ImageResponse } from "next/og";
import { OG_SIZE, ogFonts } from "@/lib/server/og/fonts";

// Default link preview (e.g. for /): the Mozart wordmark on #121212.

export const alt = "Mozart — make music from what you already love";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#121212",
          fontFamily: "DM Sans",
        }}
      >
        <div style={{ display: "flex", gap: 18 }}>
          {["#ff754c", "#a259ff", "#2ec4b6", "#ffc93c"].map((c) => (
            <div key={c} style={{ width: 28, height: 28, borderRadius: 14, background: c }} />
          ))}
        </div>
        <div style={{ fontSize: 132, fontWeight: 700, color: "#d9d9d9", letterSpacing: "-0.02em" }}>Mozart</div>
        <div style={{ fontSize: 40, fontWeight: 500, color: "#bababa" }}>Make music from what you already love.</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
