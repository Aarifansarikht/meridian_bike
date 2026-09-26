/**
 * Exports the landing-page product shots (public/renders/*.webp) from the real GLB models.
 *
 *   1. npm run dev            (the /studio/:bikeId route only exists in dev)
 *   2. npm run capture-renders
 *
 * Needs a local Chrome/Edge; override with CHROME_PATH. Uses playwright-core (dev dependency).
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const BASE = process.env.DEV_URL ?? 'http://localhost:5173';
const BIKES = ['corsa', 'metro', 'zenith'];
const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) throw new Error('No Chrome/Edge found — set CHROME_PATH.');

mkdirSync('public/renders', { recursive: true });
const browser = await chromium.launch({
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });

for (const id of BIKES) {
  await page.goto(`${BASE}/studio/${id}`);
  await page.waitForFunction(() => window.__studioReady === true, null, { timeout: 180_000 });
  // Crop to the bike (alpha bounds) at a fixed 16:10 aspect so the <img> width/height stay valid.
  const dataUrl = await page.evaluate(() => {
    const src = document.querySelector('canvas');
    const tmp = Object.assign(document.createElement('canvas'), { width: src.width, height: src.height });
    const ctx = tmp.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, tmp.width, tmp.height);
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    let w = (x1 - x0) * 1.08, h = (y1 - y0) * 1.08;
    if (w / h > 1.6) h = w / 1.6; else w = h * 1.6;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const out = Object.assign(document.createElement('canvas'), { width: 1600, height: 1000 });
    out.getContext('2d').drawImage(src, cx - w / 2, cy - h / 2, w, h, 0, 0, 1600, 1000);
    return out.toDataURL('image/webp', 0.9);
  });
  writeFileSync(`public/renders/${id}.webp`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`✓ public/renders/${id}.webp`);
}
await browser.close();
