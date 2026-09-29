# Bike Configurator: basic 3D product configurator

A small web app for viewing a bicycle in 3D. You can rotate and zoom it, change the colour of its frame and rims, and switch the environment it's lit by.

**Live demo:** https://meridianbike.vercel.app

## Technology

| | |
| --- | --- |
| **React 19** | UI and app state (plain `useState`) |
| **Three.js** | 3D rendering (WebGL) |
| **React Three Fiber** | Three.js scene written as React components |
| **@react-three/drei** | Helpers: `useGLTF` (model loading), `OrbitControls`, `Environment` (HDR lighting), `ContactShadows`, `useProgress` |
| **Vite** | Dev server and production build |
| **glTF-Transform + meshoptimizer + sharp** | Build-time optimisation of the 3D models (dev only) |

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
npm run preview    # serve the production build locally
```

## How it works

```
src/
  config.js                  products, colours, environments (all data)
  App.jsx                    app state: product, colours, environment
  components/
    Viewer.jsx               <Canvas>, camera, orbit controls, shadow
    ProductModel.jsx         loads the GLB, frames it, applies colours
    SceneEnvironment.jsx     HDR environment lighting / background
    ConfigPanel.jsx          UI: model, colour swatches, environment buttons
    Loader.jsx               loading progress
```

**1. 3D viewer.** `ProductModel` loads the GLB with `useGLTF`. The model is measured with a bounding box, scaled to a fixed size, centred and placed on the ground, so every model is framed correctly by the same camera. `OrbitControls` provides rotate and zoom, with distance limits, and stops the camera going below the ground.

**2. Colour configuration.** `config.js` lists which **material names** in each GLB belong to each part (frame, rims). The names were found by inspecting the files with `npm run inspect-models`. When a colour is picked, a `useEffect` sets `material.color` on those materials only. The model is **not reloaded**: `useGLTF` caches it, and only the colour property changes. Six colours are offered for each part.

**3. Environment.** Each environment is an HDR image passed to drei's `<Environment>`. It lights the product and appears in its reflections. **Studio** is a neutral grey studio light on a plain background. **Outdoor** is a park: a small 1K HDR does the lighting, and a sharp 4K photo of the same place is projected onto a ground dome (three.js `GroundedSkybox`), so the bike stands on the path with a contact shadow instead of floating. Switching visibly changes the lighting, reflections and backdrop.

**4. UI.** A single panel with the model, two colour rows and environment buttons. All state lives in `App.jsx` and is passed down as props.

**5. Performance.**
- **Models optimised offline** (`npm run prepare-models`): simplified geometry, WebP textures and meshopt compression. The city bike went from 40 MB to 6.3 MB, and the BMX from 3.8 MB to 0.8 MB.
- **HDRs downscaled to 1K** (`npm run prepare-hdr`): 6.3 MB → 1.6 MB each, with the same lighting. Only the visible background uses a 4K JPEG (1.6 MB).
- **On-demand rendering** (`frameloop="demand"`): a frame is drawn only when something changes.
- **Preloading:** the first model and both HDRs are preloaded, so switching environment is instant.
- **Separate `Suspense` boundaries** keep the product visible while an environment loads.

## Assets

- "BMX" by stealth86, and "Bicycle m." by Milionna, both on Sketchfab, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- "Palermo Park" HDRI by Andreas Mischok, [Poly Haven](https://polyhaven.com/a/palermo_park), CC0
- The original, unoptimised files are in `assets-src/`; the web versions are in `public/`
