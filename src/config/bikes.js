/**
 * Bicycle definitions: marketing data, model file, orientation and the configurator options.
 *
 * Every option references a part from ./bikeParts.js (and optionally a texture channel of that
 * part). Nothing here may reference geometry that does not exist in the GLB — see
 * docs/MODEL_INSPECTION.md for what each model does and does not support.
 *
 * Option types
 *   color  — value: FACTORY | '#rrggbb' | '@otherOptionId' (mirror another colour option)
 *   finish — value: FACTORY | key of FINISHES
 *   texture — value: FACTORY | key of TEXTURES (world-space surface pattern)
 *   toggle — value: boolean (part visibility)
 *   choice — value: choice id; each choice carries `effects` applied to parts
 */
import { BIKE_PARTS } from './bikeParts.js';
import { FACTORY, CUSTOM_COLOUR_PRICE } from './configurationOptions.js';

const FRAME_TEXTURES = ['carbonTwill', 'forgedCarbon', 'brushed', 'fleck'];
const TYRE_TEXTURES = ['diamondKnurl', 'fileTread', 'microGrain'];

const texture = (id, label, part, choices, extra = {}) => ({
  id,
  type: 'texture',
  label,
  part,
  choices: [FACTORY, ...choices],
  default: FACTORY,
  ...extra,
});
const color = (id, label, part, palette, extra = {}) => ({
  id,
  type: 'color',
  label,
  part,
  palette,
  price: CUSTOM_COLOUR_PRICE[palette] ?? 0,
  default: FACTORY,
  ...extra,
});
const finish = (id, label, part, choices, extra = {}) => ({
  id,
  type: 'finish',
  label,
  part,
  choices: [FACTORY, ...choices],
  default: FACTORY,
  ...extra,
});

