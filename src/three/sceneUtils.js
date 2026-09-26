/** Scene-level helpers: model normalisation and capability checks. */
import { Box3, Matrix4, Vector3 } from 'three';

export const BIKE_LENGTH = 1.8; // metres — every model is normalised to this wheelbase-ish length

/**
 * Computes a transform that orients a model along +X, scales it to BIKE_LENGTH and stands it
 * on the ground plane (y = 0) centred on the origin. The model itself is not modified.
 */
export function computeModelLayout(model, { rotationY = 0 } = {}) {
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model).applyMatrix4(new Matrix4().makeRotationY(rotationY));
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = BIKE_LENGTH / Math.max(size.x, 1e-6);
  return {
    rotationY,
    scale,
    position: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    bounds: new Box3(
      new Vector3(-size.x / 2, 0, -size.z / 2).multiplyScalar(scale),
      new Vector3(size.x / 2, size.y, size.z / 2).multiplyScalar(scale),
    ),
  };
}

let webglSupport;
export function isWebGLAvailable() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
