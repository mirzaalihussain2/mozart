"use client";

import { useEffect, useState } from "react";
import { StepHeader } from "@/components/navigation/StepHeader";
import { ModeButton } from "@/components/ui/Buttons";
import { IDEA_ROTATE_MS, IDEAS } from "@/lib/config/ideas";
import { MODES } from "@/lib/config/modes";
import { useGenerate } from "@/lib/client/use-generate";
import { generationQuote } from "@/lib/generation";
import { GeneratingScreen } from "./GeneratingScreen";

type Props = {
  destination: string;
  /** Design states for the dev gallery (02-08: typed + focused). */
  initialText?: string;
  initialFocused?: boolean;
  rotate?: boolean;
};

/**
 * Something new (02-07 / 02-08, CfVibe). Ideas rotate as ghost text while the
 * box is empty; Generate with an empty box uses the idea on screen.
 */
export function SomethingNew({ destination, initialText = "", initialFocused = false, rotate = true }: Props) {
  const mode = MODES.new;
  const [text, setText] = useState(initialText);
  const [focused, setFocused] = useState(initialFocused);
  const [idea, setIdea] = useState(0);
  const { request, start } = useGenerate();

  useEffect(() => {
    if (!rotate || focused || text) return;
    const t = setInterval(() => setIdea((i) => (i + 1) % IDEAS.length), IDEA_ROTATE_MS);
    return () => clearInterval(t);
  }, [rotate, focused, text]);

  if (request) return <GeneratingScreen mode={request.mode} quote={request.quote} destination={request.destination} />;

  const hint = focused ? (text ? "" : "Start typing, or tap Generate song to use the idea.") : "Tap the box to write your own.";

  return (
    <main className="flex h-dvh flex-col">
      <div className="px-5 pt-12">
        <StepHeader mode={mode} backHref="/create" />
        <h1 className="mt-4 mb-0 text-[30px] leading-[1.12] font-bold">Describe your song</h1>
        <div
          className="bg-surface relative mt-5 h-[202px] rounded-[22px] border"
          style={{ borderColor: focused ? mode.color : "#2e2e2e" }}
        >
          <label htmlFor="new-text" className="sr-only">
            Describe your song
          </label>
          <textarea
            id="new-text"
            value={text}
            autoFocus={initialFocused}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="text-text absolute inset-0 size-full resize-none rounded-[22px] border-none bg-transparent p-5 text-[22px] leading-[1.32] font-medium caret-[#ffc93c] outline-none"
          />
          {text ? null : (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-5 text-[22px] leading-[1.32] font-medium ${focused ? "text-[#737373]" : "text-text-secondary"}`}
            >
              {IDEAS[idea]}
            </div>
          )}
          {!focused && !text ? (
            <div aria-hidden="true" className="pointer-events-none absolute bottom-[18px] left-5 flex gap-1.5">
              {IDEAS.map((_, k) => (
                <span
                  key={k}
                  className="h-1.5 rounded-[3px]"
                  style={k === idea ? { width: 20, background: mode.color } : { width: 6, background: "#5e5e5e" }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-text-secondary mt-3 min-h-4 text-[13px]">{hint}</div>
      </div>
      <div className="flex-grow" />
      <div className={`px-5 ${focused ? "pb-3.5" : "pb-9"}`}>
        <ModeButton
          mode={mode}
          // Keep the box focused while tapping Generate (CfVibe "keep").
          onClick={() => {
            const prompt = text.trim() || IDEAS[idea];
            start({ mode: "new", destination, quote: generationQuote({ mode: "new", change: prompt }) });
          }}
        >
          Generate song
        </ModeButton>
      </div>
    </main>
  );
}
