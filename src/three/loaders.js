/**
 * Loader configuration shared by every GLB load (and preload — the settings must match so the
 * cache entry is reused).
 *
 * Meshopt geometry is decoded in Web Workers (three's decoder), keeping the multi-megabyte
 * decode off the main thread. Draco is not used by these assets.
 */
import { useGLTF } from '@react-three/drei';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

let workersStarted = false;

function extendLoader(loader) {
  if (!workersStarted && typeof Worker !== 'undefined') {
    MeshoptDecoder.useWorkers(Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1)));
    workersStarted = true;
  }
  loader.setMeshoptDecoder(MeshoptDecoder);
}

/** useGLTF with worker-based meshopt decoding. */
export const useBikeGLTF = (url) => useGLTF(url, false, false, extendLoader);

export const preloadBikeGLTF = (url) => useGLTF.preload(url, false, false, extendLoader);

export const clearBikeGLTF = (url) => useGLTF.clear(url);
