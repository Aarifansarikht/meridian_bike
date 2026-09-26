/**
 * Shared GPU textures for the surface presets in config/configurationOptions.js (TEXTURES).
 * Each texture is created once and shared by every material that uses it.
 */
import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { TEXTURES } from '../config/configurationOptions.js';
import { getPatternCanvas } from './patterns.js';

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function configure(texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Average linear luminance of opaque texels — used to normalise `multiply` modulation. */
function averageLuminance(source) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, 64, 64);
  const px = ctx.getImageData(0, 0, 64, 64).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    sum += 0.2126 * srgbToLinear(px[i] / 255) + 0.7152 * srgbToLinear(px[i + 1] / 255) + 0.0722 * srgbToLinear(px[i + 2] / 255);
    n++;
  }
  return n ? Math.max(sum / n, 0.02) : 0.2;
}

/** 1×1 placeholder bound when no pattern is active (a sampler uniform always needs a texture). */
export const EMPTY_TEXTURE = (() => {
  const t = new DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
})();

const cache = new Map();

/** @returns {{ texture: import('three').Texture, refLum: number, preset: object } | null} */
export function getSurfaceTexture(key) {
  const preset = TEXTURES[key];
  if (!preset || (!preset.pattern && !preset.url)) return null;
  if (cache.has(key)) return cache.get(key);

  let entry;
  if (preset.url) {
    // Photographed / authored textures: drop a tileable image in /public and reference it.
    entry = { texture: null, refLum: 0.2, preset };
    entry.texture = configure(
      new TextureLoader().load(preset.url, (t) => {
        entry.refLum = averageLuminance(t.image);
      }),
    );
  } else {
    const canvas = getPatternCanvas(preset.pattern);
    entry = { texture: configure(new CanvasTexture(canvas)), refLum: averageLuminance(canvas), preset };
  }
  cache.set(key, entry);
  return entry;
}
