import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: [
      'react-photo-sphere-viewer',
      '@photo-sphere-viewer/core',
      '@photo-sphere-viewer/markers-plugin',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});