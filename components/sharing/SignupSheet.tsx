"use client";

import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { signInCopy, type SignInPrompt, type SignInReason } from "@/lib/sign-in-prompt";

/** Send to {owner} · sign in with Spotify (06-06, CfSignup). */
export function SignupSheet({ prompt, reason, onClose }: { prompt: SignInPrompt; reason: SignInReason; onClose: () => void }) {
  return (
    <BottomSheet title={`Send to ${prompt.sendTo}`} onClose={onClose} backdropLabel="Close" paddingBottom={52}>
      <p className="text-text-secondary -mt-2 mb-0 text-base leading-[1.45]">{signInCopy(reason, prompt)}</p>
      {/* A plain link: the sign-in route sets the session cookie, claims, then redirects. */}
      <a
        href={prompt.href}
        className="bg-accent text-on-accent flex h-14 items-center justify-center gap-2.5 rounded-full text-[17px] leading-tight font-semibold"
      >
        <SpotifyIcon />
        Continue with Spotify
      </a>
    </BottomSheet>
  );
}
