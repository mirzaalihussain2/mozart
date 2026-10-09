"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ModeIcon } from "@/components/icons/ModeIcon";
import { StepHeader } from "@/components/navigation/StepHeader";
import { Artwork, toneAt } from "@/components/track/Artwork";
import { ModeButton } from "@/components/ui/Buttons";
import { Pill } from "@/components/ui/Pill";
import { SavedToast } from "@/components/ui/Toast";
import { GENRES } from "@/lib/config/genres";
import { VIBE_PLACEHOLDER } from "@/lib/config/ideas";
import { MODES, type ModeId } from "@/lib/config/modes";
import { SINGERS, type Singer } from "@/lib/config/singers";
import { THEMES } from "@/lib/config/themes";
import { useGenerate } from "@/lib/client/use-generate";
import { useKeyboardViewport } from "@/lib/client/use-keyboard-viewport";
import { markPickerReturn } from "@/lib/client/use-shuffle-seed";
import { gridInitials } from "@/lib/format";
import { generationQuote } from "@/lib/generation";
import { SignupSheet } from "@/components/sharing/SignupSheet";
import type { SignInAsk, SignInPrompt } from "@/lib/sign-in-prompt";
import { GeneratingScreen } from "./GeneratingScreen";

export type StepTwoMode = Exclude<ModeId, "new">;

/** What's being changed: a picked song (Create flow) or the current track (from a player). */
export type Subject = {
  title: string;
  subtitle: string;
  initials: string;
  /** "change song" link back to step 1, or back to the player. */
  href: string;
  label: string;
};

export type StepTwoProps = {
  mode: StepTwoMode;
  subject: Subject;
  backHref: string;
  /** "Step 2 of 2" — only in Create-home flows. */
  showStep: boolean;
  /** For the Generating quote: root song title and, from someone else's track, the owner. */
  song: string;
  owner?: string;
  /** What's being changed: a picked song (Create flow) or the track (from a player). */
  source: { sourceSongId: string } | { sourceTrackId: string };
  /**
   * Signed-out recipients (05-02…05-06): who to "Send to" and the sign-in
   * link. Once their one make is used, Generate opens the Send-to sheet
   * instead of Generating.
   */
  signIn?: SignInPrompt;
  /** Cover singers: the viewer's top artists (server-provided); MOCK by default. */
  singers?: Singer[];
  /** `?saved=1`: back from "Sign in to make another …". Toast once, then `cleanHref` (this URL without it). */
  justSaved?: boolean;
  cleanHref?: string;
  /** Design states for the dev gallery (an option id). */
  initialChoice?: string;
  initialText?: string;
  initialFocused?: boolean;
};

const LEAD: Record<StepTwoMode, string> = {
  remix: "…but make it",
  cover: "…sung by",
  rewrite: "…but it’s about",
  vibe: "…but",
};

/**
 * Step 2 for Remix / Cover / Rewrite / Vibe — used from the Create flows
 * (02-02, 02-04, 02-06) and from a player (04-xx, 05-xx).
 */
export function StepTwo(props: StepTwoProps) {
  return (
    <>
      {props.mode === "vibe" ? <VibeStep {...props} /> : <OptionsStep {...props} />}
      <SavedToast show={!!props.justSaved} cleanHref={props.cleanHref} />
    </>
  );
}

