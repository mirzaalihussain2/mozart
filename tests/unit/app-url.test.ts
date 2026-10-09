// pnpm test:unit — where share links and Open Graph URLs point (lib/app-url-core.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { originFromHeaders, resolveAppUrl } from "../../lib/app-url-core";

test("APP_URL wins (local, Vercel Production), without a trailing slash", () => {
  assert.equal(resolveAppUrl({ APP_URL: "http://127.0.0.1:3000" }), "http://127.0.0.1:3000");
  assert.equal(resolveAppUrl({ APP_URL: "https://mozart.example.com/", VERCEL_URL: "x.vercel.app" }, "https://other"), "https://mozart.example.com");
});

test("Vercel Preview: https://VERCEL_URL", () => {
  assert.equal(resolveAppUrl({ VERCEL_URL: "mozart-git-m4-share-ali.vercel.app" }), "https://mozart-git-m4-share-ali.vercel.app");
  assert.equal(resolveAppUrl({ APP_URL: "  ", VERCEL_URL: "https://p.vercel.app/" }), "https://p.vercel.app");
});

test("falls back to the request's origin, then 127.0.0.1", () => {
  assert.equal(resolveAppUrl({}, "https://tunnel.example/"), "https://tunnel.example");
  assert.equal(resolveAppUrl({}), "http://127.0.0.1:3000");
});

test("request origin from headers", () => {
  const h = (o: Record<string, string>) => (n: string) => o[n] ?? null;
  assert.equal(originFromHeaders(h({ host: "127.0.0.1:3000" })), "http://127.0.0.1:3000");
  assert.equal(originFromHeaders(h({ host: "mozart.app" })), "https://mozart.app");
  assert.equal(originFromHeaders(h({ "x-forwarded-host": "a.b", "x-forwarded-proto": "https,http", host: "internal" })), "https://a.b");
  assert.equal(originFromHeaders(h({})), null);
});
