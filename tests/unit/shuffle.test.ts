// pnpm test:unit — seeded shuffle for the step-1 song picker (lib/shuffle.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { mulberry32, newSeed, shuffled } from "../../lib/shuffle";

const SONGS = Array.from({ length: 20 }, (_, i) => `song-${i + 1}`);

test("the same seed gives the same order", () => {
  for (const seed of [0, 1, 42, 0xdeadbeef, 4294967295]) {
    assert.deepEqual(shuffled(SONGS, seed), shuffled(SONGS, seed));
  }
  assert.deepEqual(shuffled([3, 1, 2], 1), shuffled([3, 1, 2], 1));
});

test("it's a permutation, and the input is left alone", () => {
  const input = [...SONGS];
  for (let seed = 0; seed < 200; seed++) {
    const out = shuffled(input, seed);
    assert.equal(out.length, SONGS.length);
    assert.deepEqual([...out].sort(), [...SONGS].sort());
  }
  assert.deepEqual(input, SONGS);
  assert.deepEqual(shuffled([], 7), []);
  assert.deepEqual(shuffled(["only"], 7), ["only"]);
});

test("different seeds give different orders", () => {
  const orders = new Set(Array.from({ length: 50 }, (_, seed) => shuffled(SONGS, seed).join()));
  assert.equal(orders.size, 50);
});

test("roughly uniform: every song lands first about equally often", () => {
  const firsts = new Map<string, number>();
  const runs = 20_000;
  for (let seed = 0; seed < runs; seed++) {
    const first = shuffled(SONGS, seed)[0];
    firsts.set(first, (firsts.get(first) ?? 0) + 1);
  }
  assert.equal(firsts.size, SONGS.length);
  const expected = runs / SONGS.length; // 1000
  for (const count of firsts.values()) assert.ok(Math.abs(count - expected) < expected * 0.2, `count ${count}`);
});

test("mulberry32 stays in [0, 1); newSeed is a 32-bit integer", () => {
  const random = mulberry32(123);
  for (let i = 0; i < 1000; i++) {
    const x = random();
    assert.ok(x >= 0 && x < 1);
  }
  const seed = newSeed();
  assert.ok(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff);
});
