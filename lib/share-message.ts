// The one share text every share path uses (WhatsApp now; any future row too).

/** `"{title}" — I made this on Mozart. Listen and make your own version: {url}` */
export function shareMessage(title: string, url: string): string {
  return `“${title}” — I made this on Mozart. Listen and make your own version: ${url}`;
}

/** https://wa.me/?text=… — opens the app on phones, WhatsApp Web on desktop. */
export function whatsappHref(title: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage(title, url))}`;
}

/** The track URL without query or hash (never share ?view=… / ?share=…). */
export function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url.split(/[?#]/)[0];
  }
}
