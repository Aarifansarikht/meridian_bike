import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store/store.js';
import { router } from './app/routes.jsx';
import { preloadRouteAssets } from './utils/preloadAssets.js';
// Self-hosted variable fonts (same origin, only the latin subset is downloaded).
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter/wght.css';
import './styles/global.css';
import './styles/landing.css';
import './styles/configurator.css';

// Kick off the model + HDR downloads immediately on configurator deep links.
preloadRouteAssets();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