function OptionsStep(props: StepTwoProps) {
  const { mode: modeId, subject, backHref, showStep, song, owner, initialChoice, singers = SINGERS } = props;
  const mode = MODES[modeId];
  const [choice, setChoice] = useState<string | undefined>(initialChoice);
  const blocked = useBlockedSheet(props.signIn, modeId);
  const gen = useGenerate({ onBlocked: blocked.open });
  // `choice` is an option id; the heading shows its label.
  const word =
    modeId === "remix"
      ? GENRES.find((g) => g.id === choice)?.name
      : modeId === "cover"
        ? singers.find((s) => s.id === choice)?.name
        : THEMES.find((t) => t.id === choice)?.phrase;

  if (gen.state.phase !== "idle") return <Generating gen={gen} />;

  // Both links back to the step-1 picker keep the order it showed.
  const toPicker = showStep ? () => markPickerReturn(backHref) : undefined;
  const generate = () => {
    if (!word || !choice) return;
    if (props.signIn?.makeUsed) return blocked.open("more");
    const input =
      modeId === "remix"
        ? { mode: modeId, genreId: choice, ...props.source }
        : modeId === "cover"
          ? { mode: modeId, singerId: choice, ...props.source }
          : { mode: "rewrite" as const, themeId: choice, ...props.source };
    void gen.start({ mode: modeId, quote: generationQuote({ mode: modeId, song, owner, change: word }), input });
  };

  return (
    <main className="flex min-h-dvh flex-col px-4 pt-12 pb-9">
      <StepHeader mode={mode} backHref={backHref} step={showStep ? 2 : undefined} onBack={toPicker} />
      <SubjectCard subject={subject} onClick={toPicker} />
      <div className="border-raised mt-6 shrink-0 border-t pt-4 text-center text-[30px] leading-[1.15] font-bold">
        <span className="text-text-secondary">{LEAD[modeId]} </span>
        {word ? <span className={mode.textClass}>{word}.</span> : null}
      </div>
      <div
        role="radiogroup"
        aria-label={{ remix: "Genre", cover: "Singer", rewrite: "New theme" }[modeId as "remix" | "cover" | "rewrite"]}
        className={`mt-[22px] flex flex-wrap justify-center px-1 ${modeId === "rewrite" ? "gap-2" : "gap-2.5"}`}
      >
        {modeId === "remix"
          ? GENRES.map((g) => (
              <Pill key={g.id} mode={mode} size="icon" selected={choice === g.id} onSelect={() => setChoice(g.id)}>
                <ModeIcon icon={[{ d: g.icon }]} size={18} strokeWidth={1.8} />
                {g.name}
              </Pill>
            ))
          : null}
        {modeId === "cover"
          ? singers.map(({ id, name }, k) => (
              <Pill key={id} mode={mode} size="avatar" selected={choice === id} onSelect={() => setChoice(id)}>
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[rgba(217,217,217,0.7)]"
                  style={{ background: toneAt(k, 1) }}
                >
                  {gridInitials(name)}
                </span>
                {name}
              </Pill>
            ))
          : null}
        {modeId === "rewrite"
          ? THEMES.map((t) => (
              <Pill key={t.id} mode={mode} size="text" selected={choice === t.id} onSelect={() => setChoice(t.id)}>
                {t.label}
              </Pill>
            ))
          : null}
      </div>
      <ModeButton
        mode={mode}
        className="mt-auto shrink-0"
        disabled={!word}
        onClick={generate}
      >
        Generate {modeId}
      </ModeButton>
      {blocked.sheet}
    </main>
  );
}

