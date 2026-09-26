/**
 * Starts downloading heavy 3D assets before the configurator code has even loaded.
 * Uses <link rel="preload" as="fetch" crossorigin> which matches three.js' FileLoader request
 * (CORS mode, same-origin credentials), so the browser reuses the response instead of re-fetching.
 */
import { DEFAULT_BIKE_ID, getBike } from '../config/bikes.js';
import { HDR_URL } from '../config/scene.js';

const added = new Set();

function addLink(href, rel, priority) {
  if (added.has(href)) return;
  added.add(href);
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  link.crossOrigin = 'anonymous';
  if (rel === 'preload') link.as = 'fetch';
  if (priority) link.fetchPriority = priority;
  document.head.appendChild(link);
}

/** Called once at boot: preloads the model + HDR when the URL is a configurator route. */
export function preloadRouteAssets(pathname = window.location.pathname) {
  const match = pathname.match(/^\/configurator(?:\/([^/?#]+))?/);
  if (!match) return;
  const bike = getBike(match[1] ?? DEFAULT_BIKE_ID);
  if (!bike) return;
  addLink(bike.model, 'preload', 'high');
  addLink(HDR_URL, 'preload', 'high');
}

/** Low-priority prefetch, e.g. when the user hovers a "Configure" button on the landing page. */
export function prefetchBikeAssets(bike) {
  addLink(bike.model, 'prefetch');
  addLink(HDR_URL, 'prefetch');
}
