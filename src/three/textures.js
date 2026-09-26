/**
 * Texture utilities.
 *
 * Surface patterns (carbon, brushed alloy, tread...) are projected triplanar in WORLD space by the same
 * shader stage, because the supplied models' UV layouts are atlases / non-uniform and would
 * scramble a UV-mapped pattern. See installSurfaceShader().
 *
 * Region recolouring: several of the supplied GLBs bake paint + decals into one base-colour
 * texture (the racing bike is a single atlas). To recolour a region without destroying the
 * decals and baked shading we inject a small shader stage after three.js' `map_fragment`:
 * every texel is keyed by HSL range (per "channel"), and matched texels are replaced by the
 * target colour, modulated by the texel's luminance relative to the region average so baked
 * shading and wear survive. Colour changes are uniform updates — no texture regeneration,
 * no shader recompilation, no GPU memory churn.
 */
import { Color, SRGBColorSpace, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter } from 'three';
import { EMPTY_TEXTURE, getSurfaceTexture } from './textureLibrary.js';

const DEFAULT_DETAIL = 0.8; // how much of the texture's own luminance variation survives recolouring
const HUE_SOFT = 10 / 360;
const SAT_SOFT = 0.06;
const LUM_SOFT = 0.05;

/* ---------- shared keying maths (mirrored in GLSL below) ---------- */

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

const smooth = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};
const softRange = (v, a, b, e) => (a <= 0 ? 1 : smooth(a - e, a + e, v)) * (b >= 1 ? 1 : 1 - smooth(b - e, b + e, v));
const hueDist = (a, b) => {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
};
function hueWeight(h, h0, h1) {
  const inside = h0 <= h1 ? h >= h0 && h <= h1 : h >= h0 || h <= h1;
  if (inside) return 1;
  return 1 - smooth(0, HUE_SOFT, Math.min(hueDist(h, h0), hueDist(h, h1)));
}

/** Normalised numeric key for a channel definition (see config/bikeParts.js). */
export function normaliseKey(def = {}) {
  return {
    hasHue: Array.isArray(def.hue),
    h0: def.hue ? def.hue[0] / 360 : 0,
    h1: def.hue ? def.hue[1] / 360 : 1,
    s0: def.sat?.[0] ?? 0,
    s1: def.sat?.[1] ?? 1,
    l0: def.lum?.[0] ?? 0,
    l1: def.lum?.[1] ?? 1,
  };
}

function keyWeight(k, h, s, l) {
  const wh = k.hasHue ? hueWeight(h, k.h0, k.h1) : 1;
  return wh * softRange(s, k.s0, k.s1, SAT_SOFT) * softRange(l, k.l0, k.l1, LUM_SOFT);
}

/* ---------- CPU analysis ---------- */

const analysisCache = new WeakMap(); // image -> Map(keySignature -> result)

/**
 * Samples a downscaled copy of the texture and returns, for a channel key, the average linear
 * luminance and average linear colour of matching texels (used as the recolour reference and
 * as the "factory" colour when one channel mirrors another).
 */
export function analyseTextureChannel(texture, key) {
  const image = texture?.image;
  if (!image || !image.width) return { refLum: 0.2, factory: [0.2, 0.2, 0.2], coverage: 0 };
  const sig = JSON.stringify(key);
  let perImage = analysisCache.get(image);
  if (!perImage) analysisCache.set(image, (perImage = new Map()));
  if (perImage.has(sig)) return perImage.get(sig);

  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let result = { refLum: 0.2, factory: [0.2, 0.2, 0.2], coverage: 0 };
  try {
    ctx.drawImage(image, 0, 0, size, size);
    const px = ctx.getImageData(0, 0, size, size).data;
    let wSum = 0, lumSum = 0, rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const [h, s, l] = rgbToHsl(r, g, b);
      const w = keyWeight(key, h, s, l);
      if (w <= 0.001) continue;
      const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
      wSum += w;
      lumSum += w * (0.2126 * lr + 0.7152 * lg + 0.0722 * lb);
      rSum += w * lr; gSum += w * lg; bSum += w * lb;
    }
    if (wSum > 0) {
      result = {
        refLum: Math.max(lumSum / wSum, 1e-3),
        factory: [rSum / wSum, gSum / wSum, bSum / wSum],
        coverage: wSum / (size * size),
      };
    }
  } catch (err) {
    console.warn('[textures] could not analyse texture', err);
  }
  perImage.set(sig, result);
  return result;
}

