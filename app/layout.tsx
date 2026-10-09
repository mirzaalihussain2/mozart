import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { getEnvAppUrl } from "@/lib/server/app-url";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // Env-only (APP_URL → VERCEL_URL), so the layout never waits on a request.
  metadataBase: new URL(getEnvAppUrl()),
  title: "Mozart",
  description: "Make music from what you already love.",
  openGraph: {
    type: "website",
    siteName: "Mozart",
    title: "Mozart",
    description: "Make music from what you already love.",
  },
  twitter: { card: "summary_large_image", title: "Mozart", description: "Make music from what you already love." },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121212",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} bg-bg`}>
      <body className="bg-bg text-text">
        <AudioProvider>
          <div className="relative mx-auto min-h-dvh w-full max-w-[390px] overflow-x-hidden">{children}</div>
        </AudioProvider>
      </body>
    </html>
  );
}
