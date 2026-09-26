import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import { DEFAULT_BIKE_ID } from '../config/bikes.js';
import Home from '../pages/Home.jsx';

// The configurator (and three.js) is split out of the landing-page bundle.
const ConfiguratorPage = lazy(() => import('../pages/ConfiguratorPage.jsx'));
const StudioPage = import.meta.env.DEV ? lazy(() => import('../pages/StudioPage.jsx')) : null;

function PageFallback() {
  return <div className="page-fallback" role="status" aria-label="Loading" />;
}

function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>This road doesn’t go anywhere.</h1>
      <Link to="/" className="btn btn--primary">
        Back to the line-up
      </Link>
    </main>
  );
}

const lazyPage = (Page) => (
  <Suspense fallback={<PageFallback />}>
    <Page />
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/configurator', element: <Navigate to={`/configurator/${DEFAULT_BIKE_ID}`} replace /> },
  { path: '/configurator/:bikeId', element: lazyPage(ConfiguratorPage) },
  ...(import.meta.env.DEV ? [{ path: '/studio/:bikeId', element: lazyPage(StudioPage) }] : []),
  { path: '*', element: <NotFound /> },
]);
