import "server-only";

// Image generation on Prodia (https://docs.prodia.com): FLUX.2 Klein 9B,
// text-to-image or image + text to image. One synchronous POST /v2/job that
// answers with the JPEG itself (Accept: image/jpeg). ~2 s, $0.003 an image.

const JOB_URL = "https://inference.prodia.com/v2/job";
const TXT2IMG = "inference.flux-2.klein.9b.txt2img.v1";
const IMG2IMG = "inference.flux-2.klein.9b.img2img.v1";
/** Covers show at up to 342 pt (1026 px at 3×). */
const SIZE = 1024;

export function prodiaEnabled(): boolean {
  return !!process.env.PRODIA_TOKEN;
}

export type InputImage = { name: string; bytes: Uint8Array<ArrayBuffer>; contentType: string };

/**
 * A square JPEG from a prompt, and optionally input images (the prompt refers
 * to them in this order). Throws on any failure.
 */
export async function generateImage(prompt: string, images: InputImage[], signal: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  const config = { prompt, width: SIZE, height: SIZE };
  const auth = { Authorization: `Bearer ${process.env.PRODIA_TOKEN ?? ""}`, Accept: "image/jpeg" };
  let res: Response;
  if (!images.length) {
    res = await fetch(JOB_URL, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ type: TXT2IMG, config }),
      signal,
    });
  } else {
    const form = new FormData();
    const job = { type: IMG2IMG, config: { ...config, images: images.map((i) => i.name) } };
    form.append("job", new Blob([JSON.stringify(job)], { type: "application/json" }), "job.json");
    for (const i of images) form.append("input", new Blob([i.bytes], { type: i.contentType }), i.name);
    res = await fetch(JOB_URL, { method: "POST", headers: auth, body: form, signal });
  }
  if (!res.ok) throw new Error(`prodia ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return new Uint8Array(await res.arrayBuffer());
}
