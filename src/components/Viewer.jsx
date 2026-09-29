import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF, useEnvironment, useTexture } from '@react-three/drei';
import ProductModel from './ProductModel.jsx';
import SceneEnvironment from './SceneEnvironment.jsx';
import Loader from './Loader.jsx';
import { PRODUCTS, ENVIRONMENTS } from '../config.js';

// Start downloading the first model and all environment files straight away,
// so switching environment later is instant.
useGLTF.preload(PRODUCTS[0].model);
ENVIRONMENTS.forEach((env) => {
  useEnvironment.preload({ files: env.file });
  if (env.background) useTexture.preload(env.background);
});

/**
 * The 3D viewport: canvas, camera, controls, lighting, shadow and the product.
 */
export default function Viewer({ product, colors, environment }) {
  return (
    // The studio environment shows a plain colour behind the transparent canvas.
    <div className="viewer" style={{ background: environment.backgroundColor ?? '#000' }}>
      <Canvas
        frameloop="demand" // only render when something changes (saves CPU/GPU and battery)
        dpr={[1, 2]} // sharp on high-DPI screens, capped at 2x for performance
        camera={{ position: [2.6, 1.2, 3.1], fov: 35, near: 0.1, far: 100 }}
      >
        {/* Separate Suspense boundaries: switching the environment never hides the product. */}
        <Suspense fallback={null}>
          <SceneEnvironment environment={environment} />
        </Suspense>

        <Suspense fallback={null}>
          <ProductModel product={product} colors={colors} />
          {/* Soft shadow under the bike — this is what makes it look grounded. */}
          <ContactShadows position={[0, 0, 0]} scale={5} blur={1.8} far={1.5} opacity={0.85} />
        </Suspense>

        <OrbitControls
          makeDefault
          target={[0, 0.5, 0]} // look at the middle of the bike
          enablePan={false}
          enableDamping
          minDistance={1.5} // zoom limits
          maxDistance={7}
          maxPolarAngle={Math.PI / 2 - 0.05} // don't go below the ground
        />
      </Canvas>
      <Loader />
    </div>
  );
}
