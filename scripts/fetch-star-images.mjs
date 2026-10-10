import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const catalogue = JSON.parse(await readFile(new URL('../public/stars.json', import.meta.url), 'utf8'));
await mkdir(new URL('../public/stars/', import.meta.url), { recursive: true });
for (const star of catalogue) {
  if (process.argv.length > 2 && !process.argv.slice(2).includes(star.id)) continue;
  const page = await fetch(star.photoSource || star.source, { signal: AbortSignal.timeout(30000) });
  if (!page.ok) throw new Error(`${star.id}: source HTTP ${page.status}`);
  const html = await page.text();
  const tag = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0];
  const imageURL = tag?.match(/content=["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;', '&');
  if (!imageURL || !/(^|\.)nasa\.gov$/.test(new URL(imageURL).hostname)) throw new Error(`${star.id}: no NASA image found`);
  const image = await fetch(imageURL, { signal: AbortSignal.timeout(30000) });
  if (!image.ok) throw new Error(`${star.id}: image HTTP ${image.status}`);
  await sharp(Buffer.from(await image.arrayBuffer())).rotate().resize({ width: 1440, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 }).toFile(fileURLToPath(new URL(`../public${star.image}`, import.meta.url)));
  star.imageSource = imageURL;
  console.log(`${star.id}: ${imageURL}`);
}
await writeFile(new URL('../public/stars.json', import.meta.url), JSON.stringify(catalogue, null, 2) + '\n');
