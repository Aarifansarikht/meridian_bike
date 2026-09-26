import { Environment } from '@react-three/drei';

import { HDR_URL } from '../../config/scene.js';

/** Image-based lighting from the supplied studio HDR (lighting only — not shown as background). */
export default function StudioEnvironment({ intensity = 0.85 }) {
  return <Environment files={HDR_URL} environmentIntensity={intensity} environmentRotation={[0, Math.PI / 3, 0]} />;
}
