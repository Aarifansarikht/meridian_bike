/**
 * Imperative, part-level API over a loaded bicycle scene.
 *
 *   const bike = createBikeController(scene, BIKES.metro);
 *   bike.updatePartColor('frame', '#ff0000');            // primary channel
 *   bike.updatePartColor('frame', '#ffffff', 'decal');   // a texture channel
 *   bike.updatePartMaterial('handlebar', 'polished');
 *   bike.updatePartVisibility('kickstand', false);
 *   bike.updatePartTexture('saddle', someTexture);
 *   bike.resetBike();
 *
 * React components never touch meshes directly; they dispatch Redux actions and BikeModel
 * forwards resolved part states to `applyPartStates`, which only touches parts that changed.
 */
import { Box3 } from 'three';
import { getBikeParts } from './meshUtils.js';
import { createConfigurableMaterial, applyColor, applyFinish, applyPattern, applyTexture, disposeMaterial, describeMaterial } from './materials.js';
import { FACTORY } from '../config/configurationOptions.js';
import { getBikeOptions } from '../config/bikes.js';

export const emptyPartState = () => ({ visible: true, finish: FACTORY, texture: FACTORY, colors: {}, links: {} });
const signature = (s) => JSON.stringify(s);

export function createBikeController(root, bike) {
  const { parts, missing } = getBikeParts(root, bike.parts);
  const runtime = {}; // partId -> { meshes, materials: Set, state, sig }
  // Only parts with a texture option get the (slightly heavier) pattern shader stage.
  const patternParts = new Set(getBikeOptions(bike).filter((o) => o.type === 'texture').map((o) => o.part));

  for (const part of Object.values(parts)) {
    const clones = new Map(); // source material -> configurable clone (per part)
    for (const mesh of part.meshes) {
      const source = mesh.material;
      if (!clones.has(source)) {
        clones.set(source, createConfigurableMaterial(source, part.def, { pattern: patternParts.has(part.id) }));
      }
      mesh.material = clones.get(source);
      mesh.castShadow = true;
    }
    const state = emptyPartState();
    runtime[part.id] = { meshes: part.meshes, materials: new Set(clones.values()), state, sig: signature(state) };
  }

  const applyState = (id) => {
    const r = runtime[id];
    if (!r) return;
    const { state } = r;
    for (const mesh of r.meshes) mesh.visible = state.visible;
    for (const material of r.materials) {
      applyColor(material, state.colors, state.links);
      applyFinish(material, state.finish);
      applyPattern(material, state.texture);
    }
    r.sig = signature(state);
  };

  const withPart = (id, fn) => {
    const r = runtime[id];
    if (!r) {
      console.warn(`[bike] unknown or missing part "${id}"`);
      return false;
    }
    fn(r.state);
    applyState(id);
    return true;
  };

  return {
    missingParts: missing,
    partIds: Object.keys(runtime),

    /** Applies a full `{ partId: partState }` map, touching only parts whose state changed. */
    applyPartStates(states) {
      const changed = [];
      for (const id of Object.keys(runtime)) {
        const next = states[id] ?? emptyPartState();
        if (signature(next) === runtime[id].sig) continue;
        runtime[id].state = structuredClone(next);
        applyState(id);
        changed.push(id);
      }
      return changed;
    },

    updatePartColor(id, hex, channel) {
      return withPart(id, (s) => {
        const key = channel ?? bike.parts[id]?.primary ?? '*';
        if (!hex || hex === FACTORY) delete s.colors[key];
        else s.colors[key] = hex;
      });
    },
    /** Surface texture preset from TEXTURES, e.g. updatePartSurface('frame', 'carbonTwill'). */
    updatePartSurface(id, textureKey) {
      return withPart(id, (s) => (s.texture = textureKey || FACTORY));
    },
    updatePartMaterial(id, finishKey) {
      return withPart(id, (s) => (s.finish = finishKey || FACTORY));
    },
    updatePartVisibility(id, visible) {
      return withPart(id, (s) => (s.visible = visible));
    },
    /** Swaps the base-colour texture of every material in the part (null restores factory). */
    updatePartTexture(id, texture) {
      const r = runtime[id];
      if (!r) return false;
      r.materials.forEach((m) => applyTexture(m, texture));
      return true;
    },

    resetBike() {
      for (const id of Object.keys(runtime)) {
        runtime[id].state = emptyPartState();
        runtime[id].materials.forEach((m) => applyTexture(m, null));
        applyState(id);
      }
    },

    /** World-space bounds of a part's visible meshes (or null). */
    getPartBounds(id) {
      const r = runtime[id];
      if (!r) return null;
      const box = new Box3();
      r.meshes.forEach((m) => m.visible && box.expandByObject(m));
      return box.isEmpty() ? null : box;
    },

    /** Inspection helper: meshes, materials and factory colours per part (try window.__bike in dev). */
    describeParts() {
      return Object.fromEntries(
        Object.entries(runtime).map(([id, r]) => [
          id,
          { meshes: r.meshes.map((m) => m.name), materials: [...r.materials].map(describeMaterial), state: r.state },
        ]),
      );
    },

    dispose() {
      for (const r of Object.values(runtime)) r.materials.forEach(disposeMaterial);
    },
  };
}
