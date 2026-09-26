import { configureStore } from '@reduxjs/toolkit';
import configuratorReducer from './configuratorSlice.js';

export const store = configureStore({
  reducer: { configurator: configuratorReducer },
});
