import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  base: './',
  build: {
      outDir: 'dist',
      emptyOutDir: true
  },
  server: {
      port: 5173
  }
});
