import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { getBike } from '../config/bikes.js';
import { selectBike, setOption, resetConfiguration, undo, redo } from '../store/configuratorSlice.js';
import { selectBikeId, selectConfiguration, selectCanUndo, selectCanRedo } from '../store/selectors.js';
import { deserializeConfiguration, serializeConfiguration } from '../utils/configurationSerializer.js';

/** Stable action callbacks for configurator UI. */
export function useConfiguratorActions() {
  const dispatch = useDispatch();
  return {
    setOption: useCallback((id, value) => dispatch(setOption(id, value)), [dispatch]),
    reset: useCallback(() => dispatch(resetConfiguration()), [dispatch]),
    undo: useCallback(() => dispatch(undo()), [dispatch]),
    redo: useCallback(() => dispatch(redo()), [dispatch]),
  };
}

export const useOptionValue = (optionId) => useSelector((s) => s.configurator.configuration[optionId]);

export function useHistoryState() {
  return { canUndo: useSelector(selectCanUndo), canRedo: useSelector(selectCanRedo) };
}

/**
 * Two-way sync between the URL (?frameColor=...) and Redux.
 * URL → store when the bike route changes (i.e. opening a shared link);
 * store → URL (replace, debounced) on every edit, so the address bar is always shareable.
 */
export function useConfigurationUrlSync(bikeId) {
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();
  const loadedBikeId = useSelector(selectBikeId);
  const configuration = useSelector(selectConfiguration);

  useEffect(() => {
    const bike = getBike(bikeId);
    if (!bike) return;
    // Read the live location: on a bike switch the new route's params are already in place.
    dispatch(selectBike(bikeId, deserializeConfiguration(bike, new URLSearchParams(window.location.search))));
  }, [bikeId, dispatch]);

  useEffect(() => {
    if (loadedBikeId !== bikeId) return;
    const bike = getBike(bikeId);
    const handle = setTimeout(() => {
      const next = serializeConfiguration(bike, configuration);
      const current = new URLSearchParams(window.location.search).toString();
      if (next !== current) setSearchParams(new URLSearchParams(next), { replace: true });
    }, 250);
    return () => clearTimeout(handle);
  }, [configuration, loadedBikeId, bikeId, setSearchParams]);

}

/** Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z and Ctrl+Y. Ignored while typing in form fields. */
export function useUndoRedoShortcuts() {
  const dispatch = useDispatch();
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.target.closest?.('input, textarea')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) dispatch(undo());
      else if ((key === 'z' && e.shiftKey) || key === 'y') dispatch(redo());
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
}
