import { Environment } from '@react-three/drei';

export const HDR_URL = '/hdr/monochrome_studio_03_2k.hdr';

/** Image-based lighting from the supplied studio HDR (lighting only — not shown as background). */
export default function StudioEnvironment({ intensity = 0.85 }) {
  return <Environment files={HDR_URL} environmentIntensity={intensity} environmentRotation={[0, Math.PI / 3, 0]} />;
}
