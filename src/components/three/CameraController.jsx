import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { getFocusPose, getPresetPose } from '../../three/cameraUtils.js';

/**
 * Orbit / zoom / pan with damping, plus animated camera presets and part focus.
 * `request` is `{ preset }` or `{ focus: Box3 }` with a changing `nonce` to retrigger.
 */
export default function CameraController({ bounds, request, reducedMotion, enablePan = true, autoRotate = false }) {
  const ref = useRef(null);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const aspect = size.width / Math.max(size.height, 1);

  useEffect(() => {
    const controls = ref.current;
    if (!controls || !bounds) return;
    if (import.meta.env.DEV) Object.assign(window, { __controls: controls, __invalidate: invalidate });
    const pose = request?.focus ? getFocusPose(request.focus, bounds, aspect) : getPresetPose(request?.preset, bounds, aspect);
    controls.setLookAt(...pose.position.toArray(), ...pose.target.toArray(), !reducedMotion && request?.nonce > 0);
    // Keep panning within a sensible volume around the bike.
    controls.setBoundary(bounds.clone().expandByScalar(0.6));
    invalidate(); // on-demand rendering: schedule the frame that applies the new pose
    // aspect intentionally omitted: resizing should not re-trigger a camera move
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, request, reducedMotion, invalidate]);

  useEffect(() => {
    if (!autoRotate || reducedMotion) return undefined;
    let raf;
    let last = performance.now();
    const tick = (t) => {
      ref.current?.rotate(((t - last) / 1000) * 0.18, 0, false);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, reducedMotion]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.7}
      maxDistance={7}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI * 0.53}
      smoothTime={reducedMotion ? 0 : 0.45}
      draggingSmoothTime={0.12}
      dollyToCursor
      truckSpeed={enablePan ? 1 : 0}
      boundaryEnclosesCamera={false}
    />
  );
}
