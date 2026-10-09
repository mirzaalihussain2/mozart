// Seeded, uniform shuffle for the step-1 song picker (02-01 / 02-03 / 02-05).
// The same seed always gives the same order, so a seed kept in history.state
// brings back the order the user saw (lib/client/use-shuffle-seed.ts).

/** mulberry32: a tiny 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A copy of `items` in Fisher–Yates order for `seed`. */
export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const random = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh 32-bit seed. Call from effects or handlers, never during render. */
export function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
