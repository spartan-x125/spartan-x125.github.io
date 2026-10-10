import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import sharp from 'sharp';

sharp.cache(false); sharp.concurrency(1);
const root = fileURLToPath(new URL('../', import.meta.url));
const state = JSON.parse(await readFile(join(root, 'scripts/wallpaper-import-state.json'), 'utf8'));
const data = await readFile(join(root, 'src/data/backgroundImages.ts'), 'utf8');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
for (const [key, source, destination] of [ ['desktop', 'C:\\img', 'backgrounds'], ['mobile', 'C:\\竖屏img', 'backgrounds/mobile'] ]) {
  const files = (await readdir(join(root, 'public', destination), { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name);
  assert.ok(files.every(file => extname(file) === '.webp'));
  assert.equal(files.length, Object.keys(state[key]).length);
  for (const [name, record] of Object.entries(state[key])) {
    const originalName = (await readdir(source)).find(file => file.toLocaleLowerCase() === name);
    const original = await readFile(join(source, originalName)), output = await readFile(join(root, 'public', destination, record.target));
    assert.equal(hash(original), record.sourceHash, `${originalName}: original source changed`);
    assert.equal(hash(output), record.outputHash);
    assert.deepEqual(await readFile(join(root, 'docs', destination, record.target)), output);
    assert.ok(data.includes(`/${destination}/${encodeURIComponent(record.target)}`));
    const expected = hash(await sharp(original, { animated: true }).rotate().ensureAlpha().raw().toBuffer());
    assert.equal(hash(await sharp(output, { animated: true }).ensureAlpha().raw().toBuffer()), expected, `${originalName}: decoded pixels differ`);
    const actual = await sharp(output).metadata(), before = await sharp(original).metadata();
    assert.equal(actual.width * actual.height, before.width * before.height, `${originalName}: dimensions changed`);
  }
  console.log(`Verified ${files.length} ${key} wallpapers: full-resolution lossless pixels, unchanged sources, live URLs and matching published assets.`);
}