export const BIKES = {
  corsa: {
    id: 'corsa',
    code: 'CRS',
    name: 'Corsa Classica',
    category: 'Road',
    tagline: 'A lugged-era road racer, re-finished to order.',
    description:
      'Drop bars, twin bottle cages and a close-ratio derailleur drivetrain. Built for long, fast mornings.',
    model: '/models/racing-bicycle.glb',
    render: '/renders/corsa.webp',
    basePrice: 124900,
    specs: [
      { label: 'Discipline', value: 'Road' },
      { label: 'Bars', value: 'Drop' },
      { label: 'Drivetrain', value: '2× derailleur' },
      { label: 'Cages', value: '2 bottles' },
    ],
    // Model's long axis is +Z (front wheel at +Z); rotate so the bike faces +X.
    orientation: { rotationY: Math.PI / 2 },
    credit: { title: 'Racing Bicycle', author: 'Francesco Coldesina', url: 'https://sketchfab.com/3d-models/racing-bicycle-223901fe94de4d55b6324e7d7e273469' },
    parts: BIKE_PARTS.corsa,
    note: 'This model ships as a single texture atlas, so colours are applied to paint regions of the atlas rather than to separate components.',
    categories: [
      {
        id: 'frame',
        label: 'Frame',
        focus: null,
        options: [
          color('frameColor', 'Frame paint', 'bike', 'paint', {
            channel: 'frame',
            factoryLabel: 'Oxide Red',
            hint: 'Recolours the red paint regions of the atlas — frame, fork and the red bottle share this paint.',
          }),
          texture('frameTexture', 'Frame texture', 'bike', FRAME_TEXTURES, {
            hint: 'Applied to the red paint regions only — the frame, fork and red bottle.',
          }),
          finish('coat', 'Protective coat', 'bike', ['gloss', 'satin', 'matte'], {
            hint: 'A clear coat applied over the complete bike.',
          }),
        ],
      },
      {
        id: 'tyres',
        label: 'Tyres',
        focus: null,
        options: [
          color('sidewallColor', 'Sidewall colour', 'bike', 'rubber', {
            channel: 'sidewalls',
            factoryLabel: 'Tan gumwall',
            hint: 'Tread texture is not offered: the tread shares its atlas colour with other black parts.',
          }),
        ],
      },
      {
        id: 'accessories',
        label: 'Accessories',
        focus: null,
        options: [
          color('bottleColor', 'Bottle colour', 'bike', 'accent', { channel: 'bottle', factoryLabel: 'Saffron' }),
        ],
      },
    ],
  },

  metro: {
    id: 'metro',
    code: 'MTR',
    name: 'Kit Urban',
    category: 'City',
    tagline: 'Wide tyres, one-by gearing, zero fuss.',
    description:
      'A hardtail city bike with chunky all-road tyres, a front disc and a kickstand for the daily commute.',
    model: '/models/city-bicycle.glb',
    render: '/renders/metro.webp',
    basePrice: 68500,
    specs: [
      { label: 'Discipline', value: 'City' },
      { label: 'Tyres', value: 'All-road, wide' },
      { label: 'Drivetrain', value: '1× derailleur' },
      { label: 'Brake', value: 'Front disc' },
    ],
    orientation: { rotationY: 0 },
    credit: { title: 'Bicycle m.', author: 'Milionna', url: 'https://sketchfab.com/3d-models/bicycle-m-f927bdf50ecd4848b89a8f0961270bc1' },
    parts: BIKE_PARTS.metro,
    categories: [
      {
        id: 'frame',
        label: 'Frame',
        focus: 'frame',
        options: [
          color('frameColor', 'Frame paint', 'frame', 'paint', { channel: 'paint', factoryLabel: 'Graphite' }),
          finish('frameFinish', 'Frame finish', 'frame', ['gloss', 'satin', 'matte', 'metallic']),
          texture('frameTexture', 'Frame texture', 'frame', FRAME_TEXTURES, {
            hint: 'Carbon is tinted by the frame paint; brushed alloy is anodised in it.',
          }),
          {
            id: 'graphics',
            type: 'choice',
            label: 'Down-tube graphics',
            default: 'factory',
            choices: [
              { id: 'factory', label: 'Kit Bike decal', price: 0, effects: [] },
              { id: 'clean', label: 'Clean', price: 1500, effects: [{ part: 'frame', channel: 'decal', sameAs: 'paint' }] },
            ],
          },
          color('decalColor', 'Decal colour', 'frame', 'accent', {
            channel: 'decal',
            factoryLabel: 'Cobalt',
            visibleWhen: { graphics: 'factory' },
          }),
          color('forkColor', 'Fork colour', 'fork', 'paint', { factoryLabel: 'Gold', match: 'frameColor' }),
        ],
      },
      {
        id: 'wheels',
        label: 'Wheels',
        focus: 'rims',
        options: [
          color('rimColor', 'Rim colour', 'rims', 'metal', { factoryLabel: 'Gold & Cobalt' }),
          color('spokeColor', 'Spoke colour', 'spokes', 'metal', { factoryLabel: 'Silver' }),
        ],
      },
      {
        id: 'tyres',
        label: 'Tyres',
        focus: 'tyresGrips',
        options: [
          color('tyreColor', 'Tyre & grip colour', 'tyresGrips', 'rubber', {
            factoryLabel: 'Black',
            hint: 'Tyres and bar grips share a single material in this model.',
          }),
          texture('tyreTexture', 'Tyre & grip texture', 'tyresGrips', TYRE_TEXTURES),
        ],
      },
      {
        id: 'cockpit',
        label: 'Cockpit',
        focus: 'handlebar',
        options: [
          color('barColor', 'Handlebar colour', 'handlebar', 'metal', { factoryLabel: 'Cobalt Blue' }),
          finish('barFinish', 'Handlebar finish', 'handlebar', ['satin', 'matte', 'polished']),
          color('saddleColor', 'Saddle colour', 'saddle', 'leather', { factoryLabel: 'Black' }),
          color('seatpostColor', 'Seatpost colour', 'seatpost', 'metal', { factoryLabel: 'Black' }),
        ],
      },
      {
        id: 'drivetrain',
        label: 'Drivetrain',
        focus: 'drivetrain',
        options: [
          color('drivetrainColor', 'Drivetrain colour', 'drivetrain', 'metal', { factoryLabel: 'Bronze' }),
          finish('drivetrainFinish', 'Drivetrain finish', 'drivetrain', ['satin', 'polished']),
        ],
      },
      {
        id: 'accessories',
        label: 'Accessories',
        focus: 'kickstand',
        options: [
          { id: 'kickstand', type: 'toggle', label: 'Kickstand', part: 'kickstand', default: true, price: { off: -1200 } },
        ],
      },
    ],
  },

  zenith: {
    id: 'zenith',
    code: 'ZNT',
    name: 'Zenith 20',
    category: 'BMX',
    tagline: 'Street-tough freestyle, finished your way.',
    description: 'A 20-inch freestyle BMX with axle pegs, a rear U-brake and knurled platform pedals.',
    model: '/models/bmx.glb',
    render: '/renders/zenith.webp',
    basePrice: 42900,
    specs: [
      { label: 'Discipline', value: 'BMX' },
      { label: 'Wheels', value: '20″' },
      { label: 'Brake', value: 'Rear U-brake' },
      { label: 'Pegs', value: 'Front & rear' },
    ],
    // Model's long axis is Z with the front wheel at −Z.
    orientation: { rotationY: -Math.PI / 2 },
    credit: { title: 'BMX', author: 'stealth86', url: 'https://sketchfab.com/3d-models/bmx-c11f877c565e487b8213b4a49708f727' },
    parts: BIKE_PARTS.zenith,
    categories: [
      {
        id: 'frame',
        label: 'Frame',
        focus: 'frame',
        options: [
          color('frameColor', 'Frame paint', 'frame', 'paint', { channel: 'paint', factoryLabel: 'Candy Red' }),
          finish('frameFinish', 'Frame finish', 'frame', ['gloss', 'satin', 'matte', 'metallic']),
          texture('frameTexture', 'Frame texture', 'frame', FRAME_TEXTURES, {
            hint: 'Carbon is tinted by the frame paint; brushed alloy is anodised in it.',
          }),
          {
            id: 'graphics',
            type: 'choice',
            label: 'Tube graphics',
            default: 'factory',
            choices: [
              { id: 'factory', label: 'Zenith lettering', price: 0, effects: [] },
              { id: 'clean', label: 'Clean', price: 1500, effects: [{ part: 'frame', channel: 'decal', sameAs: 'paint' }] },
            ],
          },
          color('decalColor', 'Lettering colour', 'frame', 'accent', {
            channel: 'decal',
            factoryLabel: 'Cream',
            visibleWhen: { graphics: 'factory' },
          }),
          color('accentColor', 'Accent colour', 'accents', 'metal', { factoryLabel: 'Black' }),
        ],
      },
      {
        id: 'wheels',
        label: 'Wheels',
        focus: 'rims',
        options: [
          color('rimColor', 'Rim & hub colour', 'rims', 'metal', { factoryLabel: 'Gold' }),
          color('spokeColor', 'Spokes & hardware', 'spokes', 'metal', { factoryLabel: 'Silver' }),
        ],
      },
      {
        id: 'tyres',
        label: 'Tyres',
        focus: 'tyres',
        options: [
          color('tyreColor', 'Tyre colour', 'tyres', 'rubber', { factoryLabel: 'Black' }),
          texture('tyreTexture', 'Tyre texture', 'tyres', TYRE_TEXTURES),
        ],
      },
      {
        id: 'cockpit',
        label: 'Cockpit',
        focus: 'handlebar',
        options: [
          color('barColor', 'Handlebar colour', 'handlebar', 'metal', { factoryLabel: 'Gold' }),
          finish('barFinish', 'Handlebar finish', 'handlebar', ['satin', 'matte', 'polished']),
          color('gripColor', 'Grip colour', 'grips', 'rubber', { factoryLabel: 'Black' }),
          color('saddleColor', 'Saddle colour', 'saddle', 'leather', { factoryLabel: 'Black' }),
        ],
      },
      {
        id: 'drivetrain',
        label: 'Drivetrain',
        focus: 'drivetrain',
        options: [
          color('drivetrainColor', 'Sprocket & cranks', 'drivetrain', 'metal', { factoryLabel: 'Gunmetal' }),
          color('pedalColor', 'Pedal colour', 'pedals', 'rubber', { factoryLabel: 'Black' }),
        ],
      },
      {
        id: 'accessories',
        label: 'Accessories',
        focus: 'pegs',
        options: [
          { id: 'pegs', type: 'toggle', label: 'Axle pegs', part: 'pegs', default: true, price: { off: -1800 } },
          color('pegColor', 'Peg colour', 'pegs', 'metal', { factoryLabel: 'Dark Green', visibleWhen: { pegs: true } }),
          {
            id: 'brakeSetup',
            type: 'choice',
            label: 'Brake setup',
            default: 'ubrake',
            choices: [
              { id: 'ubrake', label: 'Rear U-brake', price: 0, effects: [] },
              { id: 'brakeless', label: 'Brakeless', price: -2200, effects: [{ part: 'brakes', visible: false }] },
            ],
          },
        ],
      },
    ],
  },
};

export const BIKE_LIST = Object.values(BIKES);
export const DEFAULT_BIKE_ID = 'corsa';

export const getBike = (id) => BIKES[id] ?? null;

const optionCache = new WeakMap();
/** Flat list of every option of a bike (in panel order), each tagged with its category id. */
export function getBikeOptions(bike) {
  if (!optionCache.has(bike)) {
    optionCache.set(bike, bike.categories.flatMap((c) => c.options.map((o) => ({ ...o, category: c.id }))));
  }
  return optionCache.get(bike);
}

/** Default configuration object `{ optionId: value }` for a bike. */
export const getDefaultConfiguration = (bike) =>
  Object.fromEntries(getBikeOptions(bike).map((o) => [o.id, o.default]));
