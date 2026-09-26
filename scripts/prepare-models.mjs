/**
 * Converts the raw Sketchfab exports in /assets-src into web-ready GLBs in /public/models.
 *
 *  - racing_bicycle.glb requires KHR_materials_pbrSpecularGlossiness, which three.js
 *    no longer supports (removed in r147) — it is converted to metal/rough here.
 *  - All models: duplicate textures/accessors merged, unused data pruned,
 *    geometry compressed with EXT_meshopt_compression (decoded by drei's useGLTF).
 *
 * Node / mesh / material NAMES are preserved — src/config/bikes.js depends on them.
 */
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, metalRough, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { statSync } from 'node:fs';

const MODELS = [
  { src: 'assets-src/bicycle_m..glb', out: 'public/models/city-bicycle.glb' },
  { src: 'assets-src/racing_bicycle.glb', out: 'public/models/racing-bicycle.glb', specGloss: true },
  { src: 'assets-src/bmx.glb', out: 'public/models/bmx.glb' },
];

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

for (const m of MODELS) {
  const doc = await io.read(m.src);
  const transforms = [];
  if (m.specGloss) transforms.push(metalRough());
  transforms.push(dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }), prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await doc.transform(...transforms);
  await io.write(m.out, doc);
  const mb = (p) => (statSync(p).size / 1e6).toFixed(1) + ' MB';
  console.log(`${m.src} (${mb(m.src)}) -> ${m.out} (${mb(m.out)})`);
}
