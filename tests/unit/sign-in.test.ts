// pnpm test:unit — personas, the post-sign-in redirect and claiming.
// The last two tests use the real database (DATABASE_URL from .env.local)
// and only touch rows they create.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { config } from "dotenv";
import { DUMMY_USER, PERSONAS, SAM_USER } from "../../lib/config/dummy-user";
import { pickPersona, signInRedirect, trackSlugFromPath } from "../../lib/sign-in";

config({ path: ".env.local", quiet: true });

test("the first persona who isn't the track's owner", () => {
  assert.equal(pickPersona(PERSONAS, DUMMY_USER.id).firstName, "Sam");
  assert.equal(pickPersona(PERSONAS, SAM_USER.id).firstName, "Ali");
  assert.equal(pickPersona(PERSONAS, null).firstName, "Ali");
  assert.equal(pickPersona(PERSONAS, randomUUID()).firstName, "Ali");
});

test("track slugs from returnTo paths", () => {
  assert.equal(trackSlugFromPath("/track/cruel-bolly"), "cruel-bolly");
  assert.equal(trackSlugFromPath("/track/abc123?share=1"), "abc123");
  assert.equal(trackSlugFromPath("/track/abc123/remix"), "abc123");
  assert.equal(trackSlugFromPath("/create"), null);
  assert.equal(trackSlugFromPath("/library"), null);
});

test("saved=1 only when something was claimed", () => {
  assert.equal(signInRedirect("/track/abc?share=1", 0), "/track/abc?share=1");
  assert.equal(signInRedirect("/track/abc?share=1", 1), "/track/abc?share=1&saved=1");
  assert.equal(signInRedirect("/track/abc", 2), "/track/abc?saved=1");
  assert.equal(signInRedirect("/create", 0), "/create");
  // A returnTo that already asks for saved=1 can't fake it when nothing was claimed… (sheets never send it)
  assert.equal(signInRedirect("/track/abc?saved=1", 1), "/track/abc?saved=1");
});

// --- Database-backed --------------------------------------------------------

const made: string[] = [];
let sql: import("postgres").Sql | null = null;

async function dbHelpers() {
  const postgres = (await import("postgres")).default;
  sql ??= postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const { upsertPersona } = await import("../../lib/server/auth/personas");
  for (const p of PERSONAS) await upsertPersona(p);
  const insert = async (fields: { owner: string | null; anon: string | null; source?: string | null }) => {
    const slug = `t${randomUUID().replace(/-/g, "").slice(0, 9)}`;
    const [row] = await sql!<{ id: string }[]>`
      insert into tracks (public_slug, mode, title, audio_url, generation_input, owner_user_id, anonymous_session_id, source_track_id)
      values (${slug}, 'remix', 'Test × Track', '/audio/electronic-dance.mp3', ${sql!.json({})}, ${fields.owner}, ${fields.anon}, ${fields.source ?? null})
      returning id`;
    made.push(slug);
    return { id: row.id, slug };
  };
  const owner = async (slug: string) => (await sql!<{ o: string | null; a: string | null }[]>`select owner_user_id as o, anonymous_session_id as a from tracks where public_slug = ${slug}`)[0];
  return { insert, owner };
}

after(async () => {
  if (sql && made.length) await sql`delete from tracks where public_slug in ${sql(made)}`;
  await sql?.end();
  const { db } = await import("../../lib/server/db");
  await (db as unknown as { $client: { end: () => Promise<void> } }).$client.end();
});

test("pickDummyPersona: Ali's track → Sam; Sam's → Ali; anonymous from Ali's → Sam; no track → Ali", async () => {
  const { pickDummyPersona } = await import("../../lib/server/auth/personas");
  const { insert } = await dbHelpers();
  const ali = await insert({ owner: DUMMY_USER.id, anon: null });
  const sam = await insert({ owner: SAM_USER.id, anon: null });
  const anon = await insert({ owner: null, anon: randomUUID(), source: ali.id });

  assert.equal((await pickDummyPersona(`/track/${ali.slug}?share=1`)).firstName, "Sam");
  assert.equal((await pickDummyPersona(`/track/${sam.slug}`)).firstName, "Ali");
  assert.equal((await pickDummyPersona(`/track/${anon.slug}?share=1`)).firstName, "Sam");
  assert.equal((await pickDummyPersona("/create")).firstName, "Ali");
  assert.equal((await pickDummyPersona("/track/does-not-exist")).firstName, "Ali");
});

test("claiming moves only this browser's unowned tracks, once", async () => {
  const { claimAnonTracks } = await import("../../lib/server/auth/claim");
  const { insert, owner } = await dbHelpers();
  const mine = randomUUID();
  const theirs = randomUUID();
  const a = await insert({ owner: null, anon: mine });
  const owned = await insert({ owner: DUMMY_USER.id, anon: mine }); // already owned: untouched
  const other = await insert({ owner: null, anon: theirs }); // another browser: untouched

  const first = await claimAnonTracks(mine, SAM_USER.id);
  assert.deepEqual(first.map((t) => t.slug), [a.slug]);
  assert.deepEqual(await owner(a.slug), { o: SAM_USER.id, a: null });
  assert.deepEqual(await owner(owned.slug), { o: DUMMY_USER.id, a: mine });
  assert.deepEqual(await owner(other.slug), { o: null, a: theirs });

  // Replaying the sign-in claims nothing more.
  assert.equal((await claimAnonTracks(mine, SAM_USER.id)).length, 0);
  // A tampered / already-claimed id claims nothing.
  assert.equal((await claimAnonTracks(randomUUID(), SAM_USER.id)).length, 0);
});