/* ---------- shader injection ---------- */

const GLSL_RECOLOR_HELPERS = /* glsl */ `
#ifdef RC_COUNT
uniform vec4 rcHue[RC_COUNT];     // h0, h1, hasHue, unused
uniform vec4 rcSatLum[RC_COUNT];  // s0, s1, l0, l1
uniform vec4 rcTarget[RC_COUNT];  // linear rgb, active
uniform float rcRefLum[RC_COUNT];
uniform float rcDetail[RC_COUNT];
uniform float rcMaskAdd[RC_COUNT]; // 1 = channel is painted like the primary (e.g. "clean" graphics)

vec3 rcRgbToHsl(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float l = (mx + mn) * 0.5;
  if (mx - mn < 1e-5) return vec3(0.0, 0.0, l);
  float d = mx - mn;
  float s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
  float h;
  if (mx == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  return vec3(h / 6.0, s, l);
}
float rcSoftRange(float v, float a, float b, float e) {
  float lo = a <= 0.0 ? 1.0 : smoothstep(a - e, a + e, v);
  float hi = b >= 1.0 ? 1.0 : 1.0 - smoothstep(b - e, b + e, v);
  return lo * hi;
}
float rcHueDist(float a, float b) { float d = abs(a - b); return min(d, 1.0 - d); }
float rcHueWeight(float h, float h0, float h1) {
  bool inside = h0 <= h1 ? (h >= h0 && h <= h1) : (h >= h0 || h <= h1);
  if (inside) return 1.0;
  return 1.0 - smoothstep(0.0, ${HUE_SOFT.toFixed(5)}, min(rcHueDist(h, h0), rcHueDist(h, h1)));
}
vec3 rcLinearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
#endif
`;

const GLSL_PATTERN_HELPERS = /* glsl */ `
#ifdef PAT
varying vec3 vPatPos;
varying vec3 vPatNormal;
uniform sampler2D patMap;
uniform vec4 patParams;   // active, density (1/tile m), replace, multiply
uniform vec4 patMR;       // metal, metalAmount, rough, roughAmount
uniform float patBump;
uniform float patRefLum;

// Same construction as three's perturbNormalArb (bumpmap_pars_fragment), for a procedural height.
vec3 patPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = normalize(dFdx(surfPos));
  vec3 sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
#endif
`;

