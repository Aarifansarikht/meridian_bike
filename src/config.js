/**
 * All configurator data lives here, so adding a product, colour or environment
 * never requires touching the components.
 */

/**
 * Products (GLB models).
 * `parts` maps a configurable part to the material names inside the GLB file.
 * These names were found by inspecting the models (`npm run inspect-models`).
 */
export const PRODUCTS = [
  {
    id: 'bmx',
    name: 'BMX',
    model: '/models/bmx.glb',
    parts: {
      frame: ['body_color', 'body_1', 'body_2'],
      rims: ['material'],
    },
  },
  {
    id: 'city',
    name: 'City bike',
    model: '/models/city-bicycle.glb',
    parts: {
      frame: ['finbike1lambert7SG1'],
      rims: ['finbike1lambert15SG1'],
    },
  },
];

/** The parts the user can colour, in the order they appear in the panel. */
export const COLOR_PARTS = [
  { id: 'frame', label: 'Frame colour' },
  { id: 'rims', label: 'Rim colour' },
];

export const COLORS = [
  { name: 'Racing Red', hex: '#b3261e' },
  { name: 'Midnight Black', hex: '#1c1c1e' },
  { name: 'Arctic White', hex: '#e8e6e1' },
  { name: 'Forest Green', hex: '#1f5a3d' },
  { name: 'Ocean Blue', hex: '#2f6db5' },
  { name: 'Sunburst Yellow', hex: '#e2a725' },
];

/** Starting colour for each part. */
export const DEFAULT_COLORS = { frame: '#b3261e', rims: '#1c1c1e' };

/**
 * Environments.
 *   file        small HDR (1K) — provides the lighting and reflections on the product
 *   background  optional high-resolution photo of the same place, projected onto a ground
 *               so the product stands IN the scene instead of floating in front of it
 *   ground      height = camera height of the photo (m), radius = size of the projected world (m)
 */
export const ENVIRONMENTS = [
  {
    id: 'studio',
    name: 'Studio',
    file: '/hdr/monochrome_studio_03_1k.hdr',
    backgroundColor: '#e7e7ea',
    intensity: 1,
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    file: '/hdr/palermo_park_1k.hdr',
    background: '/hdr/palermo_park_bg.jpg',
    ground: { height: 1.7, radius: 60 },
    intensity: 1.1,
  },
];
