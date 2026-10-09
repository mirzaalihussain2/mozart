// Open Graph image text layout (app/track/[slug]/opengraph-image.tsx).

/**
 * Wraps a title into at most `maxLines` lines of about `maxChars` characters,
 * breaking at spaces (hard-splitting very long words). If it doesn't fit,
 * the last line ends with "…".
 */
export function ogTitleLines(title: string, maxChars = 17, maxLines = 2): string[] {
  const words = title.trim().split(/\s+/).flatMap((w) => (w.length > maxChars ? chunk(w, maxChars) : [w]));
  const lines: string[] = [];
  let i = 0;
  while (i < words.length && lines.length < maxLines) {
    let line = words[i++];
    while (i < words.length && line.length + 1 + words[i].length <= maxChars) line += ` ${words[i++]}`;
    lines.push(line);
  }
  if (i < words.length) {
    const last = lines[lines.length - 1];
    const room = maxChars - 1;
    lines[lines.length - 1] = `${(last.length > room ? last.slice(0, room) : last).replace(/[\s×.,;:—–-]+$/u, "")}…`;
  }
  return lines;
}

function chunk(word: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < word.length; i += size) out.push(word.slice(i, i + size));
  return out;
}
