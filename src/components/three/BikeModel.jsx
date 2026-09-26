import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { createBikeController } from '../../three/bikeController.js';
import { computeModelLayout } from '../../three/sceneUtils.js';
import { useBikeGLTF, preloadBikeGLTF } from '../../three/loaders.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ENV_WAIT_MS = 8000;

/**
 * Loads a bike GLB, normalises its placement and applies part states.
 * Receives already-resolved `partStates`; only parts whose state changed are touched.
 *
 * The model stays hidden until every shader has been compiled with `compileAsync`
 * (KHR_parallel_shader_compile), so the first visible frame never stalls the main thread.
 */
export default function BikeModel({ bike, partStates, onReady, environmentFailed = false }) {
  const { scene } = useBikeGLTF(bike.model);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const rootScene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const [compiled, setCompiled] = useState(false);
  const envFailed = useRef(environmentFailed);
  envFailed.current = environmentFailed;

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

  // Compile programs in parallel once the HDR is in place (its env map is part of the program).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = performance.now();
      while (!rootScene.environment && !envFailed.current && performance.now() - start < ENV_WAIT_MS) {
        await wait(50);
        if (cancelled) return;
      }
      try {
        await gl.compileAsync(model, camera, rootScene);
      } catch (err) {
        console.warn('[BikeModel] async shader compile failed; compiling on first frame instead', err);
      }
      if (!cancelled) {
        setCompiled(true);
        invalidate();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [model, gl, camera, rootScene, invalidate]);

  useEffect(() => {
    if (compiled) onReady?.({ controller, bounds: layout.bounds, missingParts: controller.missingParts });
  }, [compiled, controller, layout, onReady]);

  return (
    <group position={layout.position} scale={layout.scale} visible={compiled}>
      <group rotation-y={layout.rotationY}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export const preloadBike = (bike) => preloadBikeGLTF(bike.model);
