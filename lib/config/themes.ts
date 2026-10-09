// Rewrite step 2 themes (CfRewrite2.dc.html), in design order. `phrase` is the
// form used in "…but it's about {phrase}." The design defines icons for these
// but doesn't render them, so they're omitted.

export type Theme = { label: string; phrase: string };

export const THEMES: Theme[] = [
  { label: "Moving to London", phrase: "moving to London" },
  { label: "Heartbreak", phrase: "heartbreak" },
  { label: "A summer roadtrip", phrase: "a summer roadtrip" },
  { label: "Self-love", phrase: "self-love" },
  { label: "Falling in love", phrase: "falling in love" },
  { label: "Growing up", phrase: "growing up" },
  { label: "My best friends", phrase: "my best friends" },
  { label: "A night out", phrase: "a night out" },
  { label: "Missing home", phrase: "missing home" },
  { label: "First dates", phrase: "first dates" },
  { label: "Payday", phrase: "payday" },
];
