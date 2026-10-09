"use client";

import { ShareIcon, TrashIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/BottomSheet";

type Props = {
  title: string;
  onClose: () => void;
  onShare: () => void;
  onDelete: () => void;
  deleting?: boolean;
  /** The last delete failed: say so and leave the sheet open. */
  failed?: boolean;
};

const ROW = "flex h-16 w-full cursor-pointer items-center gap-3.5 px-1 text-left disabled:cursor-default";
const RING = "flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px]";

/**
 * A Library row's ⋯ menu (no design): Share opens the share sheet; Delete
 * deletes straight away, no confirmation (Ali's call). Same sheet and row
 * style as Share this track (CfShareOverSplit); Delete is the one red thing.
 */
export function TrackActionsSheet({ title, onClose, onShare, onDelete, deleting = false, failed = false }: Props) {
  return (
    <BottomSheet title={title} onClose={onClose} backdropLabel="Close" paddingBottom={34}>
      <div className="flex flex-col">
        <button type="button" onClick={onShare} className={`${ROW} border-raised text-text border-b`}>
          <span className={`${RING} border-text`}>
            <ShareIcon size={20} strokeWidth={1.8} />
          </span>
          <span className="text-base font-semibold">Share</span>
        </button>
        <button type="button" onClick={onDelete} disabled={deleting} className={`${ROW} text-danger`}>
          <span className={`${RING} border-danger`}>
            <TrashIcon size={20} strokeWidth={1.8} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-semibold">{deleting ? "Deleting…" : "Delete"}</span>
            <span className="text-text-secondary text-[13px]">Anyone with the link won’t be able to play it</span>
          </span>
        </button>
        {failed ? (
          <p role="alert" className="text-danger m-0 px-1 pt-1 text-[13px]">
            Couldn’t delete it. Try again.
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
