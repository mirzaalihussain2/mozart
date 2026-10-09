"use client";

import Link from "next/link";
import { useState } from "react";
import { ChatIcon, EyeIcon, LinkIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";

type Props = {
  onClose: () => void;
  /** "Open as recipient" row — only on the creator's sheet (03-06, 06-07). */
  recipientHref?: string;
  /** Design state for the gallery. */
  initialCopied?: boolean;
};

const ROW = "flex h-16 items-center gap-3.5 px-1 text-left text-text";
const RING = "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-text";

/** Share this track (03-06 / 05-07 / 06-07, CfShareOverSplit). */
export function ShareSheet({ onClose, recipientHref, initialCopied = false }: Props) {
  const [copied, setCopied] = useState(initialCopied);
  return (
    <BottomSheet title="Share this track" onClose={onClose} backdropLabel="Close share sheet" paddingBottom={recipientHref ? 14 : 34}>
      <div className="flex flex-col">
        <button
          type="button"
          // TODO(M4): copy the /track/{slug} URL to the clipboard.
          onClick={() => setCopied(true)}
          className={`${ROW} border-raised cursor-pointer border-b`}
        >
          <span className="bg-accent text-on-accent flex size-11 shrink-0 items-center justify-center rounded-full">
            <LinkIcon size={20} />
          </span>
          <span className="flex flex-grow flex-col gap-0.5">
            <span className="text-base font-semibold">Copy link</span>
            <span className="text-text-secondary text-[13px]">Anyone with the link can listen</span>
          </span>
          {copied ? <span className="text-text-secondary text-[13px]">Copied ✓</span> : null}
        </button>
        <button
          type="button"
          // TODO(M4): open WhatsApp with the track link.
          className={`${ROW} cursor-pointer ${recipientHref ? "border-raised border-b" : ""}`}
        >
          <span className={RING}>
            <ChatIcon size={20} strokeWidth={1.8} />
          </span>
          <span className="flex-grow text-base font-semibold">WhatsApp</span>
        </button>
        {recipientHref ? (
          <Link href={recipientHref} className={ROW}>
            <span className={RING}>
              <EyeIcon size={20} strokeWidth={1.8} />
            </span>
            <span className="flex flex-grow flex-col gap-0.5">
              <span className="text-base font-semibold">Open as recipient</span>
              <span className="text-text-secondary text-[13px]">See what your friend will see</span>
            </span>
          </Link>
        ) : null}
      </div>
    </BottomSheet>
  );
}
