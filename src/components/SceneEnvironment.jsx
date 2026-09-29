import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

/**
 * Lights the scene with an HDR image (image-based lighting).
 * The HDR provides the light AND the reflections on the product, so switching it
 * visibly changes how the product looks.
 */
export default function SceneEnvironment({ environment }) {
  const invalidate = useThree((state) => state.invalidate);

  // <Environment> applies the new lighting/background after React renders,
  // so ask for one more frame (we only render on demand).
  useEffect(() => {
    invalidate();
  }, [environment, invalidate]);

  return (
    <Environment
      files={environment.file}
      background={environment.showBackground} // outdoor: show the photo behind the product
      backgroundBlurriness={0.03} // slight blur keeps the focus on the product
      environmentIntensity={environment.intensity}
    />
  );
}
