import { useState } from 'react';
import Viewer from './components/Viewer.jsx';
import ConfigPanel from './components/ConfigPanel.jsx';
import { PRODUCTS, ENVIRONMENTS, DEFAULT_COLORS } from './config.js';

/**
 * The whole app state lives here (plain React state):
 *   - which product is shown
 *   - the colour of each part
 *   - which environment is active
 * It is passed down to the 3D viewer and to the UI panel.
 */
export default function App() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [environmentId, setEnvironmentId] = useState(ENVIRONMENTS[0].id);

  const product = PRODUCTS.find((p) => p.id === productId);
  const environment = ENVIRONMENTS.find((e) => e.id === environmentId);

  const setPartColor = (partId, hex) => setColors((prev) => ({ ...prev, [partId]: hex }));

  return (
    <main className="app">
      <Viewer product={product} colors={colors} environment={environment} />
      <ConfigPanel
        productId={productId}
        onProductChange={setProductId}
        colors={colors}
        onColorChange={setPartColor}
        environmentId={environmentId}
        onEnvironmentChange={setEnvironmentId}
      />
    </main>
  );
}