const GLSL_MAP_STAGE = /* glsl */ `
#include <map_fragment>
float surfMask = 1.0;
#ifdef RC_COUNT
float rcW[RC_COUNT];
{
  vec3 rcTex = sampledDiffuseColor.rgb;
  vec3 rcHsl = rcRgbToHsl(clamp(rcLinearToSrgb(rcTex), 0.0, 1.0));
  float rcLum = dot(rcTex, vec3(0.2126, 0.7152, 0.0722));
  vec3 rcOut = rcTex;
  for (int i = 0; i < RC_COUNT; i++) {
    float w = (rcHue[i].z > 0.5 ? rcHueWeight(rcHsl.x, rcHue[i].x, rcHue[i].y) : 1.0)
      * rcSoftRange(rcHsl.y, rcSatLum[i].x, rcSatLum[i].y, ${SAT_SOFT.toFixed(3)})
      * rcSoftRange(rcHsl.z, rcSatLum[i].z, rcSatLum[i].w, ${LUM_SOFT.toFixed(3)});
    rcW[i] = w;
    if (rcTarget[i].a < 0.5) continue;
    float ratio = mix(1.0, clamp(rcLum / max(rcRefLum[i], 1e-4), 0.0, 2.2), rcDetail[i]);
    rcOut = mix(rcOut, rcTarget[i].rgb * ratio, w);
  }
  diffuseColor.rgb = diffuse * rcOut;
}
#ifdef RC_MASK
// Patterns cover the paint region plus any channel currently painted like it; decals stay crisp.
surfMask = rcW[RC_MASK];
for (int i = 0; i < RC_COUNT; i++) surfMask += rcW[i] * rcMaskAdd[i];
surfMask = clamp(surfMask, 0.0, 1.0);
#endif
#endif
#ifdef PAT
float patH = 0.0;
if (patParams.x > 0.5) {
  vec3 pn = normalize(vPatNormal);
  vec3 bw = pow(abs(pn), vec3(4.0));
  bw /= (bw.x + bw.y + bw.z);
  vec3 pp = vPatPos * patParams.y;
  vec4 pt = texture2D(patMap, pp.zy) * bw.x + texture2D(patMap, pp.xz) * bw.y + texture2D(patMap, pp.xy) * bw.z;
  // Transparent texels upload as black; un-premultiply so filtered edges don't darken.
  if (pt.a > 0.002 && pt.a < 0.999) pt.rgb /= pt.a;
  float plum = dot(pt.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb = mix(diffuseColor.rgb, pt.rgb, clamp(pt.a * patParams.z * surfMask, 0.0, 1.0));
  diffuseColor.rgb *= mix(1.0, clamp(plum / patRefLum, 0.0, 2.5), patParams.w * surfMask);
  patH = pow(plum, 0.4545) * surfMask;
}
#endif
`;

const GLSL_ROUGHNESS_STAGE = /* glsl */ `
#include <roughnessmap_fragment>
#ifdef PAT
if (patParams.x > 0.5) roughnessFactor = mix(roughnessFactor, patMR.z, patMR.w * surfMask);
#endif
`;

const GLSL_METALNESS_STAGE = /* glsl */ `
#include <metalnessmap_fragment>
#ifdef PAT
if (patParams.x > 0.5) metalnessFactor = mix(metalnessFactor, patMR.x, patMR.y * surfMask);
#endif
`;

const GLSL_NORMAL_STAGE = /* glsl */ `
#include <normal_fragment_maps>
#ifdef PAT
if (patParams.x > 0.5 && patBump > 0.0) {
  normal = patPerturb(-vViewPosition, normal, vec2(dFdx(patH), dFdy(patH)) * patBump, faceDirection);
}
#endif
`;

/**
 * Installs the configurable surface stage on a material:
 *  - region recolour of the base-colour map (when `channels` is given and the material has a map)
 *  - a world-space triplanar surface pattern (when `pattern` is true)
 *
 * @param {import('three').MeshPhysicalMaterial} material
 * @param {{ channels?: Array<[string, object]>|null, pattern?: boolean, maskChannel?: string|null }} opts
 */
