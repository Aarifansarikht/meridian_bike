import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, useTexture } from '@react-three/drei';
import { EquirectangularReflectionMapping, SRGBColorSpace } from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';

/**
 * The background photo projected onto a dome whose bottom is flat ground at y = 0.
 * The bike stands on that ground, so it looks placed in the scene, and its shadow lands on it.
 */
function GroundedBackground({ url, height, radius }) {
  const texture = useTexture(url);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;

  const skybox = useMemo(() => {
    const mesh = new GroundedSkybox(texture, height, radius);
    mesh.material.toneMapped = false; // the photo is already a finished (tone-mapped) image
    return mesh;
  }, [texture, height, radius]);

  useEffect(() => () => skybox.geometry.dispose(), [skybox]);

  // GroundedSkybox is built around its centre; lifting it by `height` puts its ground at y = 0.
  return <primitive object={skybox} position-y={height - 0.01} />;
}

/**
 * Lights the scene with an HDR image (image-based lighting): the HDR provides the light AND
 * the reflections on the product, so switching it visibly changes how the product looks.
 */
export default function SceneEnvironment({ environment }) {
  const invalidate = useThree((state) => state.invalidate);

  // The new lighting/background is applied after React renders; ask for one more frame
  // (we only render on demand).
  useEffect(() => {
    invalidate();
  }, [environment, invalidate]);

  return (
    <>
      <Environment files={environment.file} environmentIntensity={environment.intensity} />
      {environment.background && (
        <GroundedBackground
          url={environment.background}
          height={environment.ground.height}
          radius={environment.ground.radius}
        />
      )}
    </>
  );
}
