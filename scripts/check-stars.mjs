import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const code = readFileSync(new URL('../public/stars.js', import.meta.url), 'utf8');
const catalogue = JSON.parse(readFileSync(new URL('../public/stars.json', import.meta.url), 'utf8'));
const makeContext = fetch => {
  const window = {};
  const context = { window, fetch, URL, URLSearchParams, AbortSignal, setTimeout, clearTimeout,
    Math: { random: () => 0, floor: Math.floor, min: Math.min, ceil: Math.ceil },
    DOMParser: class { parseFromString(html) { return { body: { textContent: html.replace(/<[^>]+>/g, '') } }; } },
    Image: class { set src(value) { if (value) queueMicrotask(() => this.onload()); } },
  };
  runInNewContext(code, context); return window.BlogStars;
};
const observation = id => ({ data: [{ media_type: 'image', nasa_id: id, title: `Galaxy ${id}`, description: `<p>A telescope observation of a distant galaxy. Credit: NASA/ESA.</p>`, date_created: '2024-02-15', center: 'GSFC' }], links: [{ rel: 'preview', href: `https://images-assets.nasa.gov/image/${id}/${id}~thumb.jpg` }] });
let calls = 0;
const service = makeContext(async url => {
  assert.equal(new URL(url).hostname, 'images-api.nasa.gov');
  if (new URL(url).pathname.startsWith('/asset/')) { const id = new URL(url).pathname.split('/').at(-1); return { ok: true, json: async () => ({ collection: { items: [ { href: `https://images-assets.nasa.gov/image/${id}/${id}~orig.jpg` }, { href: `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg` } ] } }) }; }
  calls++;
  return { ok: true, json: async () => ({ collection: { metadata: { total_hits: 2 }, items: [observation('alpha'), observation('beta'), { ...observation('unsafe'), links: [{ rel: 'preview', href: 'https://example.com/image.jpg' }] }, { ...observation('drawing'), data: [{ ...observation('drawing').data[0], description: "An artist's impression of a galaxy." }] }] } }) };
});
const first = await service.next(), second = await service.next();
assert.notEqual(first.id, second.id);
assert.equal(calls, 1, 'A cached search must avoid another NASA request');
assert.equal(first.source, 'https://images.nasa.gov/details/alpha');
assert.match(first.image, /~medium\.jpg$/); assert.match(first.imageSource, /~orig\.jpg$/);
assert.equal(first.facts['影像归档'], '2024-02-15');
assert.match(first.credit, /NASA\/ESA/); assert.ok(!first.description.includes('<p>'));
assert.ok(!['unsafe', 'drawing'].includes(first.id));
let fallbackCalls = 0;
const fallback = makeContext(async url => {
  if (url === '/stars.json') { fallbackCalls++; return { ok: true, json: async () => catalogue }; }
  throw new Error('Offline');
});
const offline = await fallback.next(), another = await fallback.next();
assert.ok(offline.image.startsWith('/stars/')); assert.notEqual(offline.id, another.id); assert.equal(fallbackCalls, 1);
for (const star of catalogue) {
  assert.ok(readFileSync(new URL(`../public${star.image}`, import.meta.url)).length > 1000);
  assert.equal(new URL(star.source).hostname, 'science.nasa.gov');
}
if (process.argv.includes('--live')) {
  const live = makeContext(async url => url === '/stars.json' ? { ok: true, json: async () => catalogue } : fetch(url));
  const star = await live.next();
  assert.ok(star.source.startsWith('https://images.nasa.gov/details/'), 'Live NASA request fell back to the local catalogue');
  const response = await fetch(star.image, { signal: AbortSignal.timeout(10000) });
  assert.ok(response.ok); assert.match(response.headers.get('content-type'), /^image\//);
  console.log(`Live NASA observation verified: ${star.id}`);
}
console.log('Verified NASA observation filtering, source/credit links, original-language descriptions, search caching, non-repeated selections and local offline fallback.');
