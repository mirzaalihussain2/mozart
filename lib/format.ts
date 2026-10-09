// Small display helpers shared by server and client components.

/** Grid artwork initials (CfRemix1): letters only, first letter of up to two words. "Fred again.." → "Fa", "Sum 41" → "S". */
export function gridInitials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

/** Large artwork initials (CfRemix2 / CfCover2): numbers kept whole. "Sum 41" → "S41", "Maroon 5" → "M5". */
export function heroInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => (/^\d+$/.test(w) ? w : w[0]))
    .join("");
}

/** "Cruel Summer × Bollywood" → "Cruel Summer" (the root song, per the naming rule). */
export function rootTitle(title: string): string {
  return title.split(" × ")[0];
}

/** Library dates: "Today", "Yesterday", else "3 Oct". */
export function relativeDay(date: Date, now: Date = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// Fixed so it reads "28 Sep" everywhere (ICU's en-GB says "Sept").
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 12 → "0:12" */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
