import { createSelector } from '@reduxjs/toolkit';
import { getBike } from '../config/bikes.js';
import { activeOptions, buildSummary, computePrice } from '../utils/formatConfiguration.js';
import { configurationId, buildShareUrl } from '../utils/configurationSerializer.js';
import { resolvePartStates } from '../utils/resolvePartStates.js';

const slice = (state) => state.configurator;

export const selectBikeId = (state) => slice(state).bikeId;
export const selectConfiguration = (state) => slice(state).configuration;
export const selectUnavailableParts = (state) => slice(state).unavailableParts;
export const selectCanUndo = (state) => slice(state).past.length > 0;
export const selectCanRedo = (state) => slice(state).future.length > 0;
export const selectOptionValue = (state, optionId) => slice(state).configuration[optionId];

export const selectCurrentBike = createSelector([selectBikeId], (id) => (id ? getBike(id) : null));

/** Alias kept for readability in share/summary code. */
export const selectFullConfiguration = selectConfiguration;

/** Categories with only the options that are visible and backed by meshes in the loaded GLB. */
export const selectVisibleCategories = createSelector(
  [selectCurrentBike, selectConfiguration, selectUnavailableParts],
  (bike, config, unavailable) => {
    if (!bike) return [];
    const active = new Set(activeOptions(bike, config, unavailable).map((o) => o.id));
    return bike.categories
      .map((c) => ({ ...c, options: c.options.filter((o) => active.has(o.id)) }))
      .filter((c) => c.options.length > 0);
  },
);

/** `{ optionId: value }` for one category, e.g. selectCategoryConfiguration(state, 'frame'). */
export const selectCategoryConfiguration = createSelector(
  [selectCurrentBike, selectConfiguration, (_, categoryId) => categoryId],
  (bike, config, categoryId) => {
    const cat = bike?.categories.find((c) => c.id === categoryId);
    return cat ? Object.fromEntries(cat.options.map((o) => [o.id, config[o.id]])) : {};
  },
);
export const selectFrameConfiguration = (state) => selectCategoryConfiguration(state, 'frame');
export const selectWheelConfiguration = (state) => selectCategoryConfiguration(state, 'wheels');

export const selectPartStates = createSelector([selectCurrentBike, selectConfiguration], (bike, config) =>
  bike ? resolvePartStates(bike, config) : {},
);

export const selectPrice = createSelector(
  [selectCurrentBike, selectConfiguration, selectUnavailableParts],
  (bike, config, unavailable) => (bike ? computePrice(bike, config, unavailable) : 0),
);

export const selectConfigurationSummary = createSelector(
  [selectCurrentBike, selectConfiguration, selectUnavailableParts],
  (bike, config, unavailable) => (bike ? buildSummary(bike, config, unavailable) : null),
);

export const selectConfigurationId = createSelector([selectCurrentBike, selectConfiguration], (bike, config) =>
  bike ? configurationId(bike, config) : '',
);

export const selectShareUrl = createSelector([selectCurrentBike, selectConfiguration], (bike, config) =>
  bike ? buildShareUrl(bike, config) : '',
);
