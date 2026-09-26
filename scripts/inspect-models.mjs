/** Prints the node → mesh → material hierarchy of every GLB in public/models. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { readdirSync } from 'node:fs';

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const file of readdirSync('public/models').filter((f) => f.endsWith('.glb'))) {
  const doc = await io.read(`public/models/${file}`);
  const root = doc.getRoot();
  console.log(`\n=== ${file}`);
  console.log('materials:', root.listMaterials().map((m) => m.getName()).join(', '));
  console.log('textures:', root.listTextures().length, 'animations:', root.listAnimations().length);
  const walk = (node, depth) => {
    const mesh = node.getMesh();
    const mats = mesh ? mesh.listPrimitives().map((p) => p.getMaterial()?.getName()).join(',') : '';
    console.log(`${'  '.repeat(depth)}${node.getName()}${mesh ? `  [${mats}]` : ''}`);
    node.listChildren().forEach((c) => walk(c, depth + 1));
  };
  root.getDefaultScene().listChildren().forEach((n) => walk(n, 0));
}