export function installSurfaceShader(material, { channels = null, pattern = false, maskChannel = null } = {}) {
  const recolor = Boolean(material.map && channels?.length);
  if (!recolor && !pattern) return { channels: null, setChannel() {}, setChannelMasked() {}, setPattern() {} };

  const uniforms = {};
  let info = null;
  let maskIndex = -1;

  if (recolor) {
    const keys = channels.map(([, def]) => normaliseKey(def));
    info = Object.fromEntries(
      channels.map(([id], i) => [id, { index: i, ...analyseTextureChannel(material.map, keys[i]) }]),
    );
    Object.assign(uniforms, {
      rcHue: { value: keys.map((k) => [k.h0, k.h1, k.hasHue ? 1 : 0, 0]).flat() },
      rcSatLum: { value: keys.map((k) => [k.s0, k.s1, k.l0, k.l1]).flat() },
      rcTarget: { value: new Array(channels.length * 4).fill(0) },
      rcRefLum: { value: channels.map(([id]) => info[id].refLum) },
      rcDetail: { value: channels.map(([, def]) => def.detail ?? DEFAULT_DETAIL) },
      rcMaskAdd: { value: new Array(channels.length).fill(0) },
    });
    if (maskChannel && info[maskChannel] && channels.length > 1) maskIndex = info[maskChannel].index;
  }
  if (pattern) {
    Object.assign(uniforms, {
      patMap: { value: EMPTY_TEXTURE },
      patParams: { value: [0, 1, 0, 0] },
      patMR: { value: [0, 0, 0, 0] },
      patBump: { value: 0 },
      patRefLum: { value: 0.2 },
    });
  }

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    const defines = { ...(shader.defines || {}) };
    if (recolor) defines.RC_COUNT = channels.length;
    if (maskIndex >= 0) defines.RC_MASK = maskIndex;
    if (pattern) defines.PAT = '';
    shader.defines = defines;

    if (pattern) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vPatPos;\nvarying vec3 vPatNormal;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvPatPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvPatNormal = normalize(mat3(modelMatrix) * objectNormal);',
        );
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_RECOLOR_HELPERS}\n${GLSL_PATTERN_HELPERS}`)
      .replace('#include <map_fragment>', GLSL_MAP_STAGE)
      .replace('#include <roughnessmap_fragment>', GLSL_ROUGHNESS_STAGE)
      .replace('#include <metalnessmap_fragment>', GLSL_METALNESS_STAGE)
      .replace('#include <normal_fragment_maps>', GLSL_NORMAL_STAGE);
  };
  material.customProgramCacheKey = () => `surface-${recolor ? channels.length : 0}-${pattern ? 1 : 0}-${maskIndex}`;

  return {
    channels: info,
    setChannel(id, rgbLinear) {
      const c = info?.[id];
      if (!c) return;
      const v = uniforms.rcTarget.value;
      const o = c.index * 4;
      if (rgbLinear) {
        v[o] = rgbLinear[0]; v[o + 1] = rgbLinear[1]; v[o + 2] = rgbLinear[2]; v[o + 3] = 1;
      } else {
        v[o + 3] = 0;
      }
    },
    /** Marks a channel as painted like the pattern mask channel, so surface textures cover it too. */
    setChannelMasked(id, masked) {
      const c = info?.[id];
      if (c) uniforms.rcMaskAdd.value[c.index] = masked ? 1 : 0;
    },
    /** Activates a TEXTURES preset (or clears it with null / 'factory'). */
    setPattern(key) {
      if (!pattern) return;
      const entry = getSurfaceTexture(key);
      if (!entry) {
        uniforms.patParams.value = [0, 1, 0, 0];
        uniforms.patMap.value = EMPTY_TEXTURE;
        return;
      }
      const p = entry.preset;
      uniforms.patMap.value = entry.texture;
      uniforms.patParams.value = [1, 1 / p.tile, p.replace ?? 0, p.multiply ?? 0];
      uniforms.patMR.value = [...(p.metal ?? [0, 0]), ...(p.rough ?? [0, 0])];
      uniforms.patBump.value = p.bump ?? 0;
      uniforms.patRefLum.value = entry.refLum;
    },
  };
}

/** Hex '#rrggbb' → linear RGB triple (respects three.js colour management). */
export const hexToLinear = (hex) => {
  const c = new Color(hex);
  return [c.r, c.g, c.b];
};

/**
 * Prepares an externally loaded texture for use as a glTF base-colour map:
 * sRGB colour space, glTF UV convention (no flip), repeat wrapping and trilinear/anisotropic filtering.
 */
export function prepareColorTexture(texture, anisotropy = 8) {
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}
