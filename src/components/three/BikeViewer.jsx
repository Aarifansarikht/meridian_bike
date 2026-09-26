import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import BikeScene from './BikeScene.jsx';
import ViewerLoader from './ViewerLoader.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { CAMERA_FOV } from '../../three/cameraUtils.js';
import { isWebGLAvailable } from '../../three/sceneUtils.js';
import { clearBikeGLTF } from '../../three/loaders.js';
import { useReducedMotion, useResponsive } from '../../hooks/useResponsive.js';

function ViewerMessage({ title, children, action }) {
  return (
    <div className="viewer-message" role="alert">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

/**
 * The 3D viewport. Owns the <Canvas>, the loading overlay and error / WebGL fallbacks.
 * Rendering is on-demand: frames are only drawn when the camera moves or a part changes.
 */
export default function BikeViewer({
  bike,
  partStates,
  cameraRequest,
  onReady,
  className = '',
  autoRotate = false,
  enablePan = true,
  preserveDrawingBuffer = false,
  showFloor = true,
}) {
  const [readyBikeId, setReadyBikeId] = useState(null);
  const ready = readyBikeId === bike.id; // re-shows the loader when switching bikes
  const [attempt, setAttempt] = useState(0);
  const reducedMotion = useReducedMotion();
  // Mount the WebGL canvas two frames after the surrounding UI has painted: scene setup
  // (PMREM, shader compile, texture upload) otherwise competes with the page's first paint.
  // Asset downloads are unaffected — they were started early by utils/preloadAssets.js.
  const [canvasReady, setCanvasReady] = useState(false);
  useEffect(() => {
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setCanvasReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  const { isMobile } = useResponsive();

  const handleReady = useCallback(
    (runtime) => {
      setReadyBikeId(bike.id);
      onReady?.(runtime);
    },
    [onReady, bike.id],
  );

  if (!isWebGLAvailable()) {
    return (
      <div className={`bike-viewer ${className}`}>
        <ViewerMessage title="3D is not available on this device">
          Your browser does not support WebGL 2, which the configurator needs. Try a recent version of Chrome, Edge,
          Firefox or Safari, or enable hardware acceleration.
        </ViewerMessage>
      </div>
    );
  }

  return (
    <div className={`bike-viewer ${className}`}>
      <ErrorBoundary
        name="BikeViewer"
        resetKey={`${bike.id}:${attempt}`}
        fallback={(error, reset) => (
          <ViewerMessage
            title="We couldn't load this bicycle"
            action={
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  clearBikeGLTF(bike.model);
                  setAttempt((a) => a + 1);
                  reset();
                }}
              >
                Try again
              </button>
            }
          >
            {error?.message?.includes('fetch') || error?.message?.includes('Could not load')
              ? 'The 3D model file could not be downloaded. Check your connection and try again.'
              : 'Something went wrong while preparing the 3D model.'}
          </ViewerMessage>
        )}
      >
        {canvasReady && (
          <Canvas
            key={attempt}
            frameloop="demand"
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            camera={{ fov: CAMERA_FOV, near: 0.05, far: 60, position: [3.2, 1.3, 3.6] }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer }}
            onCreated={({ gl }) => {
              gl.toneMapping = NeutralToneMapping; // Khronos PBR Neutral: faithful product colours
              gl.toneMappingExposure = 1.0;
              gl.outputColorSpace = SRGBColorSpace;
            }}
            aria-label={`Interactive 3D model of the ${bike.name}. Drag to rotate, scroll or pinch to zoom.`}
            role="img"
          >
            <BikeScene
              bike={bike}
              partStates={partStates}
              cameraRequest={cameraRequest}
              onReady={handleReady}
              reducedMotion={reducedMotion}
              autoRotate={autoRotate}
              enablePan={enablePan}
              showFloor={showFloor}
            />
          </Canvas>
        )}
      </ErrorBoundary>
      <ViewerLoader visible={!ready} label={`Preparing the ${bike.name}`} />
    </div>
  );
}
