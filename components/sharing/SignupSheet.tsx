"use client";

import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { BottomSheet } from "@/components/ui/BottomSheet";

/** Send to {owner} · sign in with Spotify (06-06, CfSignup). */
export function SignupSheet({ ownerName, signInHref, onClose }: { ownerName: string; signInHref: string; onClose: () => void }) {
  return (
    <BottomSheet title={`Send to ${ownerName}`} onClose={onClose} backdropLabel="Close" paddingBottom={52}>
      <p className="text-text-secondary -mt-2 mb-0 text-base leading-[1.45]">
        Sign in with Spotify to save your remix and send it back.
      </p>
      {/* A plain link: the Spotify route sets the session cookie, then redirects. */}
      <a
        href={signInHref}
        className="bg-accent text-on-accent flex h-14 items-center justify-center gap-2.5 rounded-full text-[17px] leading-tight font-semibold"
      >
        <SpotifyIcon />
        Continue with Spotify
      </a>
    </BottomSheet>
  );
}
