import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getBike, getDefaultConfiguration } from '../config/bikes.js';
import { resolvePartStates } from '../utils/resolvePartStates.js';
import BikeViewer from '../components/three/BikeViewer.jsx';

const CAMERA = { preset: 'threeQuarter', nonce: 0 };

/**
 * DEV ONLY (/studio/:bikeId): renders a bike on a transparent background so
 * scripts/capture-renders.mjs can export the landing-page product shots from the real GLBs.
 */
export default function StudioPage() {
  const bike = getBike(useParams().bikeId);
  const partStates = useMemo(() => bike && resolvePartStates(bike, getDefaultConfiguration(bike)), [bike]);
  const onReady = useCallback(() => {
    // Let shadows bake and the camera settle before signalling readiness.
    setTimeout(() => {
      window.__studioReady = true;
    }, 1500);
  }, []);
  if (!bike) return <p>Unknown bike</p>;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent' }}>
      <BikeViewer bike={bike} partStates={partStates} cameraRequest={CAMERA} onReady={onReady} preserveDrawingBuffer showFloor={false} className="studio" />
    </div>
  );
}
