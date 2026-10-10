"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EyeIcon, LinkIcon, WhatsAppIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { cleanUrl, whatsappHref } from "@/lib/share-message";

type Props = {
  /** The absolute /track/{slug} URL (lib/server/app-url.ts trackUrl). */
  shareUrl: string;
  /** Track title, for the share message. */
  title: string;
  onClose: () => void;
  /** "Open as recipient" row — only on the creator's sheet (03-06, 06-07). */
  recipientHref?: string;
  /** Design state for the gallery. */
  initialCopied?: boolean;
};

const ROW = "flex h-16 items-center gap-3.5 px-1 text-left text-text";
const RING = "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-text";
const COPIED_MS = 2000;

/** Share this track (03-06 / 05-07 / 06-07, CfShareOverSplit). */
export function ShareSheet({ shareUrl, title, onClose, recipientHref, initialCopied = false }: Props) {
  const url = cleanUrl(shareUrl);
  const [copied, setCopied] = useState(initialCopied);
  const [copyFailed, setCopyFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const manual = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (copyFailed) manual.current?.select();
  }, [copyFailed]);

  const copy = async () => {
    const ok = await copyText(url);
    clearTimeout(timer.current);
    if (!ok) {
      setCopied(false);
      setCopyFailed(true);
      setAnnouncement("Couldn’t copy. The link is selected below.");
      return;
    }
    setCopyFailed(false);
    setCopied(true);
    // Re-announce on every tap (a changed string is what screen readers read).
    setAnnouncement((a) => (a === "Link copied" ? "Link copied." : "Link copied"));
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <BottomSheet title="Share this track" onClose={onClose} backdropLabel="Close share sheet" paddingBottom={recipientHref ? 14 : 34}>
      <div className="flex flex-col">
        <button type="button" onClick={copy} data-share-url={url} className={`${ROW} border-raised cursor-pointer border-b`}>
          <span className="bg-accent text-on-accent flex size-11 shrink-0 items-center justify-center rounded-full">
            <LinkIcon size={20} />
          </span>
          <span className="flex flex-grow flex-col gap-0.5">
            <span className="text-base font-semibold">Copy link</span>
            <span className="text-text-secondary text-[13px]">Anyone with the link can listen</span>
          </span>
          {copied ? (
            <span aria-hidden="true" className="text-text-secondary text-[13px]">
              Copied ✓
            </span>
          ) : null}
        </button>
        {copyFailed ? (
          <label className="border-raised flex flex-col gap-1 border-b px-1 py-3">
            <span className="text-text-secondary text-[13px]">Copy this link:</span>
            <input
              ref={manual}
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="bg-raised text-text h-11 rounded-lg px-3 text-[15px] outline-none"
            />
          </label>
        ) : null}
        <a
          href={whatsappHref(title, url)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ROW} ${recipientHref ? "border-raised border-b" : ""}`}
        >
          <span className="bg-whatsapp flex size-11 shrink-0 items-center justify-center rounded-full text-white">
            <WhatsAppIcon size={24} />
          </span>
          <span className="flex-grow text-base font-semibold">WhatsApp</span>
        </a>
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
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </BottomSheet>
  );
}

/** Clipboard API, falling back to a hidden textarea + execCommand (older iOS, insecure contexts). */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  Object.assign(ta.style, { position: "fixed", top: "0", left: "0", opacity: "0" });
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
