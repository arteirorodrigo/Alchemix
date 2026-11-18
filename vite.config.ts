import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.csv'],
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
});
