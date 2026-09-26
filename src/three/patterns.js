/**
 * Procedural, seamlessly tiling surface patterns drawn on a 2D canvas.
 * Pure canvas code (no three.js) so the UI can reuse them for thumbnails.
 *
 * Conventions: opaque patterns carry detail in their luminance (used for albedo modulation
 * and bump height); `fleck` is transparent and its alpha is a paint-fleck mask.
 * To use a photographed texture instead, give a TEXTURES preset a `url` (see textureLibrary.js).
 */

const SIZE = 512;

/** Small deterministic PRNG so patterns are identical on every load. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws `fn` 9 times around the tile so shapes crossing an edge wrap seamlessly. */
function wrapped(ctx, fn) {
  for (const dx of [-SIZE, 0, SIZE]) {
    for (const dy of [-SIZE, 0, SIZE]) {
      ctx.save();
      ctx.translate(dx, dy);
      fn();
      ctx.restore();
    }
  }
}

const grey = (v, a = 1) => `rgba(${v},${v},${v},${a})`;

/** 2×2 twill carbon weave: tows alternate direction on a diagonal staircase. */
function carbonTwill(ctx) {
  const tows = 8;
  const s = SIZE / tows;
  const r = rng(7);
  for (let i = 0; i < tows; i++) {
    for (let j = 0; j < tows; j++) {
      const horizontal = (i + j) % 4 < 2;
      const x = i * s;
      const y = j * s;
      const g = horizontal ? ctx.createLinearGradient(x, y, x, y + s) : ctx.createLinearGradient(x, y, x + s, y);
      const hi = horizontal ? 70 : 52; // anisotropic sheen differs per direction
      g.addColorStop(0, grey(14));
      g.addColorStop(0.5, grey(hi));
      g.addColorStop(1, grey(14));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, s, s);
      // individual filaments along the tow
      ctx.strokeStyle = grey(0, 0.35);
      ctx.lineWidth = 1;
      for (let k = 0; k < 14; k++) {
        const o = r() * s;
        ctx.beginPath();
        if (horizontal) {
          ctx.moveTo(x, y + o);
          ctx.lineTo(x + s, y + o);
        } else {
          ctx.moveTo(x + o, y);
          ctx.lineTo(x + o, y + s);
        }
        ctx.stroke();
      }
    }
  }
}

/** Forged (chopped) carbon: random overlapping flakes with individual sheen. */
function forgedCarbon(ctx) {
  const r = rng(11);
  ctx.fillStyle = grey(16);
  ctx.fillRect(0, 0, SIZE, SIZE);
  const flakes = Array.from({ length: 700 }, () => ({
    x: r() * SIZE,
    y: r() * SIZE,
    w: 18 + r() * 46,
    h: 6 + r() * 16,
    a: r() * Math.PI,
    v: 18 + Math.floor(r() * 50),
  }));
  wrapped(ctx, () => {
    for (const f of flakes) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.a);
      const g = ctx.createLinearGradient(-f.w / 2, 0, f.w / 2, 0);
      g.addColorStop(0, grey(f.v - 8));
      g.addColorStop(0.5, grey(f.v + 14));
      g.addColorStop(1, grey(f.v - 8));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

/** Brushed metal: fine parallel streaks of varying brightness around mid-grey. */
function brushed(ctx) {
  const r = rng(3);
  ctx.fillStyle = grey(128);
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 2600; i++) {
    const y = r() * SIZE;
    const x = r() * SIZE;
    const len = 60 + r() * 380;
    const v = 70 + Math.floor(r() * 120);
    ctx.strokeStyle = grey(v, 0.28);
    ctx.lineWidth = 0.6 + r() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
    if (x + len > SIZE) {
      ctx.beginPath();
      ctx.moveTo(x - SIZE, y);
      ctx.lineTo(x + len - SIZE, y);
      ctx.stroke();
    }
  }
}

/** Fleck paint: transparent tile, alpha = flecks (white / black / grey). */
function fleck(ctx) {
  const r = rng(21);
  const dots = Array.from({ length: 1400 }, () => {
    const t = r();
    return {
      x: r() * SIZE,
      y: r() * SIZE,
      rad: 1.4 + r() * 2.6,
      c: t < 0.5 ? '#f1efe9' : t < 0.85 ? '#101010' : '#8a8a8a',
    };
  });
  wrapped(ctx, () => {
    for (const d of dots) {
      ctx.fillStyle = d.c;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Diamond knurl tread: two sets of diagonal grooves. */
function diamondKnurl(ctx) {
  ctx.fillStyle = grey(150);
  ctx.fillRect(0, 0, SIZE, SIZE);
  const step = SIZE / 12;
  ctx.strokeStyle = grey(40);
  ctx.lineWidth = 7;
  wrapped(ctx, () => {
    for (let k = -SIZE; k <= SIZE * 2; k += step) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k + SIZE, SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(k, SIZE);
      ctx.lineTo(k + SIZE, 0);
      ctx.stroke();
    }
  });
}

/** File tread: dense, slightly jittered raised studs. */
function fileTread(ctx) {
  const r = rng(5);
  ctx.fillStyle = grey(70);
  ctx.fillRect(0, 0, SIZE, SIZE);
  const n = 24;
  const s = SIZE / n;
  const studs = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      studs.push({ x: (i + 0.5 + (j % 2) * 0.5) * s + (r() - 0.5) * 3, y: (j + 0.5) * s + (r() - 0.5) * 3 });
    }
  }
  wrapped(ctx, () => {
    for (const p of studs) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 0.42);
      g.addColorStop(0, grey(210));
      g.addColorStop(1, grey(70));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, s * 0.42, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Micro-grain rubber: layered value noise. */
function microGrain(ctx) {
  const img = ctx.createImageData(SIZE, SIZE);
  const r = rng(9);
  const cells = 64;
  const lattice = Array.from({ length: cells * cells }, () => r());
  const at = (x, y) => lattice[((y + cells) % cells) * cells + ((x + cells) % cells)];
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fx = (x / SIZE) * cells;
      const fy = (y / SIZE) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = smooth(fx - x0);
      const ty = smooth(fy - y0);
      const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
      const bot = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
      const v = 60 + (top * (1 - ty) + bot * ty) * 140 + (r() - 0.5) * 30;
      const o = (y * SIZE + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = Math.max(0, Math.min(255, v));
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export const PATTERNS = { carbonTwill, forgedCarbon, brushed, fleck, diamondKnurl, fileTread, microGrain };

const canvasCache = new Map();

/** Returns the (cached) canvas for a pattern id. */
export function getPatternCanvas(id) {
  if (!canvasCache.has(id)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    PATTERNS[id](canvas.getContext('2d'));
    canvasCache.set(id, canvas);
  }
  return canvasCache.get(id);
}

const thumbCache = new Map();

/** Small data-URL preview for UI swatches. */
export function getPatternThumbnail(id, background = '#6d7078') {
  const key = `${id}|${background}`;
  if (!thumbCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const ctx = c.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 96, 96);
    ctx.drawImage(getPatternCanvas(id), 0, 0, 256, 256, 0, 0, 96, 96);
    thumbCache.set(key, c.toDataURL('image/png'));
  }
  return thumbCache.get(key);
}
