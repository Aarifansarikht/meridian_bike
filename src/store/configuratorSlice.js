/**
 * Configurator state — serializable data only. Three.js objects never enter the store.
 *
 * {
 *   bikeId: 'metro',
 *   configuration: { frameColor: '#1f4a36', frameFinish: 'matte', kickstand: false, ... },
 *   past: [...], future: [...],       // undo / redo stacks of configuration snapshots
 *   unavailableParts: ['kickstand'],  // parts the loaded GLB could not provide
 * }
 */
import { createSlice } from '@reduxjs/toolkit';
import { getBike, getBikeOptions, getDefaultConfiguration } from '../config/bikes.js';
import { isValidOptionValue } from '../utils/configurationSerializer.js';

const HISTORY_LIMIT = 60;
const COALESCE_MS = 900; // rapid edits of the same option (e.g. dragging a colour picker) = one undo step

const initialState = {
  bikeId: null,
  configuration: {},
  past: [],
  future: [],
  lastEdit: null,
  unavailableParts: [],
};

const pushHistory = (state) => {
  // Snapshot, not the draft itself — the draft is mutated right after this call.
  state.past.push({ ...state.configuration });
  if (state.past.length > HISTORY_LIMIT) state.past.shift();
  state.future = [];
};

const configuratorSlice = createSlice({
  name: 'configurator',
  initialState,
  reducers: {
    /** Switches bike; optional `configuration` (e.g. parsed from a share URL) is merged over defaults. */
    selectBike: {
      reducer(state, { payload: { bikeId, configuration } }) {
        const bike = getBike(bikeId);
        if (!bike) return;
        state.bikeId = bikeId;
        state.configuration = { ...getDefaultConfiguration(bike), ...(configuration ?? {}) };
        state.past = [];
        state.future = [];
        state.lastEdit = null;
        state.unavailableParts = [];
      },
      prepare: (bikeId, configuration) => ({ payload: { bikeId, configuration } }),
    },

    setOption: {
      reducer(state, { payload: { optionId, value, at } }) {
        const bike = getBike(state.bikeId);
        const option = bike && getBikeOptions(bike).find((o) => o.id === optionId);
        if (!option || !isValidOptionValue(option, value)) return;
        if (state.configuration[optionId] === value) return;
        const coalesce = state.lastEdit?.optionId === optionId && at - state.lastEdit.at < COALESCE_MS;
        if (!coalesce) pushHistory(state);
        state.configuration[optionId] = value;
        state.lastEdit = { optionId, at };
      },
      prepare: (optionId, value) => ({ payload: { optionId, value, at: Date.now() } }),
    },

    resetConfiguration(state) {
      const bike = getBike(state.bikeId);
      if (!bike) return;
      pushHistory(state);
      state.configuration = getDefaultConfiguration(bike);
      state.lastEdit = null;
    },

    undo(state) {
      if (!state.past.length) return;
      state.future.push(state.configuration);
      state.configuration = state.past.pop();
      state.lastEdit = null;
    },

    redo(state) {
      if (!state.future.length) return;
      state.past.push(state.configuration);
      state.configuration = state.future.pop();
      state.lastEdit = null;
    },

    setUnavailableParts(state, { payload }) {
      state.unavailableParts = payload;
    },
  },
});

export const { selectBike, setOption, resetConfiguration, undo, redo, setUnavailableParts } = configuratorSlice.actions;

/* Readable, intention-revealing action helpers built on the generic `setOption`. */
export const setFrameColor = (hex) => setOption('frameColor', hex);
export const setFrameMaterial = (finish) => setOption('frameFinish', finish);
export const setWheelColor = (hex) => setOption('rimColor', hex); // metro & zenith
export const setTireColor = (hex) => setOption('tyreColor', hex);
export const setSeatColor = (hex) => setOption('saddleColor', hex);
export const setHandlebarColor = (hex) => setOption('barColor', hex);

export default configuratorSlice.reducer;
