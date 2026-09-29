/**
 * Downscales the Radiance .hdr environments in assets-src/hdr to 1K for the web (public/hdr).
 *
 * The HDR is only used for image-based lighting: three.js prefilters it into a PMREM whose
 * largest face is 256 px, so a 2K (2048×1024) source costs 4× the download and parse time for
 * no visible difference. A 2×2 box filter in linear float space keeps total energy intact.
 *
 * Background photos (*.jpg, e.g. Poly Haven "tonemapped JPG") are resized to 4K. They are shown
 * behind the product, where resolution matters, while the small HDR only provides the lighting.
 *
 *   npm run prepare-hdr
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'assets-src/hdr';
const OUT = 'public/hdr';

function readRGBE(buf) {
  let pos = 0;
  const line = () => {
    let s = '';
    while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++]);
    pos++;
    return s;
  };
  const header = [];
  for (let l = line(); l !== ''; l = line()) header.push(l);
  const [, h, , w] = line().split(' ');
  const width = +w;
  const height = +h;
  const data = new Float32Array(width * height * 3);
  const scan = new Uint8Array(width * 4);
  for (let y = 0; y < height; y++) {
    if (buf[pos] === 2 && buf[pos + 1] === 2 && !(buf[pos + 2] & 0x80)) {
      pos += 4; // new-style RLE, one channel at a time
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < width) {
          let count = buf[pos++];
          if (count > 128) {
            count -= 128;
            const v = buf[pos++];
            while (count--) scan[(x++) * 4 + c] = v;
          } else {
            while (count--) scan[(x++) * 4 + c] = buf[pos++];
          }
        }
      }
    } else {
      scan.set(buf.subarray(pos, pos + width * 4));
      pos += width * 4;
    }
    for (let x = 0; x < width; x++) {
      const e = scan[x * 4 + 3];
      const f = e ? Math.pow(2, e - 136) : 0; // (mantissa / 256) * 2^(e-128)
      const o = (y * width + x) * 3;
      data[o] = scan[x * 4] * f;
      data[o + 1] = scan[x * 4 + 1] * f;
      data[o + 2] = scan[x * 4 + 2] * f;
    }
  }
  return { width, height, data, header };
}

function downsample({ width, height, data }) {
  const w = width >> 1;
  const h = height >> 1;
  const out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        const i = (a, b) => ((2 * y + b) * width + (2 * x + a)) * 3 + c;
        out[(y * w + x) * 3 + c] = (data[i(0, 0)] + data[i(1, 0)] + data[i(0, 1)] + data[i(1, 1)]) / 4;
      }
    }
  }
  return { width: w, height: h, data: out };
}

function toRGBE(r, g, b) {
  const v = Math.max(r, g, b);
  if (v < 1e-32) return [0, 0, 0, 0];
  const e = Math.ceil(Math.log2(v) + 1e-9);
  const scale = 256 / Math.pow(2, e);
  return [Math.min(255, r * scale) | 0, Math.min(255, g * scale) | 0, Math.min(255, b * scale) | 0, e + 128];
}

/** Encodes one channel of a scanline with Radiance new-style RLE. */
function rleChannel(bytes, out) {
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && run < 127 && bytes[i + run] === bytes[i]) run++;
    if (run >= 4) {
      out.push(128 + run, bytes[i]);
      i += run;
      continue;
    }
    let start = i;
    let len = 0;
    while (i < bytes.length && len < 128) {
      let r = 1;
      while (i + r < bytes.length && r < 4 && bytes[i + r] === bytes[i]) r++;
      if (r >= 4) break;
      i++;
      len++;
    }
    out.push(len, ...bytes.subarray(start, start + len));
  }
}

function writeRGBE({ width, height, data }) {
  const out = [...Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`, 'ascii')];
  const ch = [0, 1, 2, 3].map(() => new Uint8Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const px = toRGBE(data[o], data[o + 1], data[o + 2]);
      for (let c = 0; c < 4; c++) ch[c][x] = px[c];
    }
    out.push(2, 2, width >> 8, width & 0xff);
    for (let c = 0; c < 4; c++) rleChannel(ch[c], out);
  }
  return Buffer.from(out);
}

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.hdr'))) {
  let img = readRGBE(readFileSync(`${SRC}/${file}`));
  while (img.width > 1024) img = downsample(img);
  const name = file.replace(/_\dk\.hdr$/, '').replace(/\.hdr$/, '') + '_1k.hdr';
  writeFileSync(`${OUT}/${name}`, writeRGBE(img));
  const mb = (p) => (statSync(p).size / 1e6).toFixed(2) + ' MB';
  console.log(`${SRC}/${file} (${mb(`${SRC}/${file}`)}) -> ${OUT}/${name} (${img.width}×${img.height}, ${mb(`${OUT}/${name}`)})`);
}

// Background photos: 4096×2048 JPEG is sharp on screen and ~1–2 MB.
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.jpg'))) {
  const src = `${SRC}/${file}`;
  const out = `${OUT}/${file}`;
  await sharp(src).resize(4096, 2048).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  const mb = (p) => (statSync(p).size / 1e6).toFixed(2) + ' MB';
  console.log(`${src} (${mb(src)}) -> ${out} (4096×2048, ${mb(out)})`);
}
