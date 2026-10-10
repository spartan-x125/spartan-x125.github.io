import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source || !statSync(source).isDirectory()) throw new Error('Provide the source wallpaper directory.');
const destination = fileURLToPath(new URL('../public/backgrounds/mobile/', import.meta.url));
mkdirSync(destination, { recursive: true });
const images = readdirSync(source).filter(file => /\.(png|jpe?g|webp)$/i.test(file)).sort();
for (const file of images) {
  await sharp(join(resolve(source), file)).rotate().resize({ width: 1440, height: 2560, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 }).toFile(join(destination, `${basename(file, extname(file))}.webp`));
}
console.log(`Imported ${images.length} mobile wallpapers into public/backgrounds/mobile.`);
