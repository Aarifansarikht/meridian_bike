# Meridian: 3D bicycle configurator

React 19 · Three.js r186 · React Three Fiber 9 · drei 10 · Redux Toolkit · React Router 7 · Vite 8

```bash
npm install
npm run dev            # http://localhost:5173
npm run build && npm run preview
```

| Script | Purpose |
| --- | --- |
| `npm run prepare-models` | `assets-src/*.glb` → web-ready `public/models/*.glb` (spec/gloss conversion, weld + simplify, WebP textures, meshopt) |
| `npm run prepare-hdr` | `assets-src/hdr/*.hdr` → 1K `public/hdr/*_1k.hdr` (lighting needs no more) |
| `npm run inspect-models` | print the node → mesh → material tree of every model |
| `npm run capture-renders` | re-export the landing-page renders from the real GLBs (needs `npm run dev` and local Chrome/Edge) |

The mesh and material mapping for all three bikes, with its limitations, is in
**[docs/MODEL_INSPECTION.md](docs/MODEL_INSPECTION.md)**.

## Architecture

```
src/
  config/     bikeParts.js (GLB → part mapping), bikes.js (models + options), configurationOptions.js
  three/      bikeController.js (part API), materials.js, textures.js (GPU region recolour),
              meshUtils.js, cameraUtils.js, sceneUtils.js
  store/      configuratorSlice.js (config, undo/redo), selectors.js
  utils/      resolvePartStates.js (config → part states), formatConfiguration.js (summary, price),
              configurationSerializer.js (URL), shareConfiguration.js
  hooks/      useBikeConfiguration.js (actions, URL sync, shortcuts), useResponsive.js
  components/ three/ (BikeViewer, BikeScene, BikeModel, CameraController…),
              configurator/ (panel, controls, summary, share), landing/, common/
  pages/      Home, ConfiguratorPage, StudioPage (dev-only render capture)
```

**Data flow:** a UI control dispatches `setOption(id, value)` → Redux holds serializable values only →
`selectPartStates` resolves them into per-part states → `BikeModel` calls
`controller.applyPartStates()`, which updates only the parts whose state changed. Rendering is
on-demand (`frameloop="demand"`).

### Adding or changing an option

1. Map the part in `src/config/bikeParts.js` by material name (plus a texture `channel` if needed).
2. Add an option to the bike's category in `src/config/bikes.js` (`color`, `finish`, `texture`, `toggle` or `choice`).

The panel, summary, pricing, URL and share text pick it up automatically.

### Imperative API (dev console: `window.__bike`)

```js
__bike.updatePartColor('frame', '#ff0000');           // primary channel
__bike.updatePartColor('frame', '#ffffff', 'decal');  // texture channel
__bike.updatePartMaterial('handlebar', 'polished');
__bike.updatePartSurface('frame', 'carbonTwill');
__bike.updatePartVisibility('kickstand', false);
__bike.updatePartTexture('saddle', texture);
__bike.resetBike();
__bike.describeParts();
```

## Features

- Landing page with product renders from the real models and a 3D quick look
- Configurator with HDR lighting, Khronos PBR Neutral tone mapping, contact shadows, and camera presets (3/4, side, front, rear, top) plus part focus when you switch category
- Colour, finish, texture-region recolour, decals and accessory/variant visibility, each mapped to real meshes and materials
- Surface textures: carbon twill, forged carbon, brushed alloy and fleck paint for frames; diamond knurl, file tread and micro-grain for tyres. Generated in code and projected in 3D (no UVs needed). To use a photo texture instead, give a `TEXTURES` preset a `url` in `configurationOptions.js`.
- Undo / redo (Ctrl+Z / Ctrl+Shift+Z), reset, and a live estimated price
- Summary with configuration ID; sharing via WhatsApp, e-mail, copy summary, copy link and native share
- Shareable URLs, e.g. `/configurator/metro?frameColor=1f4a36&frameFinish=matte&kickstand=0`. Invalid values fall back to defaults.
- Floating glass panel on desktop and a bottom sheet on mobile
- Loading progress, WebGL-unavailable message, GLB error with retry, lighting fallback if the HDR fails, and missing parts hidden
- Keyboard-accessible radio/tab/switch semantics, visible focus states and `prefers-reduced-motion` support

## Performance

Measure the **production build** (`npm run build && npm run preview`). The dev server serves
unminified, unbundled modules, so Lighthouse on `npm run dev` scores it far lower than what ships.

- **Models:** welded and simplified within a tight error bound, WebP textures, meshopt geometry. 19.4 MB → 9.3 MB for all three; the city bike went from 656k to 368k triangles.
- **HDR:** downscaled 2K → 1K (6.3 MB → 1.6 MB) with no visible change to the lighting.
- **Geometry decoding** runs in Web Workers (`src/three/loaders.js`).
- **Shaders** compile with `compileAsync`; the bike appears once they are ready.
- **Early download:** configurator deep links preload the model and HDR at boot, and landing-page "Configure" buttons prefetch on hover (`src/utils/preloadAssets.js`).
- **Canvas mount:** the WebGL canvas mounts after the UI's first paint, and entrance animations never start from `opacity: 0`.
- **Fonts** are self-hosted with `@fontsource-variable`, so there are no render-blocking third-party requests.
- **Rendering** is on demand, and three.js is loaded only on 3D routes.

## Known notes

- The console shows a `THREE.Clock` deprecation warning. It comes from inside `@react-three/fiber` 9 and is harmless.
- Prices are illustrative and live in `bikes.js` / `configurationOptions.js` (INR).
- The models are CC BY 4.0. Attribution is in the footer and must stay there.
