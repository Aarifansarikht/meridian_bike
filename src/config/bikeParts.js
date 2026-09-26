/**
 * GLB → part mapping.
 *
 * Every name below was taken from inspecting the actual files (see docs/MODEL_INSPECTION.md and
 * `npm run inspect-models`). Parts are matched by glTF MATERIAL name, because all three
 * Sketchfab exports use generic or duplicated node names, while material names are stable.
 *
 * A part may also list `nodes` (exact three.js object names or RegExps) for finer selection.
 *
 * `channels` describe regions INSIDE a part's base-colour texture that can be recoloured
 * independently (see src/three/textures.js). Keys use sRGB HSL ranges:
 *   hue: [fromDeg, toDeg] (wraps through 0), sat: [0..1, 0..1], lum: [0..1, 0..1]
 * Optional `detail` (0..1, default 0.8) sets how much baked shading/wear survives recolouring.
 * The `primary` channel is also used for materials of the part that have NO texture
 * (their base colour is set directly).
 */

/** Racing bicycle — single texture-atlas material, meshes are arbitrary 65k-vertex chunks. */
const corsaParts = {
  bike: {
    label: 'Complete bike',
    materials: ['BiciCorsa_A1'],
    primary: 'frame',
    channels: {
      // Oxide-red frame tubes, fork, red bottle and small red accents in the atlas.
      frame: { hue: [340, 22], sat: [0.3, 1], lum: [0.06, 0.62] },
      // Tan gumwall tyre sidewalls (olive-gold in the atlas; the rims themselves are silver).
      sidewalls: { hue: [30, 58], sat: [0.18, 0.62], lum: [0.14, 0.46] },
      // Bright yellow bottle and yellow accents.
      bottle: { hue: [36, 62], sat: [0.5, 1], lum: [0.46, 0.85] },
    },
  },
};

/** City / urban bicycle (source: "Bicycle m." by Milionna). Maya "lambertNN" material names. */
const metroParts = {
  frame: {
    label: 'Frame',
    materials: ['finbike1lambert7SG1'],
    primary: 'paint',
    channels: {
      paint: { sat: [0, 0.4], detail: 0.35 }, // texture carries a strong baked pattern
      decal: { hue: [185, 255], sat: [0.35, 1] }, // blue "kit bike" down-tube lettering
    },
  },
  fork: { label: 'Fork', materials: ['finbike1lambert9SG1'] },
  seatpost: { label: 'Seatpost', materials: ['finbike1lambert6SG1'] },
  saddle: { label: 'Saddle', materials: ['finbike1lambert3SG1'] },
  handlebar: { label: 'Handlebar', materials: ['finbike1lambert31SG1'] },
  // The model uses one material (and interleaved mesh chunks) for both tyres AND bar grips.
  tyresGrips: { label: 'Tyres & grips', materials: ['finbike1lambert13SG1'] },
  rims: { label: 'Rims', materials: ['finbike1lambert15SG1'] },
  spokes: { label: 'Spokes', materials: ['finbike1initialShadingGroup1', 'finbike1lambert17SG1'] },
  drivetrain: {
    label: 'Drivetrain',
    // lambert20 = cassette, chainring, disc rotor · lambert2 = chain · lambert23 = cranks & pedals
    materials: ['finbike1lambert20SG1', 'finbike1lambert2SG1', 'finbike1lambert23SG1'],
  },
  kickstand: { label: 'Kickstand', materials: ['finbike1lambert27SG1'] },
};

/** BMX (source: "BMX" by stealth86). Clean, descriptive material names. */
const zenithParts = {
  frame: {
    label: 'Frame',
    // body_color = frame tubes + fork; body_1 / body_2 = down/seat tube with "ZENITH" decal texture
    materials: ['body_color', 'body_1', 'body_2'],
    primary: 'paint',
    channels: {
      paint: { hue: [330, 25], sat: [0.45, 1], lum: [0, 0.62] },
      decal: { lum: [0.62, 1] }, // cream lettering
    },
  },
  accents: { label: 'Frame accents', materials: ['black_body'] },
  handlebar: { label: 'Handlebar', materials: ['handlebar'] },
  grips: { label: 'Grips', materials: ['handle_grip'] },
  rims: { label: 'Rims & hubs', materials: ['material'] },
  spokes: { label: 'Spokes & hardware', materials: ['screws_nuts'] },
  tyres: { label: 'Tyres', materials: ['tyre'] },
  saddle: { label: 'Saddle', materials: ['seat'] },
  drivetrain: { label: 'Sprocket & cranks', materials: ['gear', 'gear_inner', 'chain_link', 'chain_connection'] },
  pedals: { label: 'Pedals', materials: ['pedal'] },
  pegs: { label: 'Axle pegs', materials: ['stand'] },
  brakes: {
    label: 'Rear brake',
    materials: ['brake', 'brake_holder', 'brake_Wire', 'brake_inner_wire', 'brake_shoe', 'brake_shoe_holder'],
  },
};

export const BIKE_PARTS = {
  corsa: corsaParts,
  metro: metroParts,
  zenith: zenithParts,
};
