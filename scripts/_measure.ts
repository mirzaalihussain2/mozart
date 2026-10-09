import { chromium } from "@playwright/test";
(async () => {
  const [url, ...sels] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto("http://127.0.0.1:3000" + url); await p.evaluate("document.fonts.ready");
  for (const s of sels) {
    console.log(s, await p.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(s)}); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: r.x, y: r.y, w: r.width, h: r.height, lh: cs.lineHeight, fs: cs.fontSize }; })()`));
  }
  await b.close();
})();
