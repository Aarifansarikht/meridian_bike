import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { createBikeController } from '../../three/bikeController.js';
import { computeModelLayout } from '../../three/sceneUtils.js';

/**
 * Loads a bike GLB, normalises its placement and applies part states.
 * Receives already-resolved `partStates`; only parts whose state changed are touched.
 */
export default function BikeModel({ bike, partStates, onReady }) {
  const { scene } = useGLTF(bike.model);
  const invalidate = useThree((s) => s.invalidate);

  // Each mount works on its own clone so the cached GLTF (and its materials) stay pristine.
  const { model, controller, layout } = useMemo(() => {
    const model = scene.clone(true);
    return {
      model,
      layout: computeModelLayout(model, bike.orientation),
      controller: createBikeController(model, bike),
    };
  }, [scene, bike]);

  useEffect(() => {
    if (import.meta.env.DEV) window.__bike = controller; // dev console access: __bike.updatePartColor('frame', '#f00')
    return () => controller.dispose();
  }, [controller]);

  useLayoutEffect(() => {
    if (partStates) controller.applyPartStates(partStates);
    invalidate();
  }, [controller, partStates, invalidate]);

  useEffect(() => {
    onReady?.({ controller, bounds: layout.bounds, missingParts: controller.missingParts });
  }, [controller, layout, onReady]);

  return (
    <group position={layout.position} scale={layout.scale}>
      <group rotation-y={layout.rotationY}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export const preloadBike = (bike) => useGLTF.preload(bike.model);
