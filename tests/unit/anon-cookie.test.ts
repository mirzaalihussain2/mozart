// pnpm test:unit — the anonymous cookie (lib/anon-cookie.ts).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { ANON_COOKIE, anonCookieOptions, isUuid } from "../../lib/anon-cookie";

test("accepts what crypto.randomUUID() makes", () => {
  for (let i = 0; i < 50; i++) assert.ok(isUuid(randomUUID()));
  assert.ok(isUuid("E56A3F29-D662-4E37-8952-A56D2C3F6A7E"));
});

test("rejects anything else", () => {
  for (const bad of [undefined, null, 42, "", "abc", "e56a3f29-d662-4e37-8952-a56d2c3f6a7", "e56a3f29d6624e378952a56d2c3f6a7e",
    "e56a3f29-d662-4e37-8952-a56d2c3f6a7e; Path=/", "' or 1=1 --", "00000000-0000-0000-0000-000000000000", "e56a3f29-d662-4e37-c952-a56d2c3f6a7e"]) {
    assert.equal(isUuid(bad), false, String(bad));
  }
});

test("cookie attributes: httpOnly, Lax, path /, 1 year, Secure only in production", () => {
  assert.equal(ANON_COOKIE, "mozart_anon");
  assert.deepEqual(anonCookieOptions(true), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 31_536_000 });
  assert.equal(anonCookieOptions(false).secure, false);
});
