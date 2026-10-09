// Something new (CfVibe.dc.html): ideas that rotate as ghost text in the empty
// box every 3.5 s. Tapping Generate with an empty box uses the idea on screen;
// its `label` becomes the track title (e.g. "Euphoric electronic pop").

export type Idea = { id: string; text: string; label: string };

export const IDEAS: Idea[] = [
  {
    id: "euphoric-anthem",
    text: "A euphoric Fred again..-style anthem about a summer that ended too soon",
    label: "Euphoric electronic pop",
  },
  { id: "pop-punk-bollywood", text: "A pop-punk breakup song with a Bollywood string section", label: "Pop-punk Bollywood breakup" },
  { id: "late-night-garage", text: "Late-night UK garage with Taylor Swift-style storytelling", label: "Late-night UK garage" },
  { id: "rainy-day-lofi", text: "A rainy-day lo-fi song about missing home", label: "Rainy-day lo-fi" },
];

export function getIdea(id: string): Idea | undefined {
  return IDEAS.find((i) => i.id === id);
}

export const IDEA_ROTATE_MS = 3500;

// Vibe from a player (CfCVibe.dc.html) has no ideas, only a placeholder.
export const VIBE_PLACEHOLDER = "Describe how you want to change this song…";
