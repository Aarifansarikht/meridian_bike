/** Camera framing maths. The bike faces +X, stands on y = 0, and is centred on the origin. */
import { Vector3, MathUtils } from 'three';

export const CAMERA_FOV = 32;

/** Unit directions from the target towards the camera. */
export const CAMERA_PRESETS = {
  threeQuarter: { label: '3/4', dir: [0.88, 0.3, 0.95] },
  side: { label: 'Side', dir: [0.001, 0.06, 1] },
  front: { label: 'Front', dir: [1, 0.14, 0.001] },
  rear: { label: 'Rear', dir: [-1, 0.14, 0.001] },
  top: { label: 'Top', dir: [0.001, 1, 0.12] },
};
export const DEFAULT_PRESET = 'threeQuarter';

/**
 * Distance at which `box` fills the frame when viewed along `dir`.
 * Projects the box corners onto the view plane so narrow views (front/rear) zoom in properly.
 */
export function fitDistance(box, dir, aspect = 1.6, padding = 1.22, fov = CAMERA_FOV) {
  const d = new Vector3(...dir).normalize();
  const up = Math.abs(d.y) > 0.95 ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(up, d).normalize();
  const trueUp = new Vector3().crossVectors(d, right).normalize();
  const center = box.getCenter(new Vector3());
  let halfW = 0, halfH = 0, halfD = 0;
  for (let i = 0; i < 8; i++) {
    const p = new Vector3(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    ).sub(center);
    halfW = Math.max(halfW, Math.abs(p.dot(right)));
    halfH = Math.max(halfH, Math.abs(p.dot(trueUp)));
    halfD = Math.max(halfD, Math.abs(p.dot(d)));
  }
  const tanV = Math.tan(MathUtils.degToRad(fov / 2));
  return Math.max(halfH / tanV, halfW / (tanV * aspect)) * padding + halfD;
}

/** Camera pose `{ position, target }` for a preset. */
export function getPresetPose(presetId, box, aspect) {
  const preset = CAMERA_PRESETS[presetId] ?? CAMERA_PRESETS[DEFAULT_PRESET];
  const target = box.getCenter(new Vector3());
  const dir = new Vector3(...preset.dir).normalize();
  const dist = fitDistance(box, preset.dir, aspect);
  return { position: target.clone().addScaledVector(dir, dist), target };
}

/**
 * Pose that brings a part into focus while keeping the bike in context: the part box is
 * padded so tiny parts (e.g. a kickstand) never zoom the bike out of frame.
 */
export function getFocusPose(partBox, bikeBox, aspect) {
  const box = partBox.clone().expandByScalar(0.28).intersect(bikeBox.clone().expandByScalar(0.1));
  const target = box.getCenter(new Vector3());
  const dir = new Vector3(0.7, 0.35, 1).normalize();
  const dist = Math.max(fitDistance(box, dir.toArray(), aspect, 1.35), 1.2);
  return { position: target.clone().addScaledVector(dir, dist), target };
}
