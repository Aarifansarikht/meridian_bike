/**
 * Material utilities: clone a GLB material into an independently configurable
 * MeshPhysicalMaterial, then apply colour / finish / texture changes to it.
 * The original GLB material is never mutated (it lives in the useGLTF cache).
 */
import { Color, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { FINISHES, FACTORY } from '../config/configurationOptions.js';
import { installSurfaceShader, hexToLinear, prepareColorTexture } from './textures.js';

/** Per-material runtime data. Kept out of userData, which Material.clone() JSON-serialises. */
const meta = new WeakMap();

function toPhysical(source) {
  if (source.isMeshPhysicalMaterial) return source.clone();
  const phys = new MeshPhysicalMaterial();
  if (source.isMeshStandardMaterial) {
    MeshStandardMaterial.prototype.copy.call(phys, source);
    phys.defines = { STANDARD: '', PHYSICAL: '' };
  } else {
    // Unlit / legacy materials: keep colour and map only.
    if (source.color) phys.color.copy(source.color);
    phys.map = source.map ?? null;
  }
  return phys;
}

/**
 * @param {import('three').Material} source  material from the GLB
 * @param {object} partDef                    entry from config/bikeParts.js
 * @param {{ pattern?: boolean }} [opts]      pattern: part exposes a surface-texture option
 */
export function createConfigurableMaterial(source, partDef, { pattern = false } = {}) {
  const material = toPhysical(source);
  material.name = `${source.name} (configurable)`;
  material.userData.sourceMaterialName = source.name;
  const factory = {
    color: source.color?.clone(),
    map: material.map,
    roughness: material.roughness,
    metalness: material.metalness,
    roughnessMap: material.roughnessMap,
    metalnessMap: material.metalnessMap,
    clearcoat: material.clearcoat,
    clearcoatRoughness: material.clearcoatRoughness,
  };
  const channels = partDef.channels ? Object.entries(partDef.channels) : [['*', {}]];
  const surface = installSurfaceShader(material, {
    channels,
    pattern,
    maskChannel: partDef.primary ?? null,
  });
  meta.set(material, {
    factory,
    primaryChannel: partDef.primary ?? '*',
    surface,
    recolor: surface.channels ? surface : null,
  });
  return material;
}

/**
 * Applies colours to one material.
 * @param {Record<string,string>} colors   channelId -> '#hex' (absent = factory)
 * @param {Record<string,string>} links    channelId -> channelId it should mirror
 */
export function applyColor(material, colors = {}, links = {}) {
  const { recolor, factory, primaryChannel } = meta.get(material);
  if (recolor) {
    for (const id of Object.keys(recolor.channels)) {
      const linkedTo = links[id];
      recolor.setChannelMasked(id, Boolean(linkedTo) && linkedTo === primaryChannel);
      if (linkedTo) {
        const hex = colors[linkedTo];
        recolor.setChannel(id, hex ? hexToLinear(hex) : recolor.channels[linkedTo]?.factory ?? null);
      } else {
        recolor.setChannel(id, colors[id] ? hexToLinear(colors[id]) : null);
      }
    }
    return;
  }
  const hex = colors[primaryChannel] ?? colors['*'];
  if (hex) material.color.set(hex);
  else if (factory.color) material.color.copy(factory.color);
}

export function applyFinish(material, finishKey = FACTORY) {
  const f = meta.get(material).factory;
  const preset = FINISHES[finishKey];
  const hadMaps = Boolean(material.roughnessMap || material.metalnessMap);
  if (!preset || finishKey === FACTORY) {
    Object.assign(material, {
      roughness: f.roughness,
      metalness: f.metalness,
      roughnessMap: f.roughnessMap,
      metalnessMap: f.metalnessMap,
      clearcoat: f.clearcoat,
      clearcoatRoughness: f.clearcoatRoughness,
    });
  } else {
    Object.assign(material, {
      roughness: preset.roughness,
      metalness: preset.metalness,
      roughnessMap: null,
      metalnessMap: null,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness,
    });
  }
  // Toggling maps (or clearcoat on/off) changes shader defines → recompile once.
  if (hadMaps !== Boolean(material.roughnessMap || material.metalnessMap)) material.needsUpdate = true;
}

/** Applies a surface-texture preset from TEXTURES (FACTORY clears it). */
export function applyPattern(material, key = FACTORY) {
  meta.get(material).surface.setPattern(key === FACTORY ? null : key);
}

/** Replaces the base-colour texture (pass null to restore the factory texture). */
export function applyTexture(material, texture) {
  const next = texture ? prepareColorTexture(texture) : meta.get(material).factory.map;
  if (material.map === next) return;
  material.map = next;
  material.needsUpdate = true;
}

/** Debug/inspection data for a configurable material (factory colours per channel). */
export function describeMaterial(material) {
  const { recolor, factory } = meta.get(material) ?? {};
  const toHex = (rgb) => new Color().setRGB(...rgb).getHexString();
  return {
    source: material.userData.sourceMaterialName,
    textured: Boolean(material.map),
    factoryColor: factory?.color ? factory.color.getHexString() : null,
    channels: recolor
      ? Object.fromEntries(Object.entries(recolor.channels).map(([id, c]) => [id, { factory: toHex(c.factory), coverage: +c.coverage.toFixed(3) }]))
      : null,
  };
}

export function disposeMaterial(material) {
  // Frees GPU programs only. Factory textures belong to the cached GLTF and are shared.
  // Metadata is kept (WeakMap): a disposed material is re-uploaded if rendered again (StrictMode remount).
  material.dispose();
}
