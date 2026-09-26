import { lazy, Suspense, useState } from 'react';
import { BIKE_LIST } from '../../config/bikes.js';
import BikeCard from './BikeCard.jsx';

// Three.js is only downloaded when someone actually opens a quick look.
const QuickLookDialog = lazy(() => import('./QuickLookDialog.jsx'));

export default function BikeShowcase() {
  const [quickLook, setQuickLook] = useState(null);
  return (
    <section id="models" className="showcase" aria-labelledby="models-title">
      <div className="section-head">
        <p className="eyebrow">The line-up</p>
        <h2 id="models-title" className="section-title">
          Three platforms.
          <br />
          Endless builds.
        </h2>
      </div>
      <div className="showcase__grid">
        {BIKE_LIST.map((bike, i) => (
          <BikeCard key={bike.id} bike={bike} index={i} onQuickLook={setQuickLook} />
        ))}
      </div>
      {quickLook && (
        <Suspense fallback={null}>
          <QuickLookDialog bike={quickLook} onClose={() => setQuickLook(null)} />
        </Suspense>
      )}
    </section>
  );
}
