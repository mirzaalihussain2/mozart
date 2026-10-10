import "server-only";

// Generated album art lives in Supabase Storage: a public bucket `artwork`,
// written only from the server with SUPABASE_SECRET_KEY (plain fetch, no SDK).
// Every image gets its own file name and is never overwritten, because the
// CDN keeps serving a replaced or deleted file for a while.
//   tracks/{trackId}-{random}.jpg     one per generated track, deleted with it
//   starters/{slug}-{random}.jpg      demo starter tracks (pnpm artwork:starters), never deleted by the app

const BUCKET = "artwork";
const TIMEOUT_MS = 10_000;

const base = () => (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const headers = () => ({ apikey: process.env.SUPABASE_SECRET_KEY ?? "" });

export function storageEnabled(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
}

/** The public URL of an object in the bucket. */
export function publicUrl(path: string): string {
  return `${base()}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Uploads a new object (never overwrites) and returns its public URL. */
export async function upload(path: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<string> {
  const res = await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...headers(), "content-type": contentType, "cache-control": "max-age=31536000", "x-upsert": "false" },
    body: bytes,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`storage upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return publicUrl(path);
}

/**
 * The bucket path of a generated track's image, from its public URL; null for
 * anything else (starter art, other hosts), which the app never deletes.
 */
export function trackArtworkPath(url: string | null | undefined): string | null {
  if (!url || !base()) return null;
  const prefix = publicUrl("tracks/");
  return url.startsWith(prefix) ? `tracks/${url.slice(prefix.length)}` : null;
}

/** Deletes generated tracks' images by URL. Best effort: logs and carries on. */
export async function removeTrackArtwork(urls: (string | null | undefined)[]): Promise<void> {
  const prefixes = urls.map(trackArtworkPath).filter((p): p is string => !!p);
  if (!prefixes.length || !storageEnabled()) return;
  try {
    const res = await fetch(`${base()}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { ...headers(), "content-type": "application/json" },
      body: JSON.stringify({ prefixes }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`artwork: delete failed (${res.status})`, (await res.text()).slice(0, 200));
  } catch (err) {
    console.error("artwork: delete failed", err);
  }
}
