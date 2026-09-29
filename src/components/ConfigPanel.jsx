import { PRODUCTS, COLOR_PARTS, COLORS, ENVIRONMENTS } from '../config.js';

/**
 * The UI panel: product, colours and environment.
 * It only calls the callbacks it receives — all state lives in App.jsx.
 */
export default function ConfigPanel({
  productId,
  onProductChange,
  colors,
  onColorChange,
  environmentId,
  onEnvironmentChange,
}) {
  return (
    <aside className="panel">
      <h1 className="panel__title">Bike Configurator</h1>
      <p className="panel__hint">Drag to rotate · scroll to zoom</p>

      <section className="panel__section">
        <h2>Model</h2>
        <div className="buttons">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              className={product.id === productId ? 'is-active' : ''}
              onClick={() => onProductChange(product.id)}
            >
              {product.name}
            </button>
          ))}
        </div>
      </section>

      {COLOR_PARTS.map((part) => (
        <section key={part.id} className="panel__section">
          <h2>
            {part.label}
            <span>{COLORS.find((c) => c.hex === colors[part.id])?.name}</span>
          </h2>
          <div className="swatches">
            {COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                className={`swatch ${colors[part.id] === color.hex ? 'is-active' : ''}`}
                style={{ background: color.hex }}
                title={color.name}
                aria-label={`${part.label}: ${color.name}`}
                onClick={() => onColorChange(part.id, color.hex)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="panel__section">
        <h2>Environment</h2>
        <div className="buttons">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env.id}
              type="button"
              className={env.id === environmentId ? 'is-active' : ''}
              onClick={() => onEnvironmentChange(env.id)}
            >
              {env.name}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
