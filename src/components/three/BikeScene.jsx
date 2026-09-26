import { Suspense, useCallback, useMemo, useState } from 'react';
import { ContactShadows } from '@react-three/drei';
import BikeModel from './BikeModel.jsx';
import CameraController from './CameraController.jsx';
import StudioEnvironment from './StudioEnvironment.jsx';
import Lighting from './Lighting.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import StageFloor from './StageFloor.jsx';

/** Everything inside the <Canvas>: lighting, environment, model, shadows and camera. */
export default function BikeScene({ bike, partStates, cameraRequest, onReady, reducedMotion, autoRotate, enablePan, showFloor = true }) {
  const [runtime, setRuntime] = useState(null);
  const [hdrFailed, setHdrFailed] = useState(false);

  const handleReady = useCallback(
    (r) => {
      setRuntime(r);
      onReady?.(r);
    },
    [onReady],
  );

  // Translate a part-focus request into a bounding box using the live meshes.
  const request = useMemo(() => {
    if (!cameraRequest?.focusPart || !runtime) return cameraRequest;
    const focus = runtime.controller.getPartBounds(cameraRequest.focusPart);
    return focus ? { ...cameraRequest, focus } : { ...cameraRequest, preset: 'threeQuarter' };
  }, [cameraRequest, runtime]);

  // Contact shadows are baked once per visibility layout (e.g. kickstand removed → re-bake).
  const shadowKey = useMemo(
    () => Object.entries(partStates ?? {}).map(([id, s]) => (s.visible ? '' : id)).join('|'),
    [partStates],
  );

  return (
    <>
      <Lighting fallback={hdrFailed} />
      <ErrorBoundary name="HDR" fallback={null} onError={() => setHdrFailed(true)}>
        <Suspense fallback={null}>
          <StudioEnvironment />
        </Suspense>
      </ErrorBoundary>

      {showFloor && <StageFloor />}
      <Suspense fallback={null}>
        <BikeModel key={bike.id} bike={bike} partStates={partStates} onReady={handleReady} environmentFailed={hdrFailed} />
        {runtime && (
          <ContactShadows
            key={`${bike.id}:${shadowKey}`}
            position={[0, 0.002, 0]}
            scale={[runtime.bounds.max.x * 2 + 1.2, runtime.bounds.max.z * 2 + 1.4]}
            resolution={1024}
            blur={2.2}
            far={1.4}
            opacity={0.75}
            frames={1}
          />
        )}
      </Suspense>

      <CameraController
        bounds={runtime?.bounds}
        request={request}
        reducedMotion={reducedMotion}
        autoRotate={autoRotate}
        enablePan={enablePan}
      />
    </>
  );
}
