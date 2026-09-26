/**
 * Converts the raw Sketchfab exports in /assets-src into web-ready GLBs in /public/models.
 *
 *  - racing_bicycle.glb requires KHR_materials_pbrSpecularGlossiness, which three.js
 *    no longer supports (removed in r147) — it is converted to metal/rough here.
 *  - weld + simplify: the city bike ships 656k triangles / 796k unwelded vertices; simplification
 *    is bounded by a small geometric error so the silhouette and tread stay intact.
 *  - textures re-encoded as WebP (EXT_texture_webp), max 1024 px.
 *  - duplicate textures/accessors merged, unused data pruned,
 *    geometry compressed with EXT_meshopt_compression (decoded in workers by BikeModel).
 *
 * Node / mesh / material NAMES are preserved — src/config/bikeParts.js depends on them.
 */
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, metalRough, meshopt, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'node:fs';

/** simplify: `ratio` is the target triangle fraction, `error` the max deviation (fraction of mesh size). */
const MODELS = [
  { src: 'assets-src/bicycle_m..glb', out: 'public/models/city-bicycle.glb', simplify: { ratio: 0.3, error: 0.0015 } },
  { src: 'assets-src/racing_bicycle.glb', out: 'public/models/racing-bicycle.glb', specGloss: true, simplify: { ratio: 0.6, error: 0.0005 } },
  { src: 'assets-src/bmx.glb', out: 'public/models/bmx.glb' },
];

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

for (const m of MODELS) {
  const doc = await io.read(m.src);
  const before = triangles(doc);
  const transforms = [];
  if (m.specGloss) transforms.push(metalRough());
  transforms.push(dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }));
  transforms.push(weld());
  if (m.simplify) transforms.push(simplify({ simplifier: MeshoptSimplifier, ...m.simplify }));
  transforms.push(
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88, resize: [1024, 1024] }),
    prune({ keepAttributes: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await doc.transform(...transforms);
  await io.write(m.out, doc);
  const mb = (p) => (statSync(p).size / 1e6).toFixed(1) + ' MB';
  console.log(
    `${m.src} (${mb(m.src)}, ${Math.round(before / 1000)}k tris) -> ${m.out} (${mb(m.out)}, ${Math.round(triangles(doc) / 1000)}k tris)`,
  );
}
