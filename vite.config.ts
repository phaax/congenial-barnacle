import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Compute a version string similar to NerdBank GitVersioning:
 *   {base}.{height}+g{hash}         on a clean tree
 *   {base}.{height}+g{hash}-dirty   with uncommitted changes
 *
 * - base:   "version" field from version.json (e.g. "0.1")
 * - height: total number of commits reachable from HEAD
 * - hash:   7-char abbreviated commit hash
 */
function computeVersion(): string {
  const { version: base } = JSON.parse(readFileSync('version.json', 'utf8')) as { version: string };
  try {
    const height = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    const hash   = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const dirty  = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
    return `${base}.${height}+g${hash}${dirty ? '-dirty' : ''}`;
  } catch {
    return base;
  }
}

export default defineConfig({
  // Relative base so the game works when served from a GitHub Pages subfolder
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // Replaced at build time with the computed git version string.
    // Use __APP_VERSION__ anywhere in TypeScript source to get the value.
    __APP_VERSION__: JSON.stringify(computeVersion()),
  },
  plugins: [
    VitePWA({
      // 'autoUpdate' means: when a new service worker is detected, it skips
      // the waiting phase and activates immediately, then reloads the page.
      // No manual cache clearing needed after deployments.
      registerType: 'autoUpdate',

      // Inline the service worker registration so it works with the
      // relative base path used for GitHub Pages subfolder deployments.
      injectRegister: 'inline',

      // Workbox options: precache everything Vite emits plus the audio assets
      workbox: {
        // Precache all build output and static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,rad}'],
        // Ensure old caches are cleaned up when the SW updates
        cleanupOutdatedCaches: true,
        // Use network-first for the HTML shell so a new deployment is always
        // picked up on the next navigation, but fall back to cache offline.
        runtimeCaching: [
          {
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },

      manifest: {
        name: 'Chronicles of the Realm',
        short_name: 'Chronicles',
        description: 'A retro DOS-style terminal RPG — playable offline',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
