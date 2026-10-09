// Rewrite step 2 themes (CfRewrite2.dc.html), in design order. `phrase` is the
// form used in "…but it's about {phrase}." `id` is what the API and the
// audio catalogue use. The design defines icons for these
// but doesn't render them, so they're omitted.

export type Theme = { id: string; label: string; phrase: string };

export const THEMES: Theme[] = [
  { id: "moving-to-london", label: "Moving to London", phrase: "moving to London" },
  { id: "heartbreak", label: "Heartbreak", phrase: "heartbreak" },
  { id: "a-summer-roadtrip", label: "A summer roadtrip", phrase: "a summer roadtrip" },
  { id: "self-love", label: "Self-love", phrase: "self-love" },
  { id: "falling-in-love", label: "Falling in love", phrase: "falling in love" },
  { id: "growing-up", label: "Growing up", phrase: "growing up" },
  { id: "my-best-friends", label: "My best friends", phrase: "my best friends" },
  { id: "a-night-out", label: "A night out", phrase: "a night out" },
  { id: "missing-home", label: "Missing home", phrase: "missing home" },
  { id: "first-dates", label: "First dates", phrase: "first dates" },
  { id: "payday", label: "Payday", phrase: "payday" },
];

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}
