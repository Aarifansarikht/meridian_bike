import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js alone is ~1 MB minified (≈350 kB gzipped); don't warn about it.
  build: { chunkSizeWarningLimit: 1500 },
});
