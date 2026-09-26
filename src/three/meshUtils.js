/** Scene-graph lookup helpers. All mesh traversal in the app goes through this module. */

const matches = (value, pattern) => (pattern instanceof RegExp ? pattern.test(value) : value === pattern);

const materialsOf = (mesh) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);

export function findMeshByName(root, name) {
  let found = null;
  root.traverse((o) => {
    if (!found && o.isMesh && o.name === name) found = o;
  });
  return found;
}

export function findMeshesByPattern(root, pattern) {
  const out = [];
  root.traverse((o) => {
    if (o.isMesh && matches(o.name, pattern)) out.push(o);
  });
  return out;
}

/** Meshes whose (original glTF) material name matches any of `names` (strings or RegExps). */
export function findMeshesByMaterial(root, names) {
  const out = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const hit = materialsOf(o).some((m) => {
      const name = m.userData.sourceMaterialName ?? m.name;
      return names.some((n) => matches(name, n));
    });
    if (hit) out.push(o);
  });
  return out;
}

/**
 * Resolves the declarative part map (config/bikeParts.js) into live meshes.
 * Missing parts are reported rather than thrown, so an optional mesh can never crash the app.
 * @returns {{ parts: Record<string, {id, def, meshes}>, missing: string[] }}
 */
export function getBikeParts(root, partDefs) {
  const parts = {};
  const missing = [];
  for (const [id, def] of Object.entries(partDefs)) {
    const set = new Set([
      ...(def.materials ? findMeshesByMaterial(root, def.materials) : []),
      ...(def.nodes ?? []).flatMap((n) => findMeshesByPattern(root, n)),
    ]);
    const meshes = [...set];
    if (meshes.length === 0) {
      missing.push(id);
      console.warn(`[bike] part "${id}" matched no meshes — its options will be hidden.`);
    }
    parts[id] = { id, def, meshes };
  }
  return { parts, missing };
}

/** Lists every mesh with its material — handy when mapping a new GLB. */
export function describeScene(root) {
  const rows = [];
  root.traverse((o) => {
    if (o.isMesh) rows.push({ mesh: o.name, material: materialsOf(o).map((m) => m.name).join(', ') });
  });
  return rows;
}
