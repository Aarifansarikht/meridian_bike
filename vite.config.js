import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep three.js / R3F in their own long-cacheable chunks, loaded only by 3D routes.
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three') || id.includes('three-stdlib') || id.includes('camera-controls')) return 'r3f';
          return undefined;
        },
      },
    },
  },
});
