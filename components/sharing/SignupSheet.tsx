"use client";

import { SpotifyIcon } from "@/components/icons/SpotifyIcon";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { signInCopy, signInLink, signInTitle, type SignInAsk, type SignInPrompt } from "@/lib/sign-in-prompt";

/**
 * Send to {owner} · sign in with Spotify (06-06, CfSignup). The same sheet
 * asks "Sign in to make another {mode}" after their one anonymous make.
 */
export function SignupSheet({ prompt, ask, onClose }: { prompt: SignInPrompt; ask: SignInAsk; onClose: () => void }) {
  return (
    <BottomSheet title={signInTitle(ask, prompt)} onClose={onClose} backdropLabel="Close" paddingBottom={52}>
      <p className="text-text-secondary -mt-2 mb-0 text-base leading-[1.45]">{signInCopy(ask.reason, prompt)}</p>
      {/* A plain link: the sign-in route sets the session cookie, claims, then redirects. */}
      <a
        href={signInLink(ask, prompt)}
        className="bg-accent text-on-accent flex h-14 items-center justify-center gap-2.5 rounded-full text-[17px] leading-tight font-semibold"
      >
        <SpotifyIcon />
        Continue with Spotify
      </a>
    </BottomSheet>
  );
}
