/**
 * Optimises the original models in /assets-src into small web-ready files in /public/models.
 *
 *   npm run prepare-models
 *
 * Steps: merge duplicate data → weld vertices → reduce triangles (within a tiny error bound)
 * → convert textures to WebP → compress geometry (meshopt, decoded automatically by useGLTF).
 * Material names are kept, because src/config.js finds the parts by material name.
 */
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, meshopt, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'node:fs';

const MODELS = [
  { src: 'assets-src/bmx.glb', out: 'public/models/bmx.glb' },
  // The city bike ships with 656k triangles, so it is simplified.
  { src: 'assets-src/bicycle_m..glb', out: 'public/models/city-bicycle.glb', simplify: { ratio: 0.3, error: 0.0015 } },
];

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

for (const m of MODELS) {
  const doc = await io.read(m.src);
  await doc.transform(
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    weld(),
    ...(m.simplify ? [simplify({ simplifier: MeshoptSimplifier, ...m.simplify })] : []),
    textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 88, resize: [1024, 1024] }),
    prune({ keepAttributes: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await io.write(m.out, doc);
  const mb = (p) => (statSync(p).size / 1e6).toFixed(1) + ' MB';
  console.log(`${m.src} (${mb(m.src)}) -> ${m.out} (${mb(m.out)})`);
}
