import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the game works when served from a GitHub Pages subfolder
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
