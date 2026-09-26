/** Shared option vocabularies: finishes, colour palettes, pricing & locale. */

export const CURRENCY = { code: 'INR', locale: 'en-IN' };

/** Special option value meaning "leave the model's original material untouched". */
export const FACTORY = 'factory';

/**
 * Physical surface finishes. Values are applied to MeshPhysicalMaterial.
 * Applying any non-factory finish drops the part's baked roughness/metalness maps so the
 * finish reads consistently; `factory` restores the original material exactly.
 */
export const FINISHES = {
  factory: { label: 'Factory', price: 0 },
  gloss: { label: 'Gloss', roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, price: 2500 },
  satin: { label: 'Satin', roughness: 0.5, metalness: 0.1, clearcoat: 0.35, clearcoatRoughness: 0.35, price: 2500 },
  matte: { label: 'Matte', roughness: 0.88, metalness: 0, clearcoat: 0, clearcoatRoughness: 0, price: 3500 },
  metallic: { label: 'Metallic', roughness: 0.32, metalness: 0.85, clearcoat: 0.8, clearcoatRoughness: 0.08, price: 5500 },
  polished: { label: 'Polished', roughness: 0.12, metalness: 1, clearcoat: 0, clearcoatRoughness: 0, price: 4500 },
};

/**
 * Surface textures, projected triplanar in world space (so they work regardless of the
 * models' UV layouts) and masked to the part's paint region.
 *
 *   pattern   id from src/three/patterns.js (or `url` for an image file in /public)
 *   tile      real-world size of one texture tile, in metres (bikes are ~1.8 m long)
 *   replace   0..1 how much the pattern colour replaces the paint (carbon ≈ raw weave)
 *   multiply  0..1 how much pattern luminance modulates the paint (brushed, tread)
 *   bump      bump strength from pattern luminance
 *   metal / rough  [value, amount] overrides blended in by `amount`
 */
export const TEXTURES = {
  factory: { label: 'Factory', price: 0 },
  carbonTwill: {
    label: 'Carbon twill',
    pattern: 'carbonTwill',
    tile: 0.035,
    replace: 0.88,
    multiply: 0,
    bump: 1.1,
    metal: [0, 1],
    rough: [0.32, 0.7],
    price: 18000,
  },
  forgedCarbon: {
    label: 'Forged carbon',
    pattern: 'forgedCarbon',
    tile: 0.11,
    replace: 0.9,
    multiply: 0,
    bump: 0.7,
    metal: [0, 1],
    rough: [0.38, 0.6],
    price: 22000,
  },
  brushed: {
    label: 'Brushed alloy',
    pattern: 'brushed',
    tile: 0.22,
    replace: 0,
    multiply: 0.55,
    bump: 0.25,
    metal: [0.9, 1],
    rough: [0.34, 0.85],
    price: 9000,
  },
  fleck: {
    label: 'Fleck paint',
    pattern: 'fleck',
    tile: 0.2,
    replace: 1,
    multiply: 0,
    bump: 0.35,
    metal: [0, 0],
    rough: [0, 0],
    price: 6500,
  },
  diamondKnurl: {
    label: 'Diamond knurl',
    pattern: 'diamondKnurl',
    tile: 0.045,
    replace: 0,
    multiply: 0.7,
    bump: 3.2,
    metal: [0, 1],
    rough: [0.62, 0.9],
    price: 2500,
  },
  fileTread: {
    label: 'File tread',
    pattern: 'fileTread',
    tile: 0.05,
    replace: 0,
    multiply: 0.6,
    bump: 2.8,
    metal: [0, 1],
    rough: [0.6, 0.9],
    price: 2000,
  },
  microGrain: {
    label: 'Micro-grain',
    pattern: 'microGrain',
    tile: 0.06,
    replace: 0,
    multiply: 0.5,
    bump: 2,
    metal: [0, 1],
    rough: [0.7, 0.9],
    price: 1500,
  },
};

const swatch = (name, hex) => ({ name, hex });

export const PALETTES = {
  paint: [
    swatch('Obsidian', '#141517'),
    swatch('Chalk', '#e9e6df'),
    swatch('Oxide Red', '#8e2a22'),
    swatch('Racing Green', '#1f4a36'),
    swatch('Glacier Blue', '#6f9fc7'),
    swatch('Midnight Navy', '#1b2744'),
    swatch('Copper', '#b8683f'),
    swatch('Saffron', '#e0a526'),
    swatch('Sage', '#8d9b83'),
    swatch('Graphite', '#4a4d52'),
  ],
  accent: [
    swatch('Chalk', '#f1eee6'),
    swatch('Obsidian', '#141517'),
    swatch('Copper', '#c77a4d'),
    swatch('Saffron', '#e8b033'),
    swatch('Signal Red', '#c8322a'),
    swatch('Glacier Blue', '#7fb2dc'),
  ],
  metal: [
    swatch('Black Anodised', '#1a1b1d'),
    swatch('Silver', '#c9ccd1'),
    swatch('Gunmetal', '#55595f'),
    swatch('Gold', '#c9a24a'),
    swatch('Copper', '#b8683f'),
    swatch('Oil Slick Blue', '#3f5f8f'),
  ],
  rubber: [
    swatch('Black', '#161616'),
    swatch('Gum', '#a9794a'),
    swatch('Tan', '#c49a6c'),
    swatch('Grey', '#6b6d70'),
    swatch('Cream', '#e4dcc6'),
  ],
  leather: [
    swatch('Black', '#161616'),
    swatch('Cognac', '#8a4b27'),
    swatch('Tan', '#b98552'),
    swatch('Oxblood', '#5a1c1c'),
    swatch('Stone', '#b8b1a3'),
  ],
};

/** Surcharge applied whenever a colour option is moved away from factory. */
export const CUSTOM_COLOUR_PRICE = { paint: 4500, accent: 1500, metal: 2500, rubber: 1200, leather: 1800 };
