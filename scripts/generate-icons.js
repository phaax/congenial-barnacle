/**
 * Generates PWA icons from public/icon.svg using sharp.
 * Run with: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192, padding: 0.1 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.1 },
];

for (const icon of icons) {
  const innerSize = icon.padding
    ? Math.round(icon.size * (1 - icon.padding * 2))
    : icon.size;
  const offset = icon.padding ? Math.round(icon.size * icon.padding) : 0;

  let pipeline = sharp(svgBuffer).resize(innerSize, innerSize);

  if (icon.padding) {
    // Maskable icons: add safe-zone padding with black background
    pipeline = pipeline.extend({
      top: offset,
      bottom: offset,
      left: offset,
      right: offset,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    });
  }

  const outPath = join(root, 'public', icon.name);
  await pipeline.png().toFile(outPath);
  console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
}

console.log('All icons generated.');