function VibeStep({ mode: modeId, subject, backHref, song, owner, source, signIn, initialText = "", initialFocused = false }: StepTwoProps) {
  const mode = MODES.vibe;
  const [text, setText] = useState(initialText);
  const [focused, setFocused] = useState(initialFocused);
  const box = useRef<HTMLTextAreaElement>(null);
  const blocked = useBlockedSheet(signIn, modeId);
  const gen = useGenerate({ onBlocked: blocked.open });
  const keyboard = useKeyboardViewport(focused);

  if (gen.state.phase !== "idle") return <Generating gen={gen} />;

  // The design keeps Generate enabled; with nothing typed it focuses the box instead.
  const generate = () => {
    if (!text.trim()) return box.current?.focus();
    if (!("sourceTrackId" in source)) return;
    if (signIn?.makeUsed) return blocked.open("more");
    void gen.start({
      mode: "vibe",
      quote: generationQuote({ mode: "vibe", song, owner, change: text }),
      input: { mode: "vibe", sourceTrackId: source.sourceTrackId, text },
    });
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[390px] flex-col" style={keyboard}>
      <div className="px-4 pt-12">
        <StepHeader mode={mode} backHref={backHref} />
        {focused ? <SubjectRow subject={subject} /> : <SubjectCard subject={subject} />}
        <div
          className={`border-raised border-t pt-4 text-center leading-[1.15] font-bold ${focused ? "mt-4 text-2xl" : "mt-6 text-[30px]"}`}
        >
          <span className="text-text-secondary">…but </span>
          <span className={mode.textClass}>your way.</span>
        </div>
        <div
          className={`bg-surface relative mt-4 rounded-[22px] border ${focused ? "h-[134px]" : "h-[172px]"}`}
          style={{ borderColor: focused ? mode.color : "#2e2e2e" }}
        >
          <label htmlFor="vibe-text" className="sr-only">
            Describe how to change this song
          </label>
          <textarea
            id="vibe-text"
            ref={box}
            value={text}
            autoFocus={initialFocused}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="text-text absolute inset-0 size-full resize-none rounded-[22px] border-none bg-transparent px-5 py-[18px] text-xl leading-[1.32] font-medium caret-[#ffc93c] outline-none"
          />
          {text ? null : (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-[18px] right-5 text-xl leading-[1.32] font-medium text-[#737373] ${focused ? "left-[26px]" : "left-5"}`}
            >
              {VIBE_PLACEHOLDER}
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow" />
      <div className={`px-4 ${focused ? "pb-3.5" : "pb-9"}`}>
        <ModeButton mode={mode} onClick={generate}>
          Generate song
        </ModeButton>
      </div>
      {blocked.sheet}
    </main>
  );
}

/**
 * The sign-in sheet over a step screen, opened when a signed-out visitor
 * can't make (another) track: "more" asks to make another of this `mode`.
 * `sendTo` from a 403 overrides the page's guess.
 */
function useBlockedSheet(prompt: SignInPrompt | undefined, mode: StepTwoMode) {
  const [open, setOpen] = useState<{ ask: SignInAsk; sendTo?: string } | null>(null);
  const sheet =
    open && prompt ? (
      <SignupSheet prompt={{ ...prompt, sendTo: open.sendTo ?? prompt.sendTo }} ask={open.ask} onClose={() => setOpen(null)} />
    ) : null;
  const ask = (reason: "more" | "save"): SignInAsk => (reason === "more" ? { reason, mode } : { reason });
  return { open: (reason: "more" | "save", sendTo?: string) => setOpen({ ask: ask(reason), sendTo }), sheet };
}

/** The Generating screen (or its error state) while a request is running. */
export function Generating({ gen }: { gen: ReturnType<typeof useGenerate> }) {
  const { state } = gen;
  if (state.phase === "idle") return null;
  return (
    <GeneratingScreen
      mode={state.request.mode}
      quote={state.request.quote}
      error={state.phase === "error" ? { message: state.message, onRetry: gen.retry, onBack: gen.cancel } : undefined}
    />
  );
}

/** Large picked-song / current-track card (CfRemix2, CfCRemix). */
function SubjectCard({ subject, onClick }: { subject: Subject; onClick?: () => void }) {
  return (
    <Link
      href={subject.href}
      onClick={onClick}
      aria-label={subject.label}
      className="text-text mt-5 flex shrink-0 flex-col items-center gap-1.5 self-center text-center"
    >
      <span className="mb-2.5">
        <Artwork variant="hero" initials={subject.initials} />
      </span>
      <span className="text-[26px] leading-[1.15] font-bold">{subject.title}</span>
      <span className="text-text-secondary text-[15px]">{subject.subtitle}</span>
    </Link>
  );
}

/** Compact track row while the Vibe box is focused (CfCVibeTap). */
function SubjectRow({ subject }: { subject: Subject }) {
  return (
    <Link href={subject.href} aria-label={subject.label} className="text-text mt-3 flex items-center gap-3">
      <Artwork variant="row" initials={subject.initials} />
      <span className="flex flex-col gap-0.5">
        <span className="text-[17px] font-bold">{subject.title}</span>
        <span className="text-text-secondary text-sm">{subject.subtitle}</span>
      </span>
    </Link>
  );
}
