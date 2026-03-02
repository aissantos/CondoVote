// scripts/generate-pwa-icons.mjs
// Gera ícones PNG a partir dos SVGs para conformidade com critérios maskable do Chrome/Android.
// Executar com: node scripts/generate-pwa-icons.mjs

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

await sharp(path.join(publicDir, 'pwa-512x512.svg'))
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, 'pwa-512x512.png'));

await sharp(path.join(publicDir, 'pwa-512x512.svg'))
  .resize(192, 192)
  .png()
  .toFile(path.join(publicDir, 'pwa-192x192.png'));

console.log('✅ PWA icons generated: pwa-192x192.png, pwa-512x512.png');
