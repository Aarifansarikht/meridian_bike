import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

const PRODUCT_LENGTH = 1.8; // every model is scaled to this size so the camera framing always fits

/**
 * Loads a GLB model and applies the selected colours to its materials.
 */
export default function ProductModel({ product, colors }) {
  const { scene } = useGLTF(product.model); // loaded once, then cached
  const invalidate = useThree((state) => state.invalidate);

  // 1. FRAMING — scale the model to a fixed size, centre it, and stand it on the ground (y = 0).
  //    Computed once per model.
  const fit = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = PRODUCT_LENGTH / Math.max(size.x, size.z);
    return {
      scale,
      position: [-center.x * scale, -box.min.y * scale, -center.z * scale],
      rotationY: size.z > size.x ? Math.PI / 2 : 0, // turn the bike so it always faces the same way
    };
  }, [scene]);

  // 2. FIND THE MATERIALS for each configurable part (by the material names listed in config.js).
  const partMaterials = useMemo(() => {
    const result = {};
    for (const partId of Object.keys(product.parts)) result[partId] = new Set();

    scene.traverse((object) => {
      if (!object.isMesh) return;
      for (const [partId, materialNames] of Object.entries(product.parts)) {
        if (materialNames.includes(object.material.name)) result[partId].add(object.material);
      }
    });
    return result;
  }, [scene, product]);

  // 3. APPLY THE COLOURS — runs whenever a colour changes.
  //    Only `material.color` is updated: the model itself is NOT reloaded.
  useEffect(() => {
    for (const [partId, materials] of Object.entries(partMaterials)) {
      for (const material of materials) {
        if (material.map) {
          // Some parts have a painted texture; remove it once so the solid colour shows through.
          material.map = null;
          material.needsUpdate = true;
        }
        material.color.set(colors[partId]);
      }
    }
    invalidate(); // ask for a new frame (we only render on demand)
  }, [partMaterials, colors, invalidate]);

  return (
    <group rotation-y={fit.rotationY}>
      <group scale={fit.scale} position={fit.position}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
