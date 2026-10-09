// pnpm test:unit — personas, starter libraries, the post-sign-in redirect and
// claiming. The database-backed tests use the real database (DATABASE_URL from
// .env.local): they only touch rows they create, plus Derek's and Candice's
// libraries, which every sign-in resets anyway.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { config } from "dotenv";
import { CANDICE, DEREK, FALLBACK_ORDER } from "../../lib/config/personas";
import { pickPersona, signInRedirect, trackSlugFromPath } from "../../lib/sign-in";

config({ path: ".env.local", quiet: true });

test("the Spotify fallback is Candice, or Derek when the track is hers", () => {
  assert.equal(pickPersona(FALLBACK_ORDER, CANDICE.id).firstName, "Derek");
  assert.equal(pickPersona(FALLBACK_ORDER, DEREK.id).firstName, "Candice");
  assert.equal(pickPersona(FALLBACK_ORDER, null).firstName, "Candice");
  assert.equal(pickPersona(FALLBACK_ORDER, randomUUID()).firstName, "Candice");
});

test("starter libraries are made the way real tracks are, from each persona's own taste", async () => {
  const { starterRows } = await import("../../lib/server/auth/personas");
  const { AUDIO_CATALOGUE } = await import("../../lib/config/audio-catalogue");
  const now = Date.now();
  for (const persona of [DEREK, CANDICE]) {
    const rows = starterRows(persona, now);
    assert.equal(rows.length, 6, persona.firstName);
    const songs = new Set(persona.spotifyTaste.topTracks.map((t) => t.name));
    for (const r of rows) {
      assert.ok(r.slug.startsWith(`${persona.firstName.toLowerCase()}-`), r.slug);
      assert.ok(AUDIO_CATALOGUE.some((a) => a.file === r.audioUrl && a.id === r.generationInput.audioId), r.slug);
      assert.ok((r.title.match(/×/g) ?? []).length <= 1, `${r.title}: never a double ×`);
      if (r.mode === "new") assert.ok(!r.title.includes("×"), r.title);
      else {
        assert.ok(songs.has(r.generationInput.rootSong), `${r.slug}: root is one of ${persona.firstName}'s songs`);
        assert.equal(r.title, `${r.generationInput.rootSong} × ${r.generationInput.label}`);
      }
      if (r.sourceSlug) {
        const source = rows.find((x) => x.slug === r.sourceSlug)!;
        assert.ok(rows.indexOf(source) < rows.indexOf(r), "sources come first");
        assert.notEqual(r.audioUrl, source.audioUrl, "never the source's own file");
        assert.equal(r.generationInput.rootSong, source.generationInput.rootSong);
      }
    }
    // Newest first, all in the past.
    const times = rows.map((r) => r.createdAt.getTime());
    assert.deepEqual([...times].sort((a, b) => b - a), times);
    assert.ok(times.every((t) => t < now));
  }
  // Covers land on a file tagged with that singer.
  const kb = starterRows(CANDICE, now).find((r) => r.slug === "candice-kill-bill-arijit")!;
  assert.equal(kb.title, "Kill Bill × Arijit Singh");
  assert.ok(AUDIO_CATALOGUE.find((a) => a.file === kb.audioUrl)!.singers.includes("arijit-singh"));
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
  const { resetPersona } = await import("../../lib/server/auth/personas");
  for (const p of [DEREK, CANDICE]) await resetPersona(p);
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

test("pickFallbackPersona: Derek's track → Candice; Candice's → Derek; anonymous from Candice's → Derek; no track → Candice", async () => {
  const { pickFallbackPersona } = await import("../../lib/server/auth/personas");
  const { insert } = await dbHelpers();
  const derek = await insert({ owner: DEREK.id, anon: null });
  const candice = await insert({ owner: CANDICE.id, anon: null });
  const anon = await insert({ owner: null, anon: randomUUID(), source: candice.id });

  assert.equal((await pickFallbackPersona(`/track/${derek.slug}?share=1`)).firstName, "Candice");
  assert.equal((await pickFallbackPersona(`/track/${candice.slug}/cover`)).firstName, "Derek");
  assert.equal((await pickFallbackPersona(`/track/${anon.slug}?share=1`)).firstName, "Derek");
  assert.equal((await pickFallbackPersona("/create")).firstName, "Candice");
  assert.equal((await pickFallbackPersona("/track/does-not-exist")).firstName, "Candice");
});

test("resetPersona: back to the starters, same ids; their other tracks go; tracks made from a starter keep their source", async () => {
  const { resetPersona } = await import("../../lib/server/auth/personas");
  const { insert } = await dbHelpers();
  const starters = async () =>
    sql!<{ slug: string; id: string }[]>`select public_slug as slug, id from tracks where owner_user_id = ${DEREK.id} order by public_slug`;
  const before = await starters();
  assert.equal(before.length, 6);
  const extra = await insert({ owner: DEREK.id, anon: null });
  const fromStarter = await insert({ owner: null, anon: randomUUID(), source: before[0].id });

  await resetPersona(DEREK);
  assert.deepEqual(await starters(), before, "same six starters, same ids");
  assert.equal((await sql!`select 1 from tracks where public_slug = ${extra.slug}`).length, 0, "his other track is gone");
  const [kept] = await sql!<{ source: string | null }[]>`select source_track_id as source from tracks where public_slug = ${fromStarter.slug}`;
  assert.equal(kept.source, before[0].id);
});

test("deleteOwnedTrack: only the owner's; a deleted starter comes back at the next reset", async () => {
  const { deleteOwnedTrack } = await import("../../lib/server/tracks");
  const { resetPersona } = await import("../../lib/server/auth/personas");
  await dbHelpers();
  const slug = "candice-espresso-disco";
  const id = async () => (await sql!<{ id: string }[]>`select id from tracks where public_slug = ${slug}`)[0]?.id;
  const before = await id();
  assert.ok(before);
  assert.equal(await deleteOwnedTrack(slug, DEREK.id), false, "not Derek's");
  assert.equal(await id(), before);
  assert.equal(await deleteOwnedTrack(slug, CANDICE.id), true);
  assert.equal(await id(), undefined);
  await resetPersona(CANDICE);
  assert.ok(await id(), "back after her next sign-in");
});

test("claiming moves only this browser's unowned tracks, once", async () => {
  const { claimAnonTracks } = await import("../../lib/server/auth/claim");
  const { insert, owner } = await dbHelpers();
  const mine = randomUUID();
  const theirs = randomUUID();
  const a = await insert({ owner: null, anon: mine });
  const owned = await insert({ owner: DEREK.id, anon: mine }); // already owned: untouched
  const other = await insert({ owner: null, anon: theirs }); // another browser: untouched

  const first = await claimAnonTracks(mine, CANDICE.id);
  assert.deepEqual(first.map((t) => t.slug), [a.slug]);
  assert.deepEqual(await owner(a.slug), { o: CANDICE.id, a: null });
  assert.deepEqual(await owner(owned.slug), { o: DEREK.id, a: mine });
  assert.deepEqual(await owner(other.slug), { o: null, a: theirs });

  // Replaying the sign-in claims nothing more.
  assert.equal((await claimAnonTracks(mine, CANDICE.id)).length, 0);
  // A tampered / already-claimed id claims nothing.
  assert.equal((await claimAnonTracks(randomUUID(), CANDICE.id)).length, 0);
});
