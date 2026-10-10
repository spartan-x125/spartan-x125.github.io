import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { importLibrary } from './import-wallpapers.mjs';

sharp.cache(false);
const temporaryRoot = resolve(tmpdir()), scratch = await mkdtemp(join(temporaryRoot, 'blog-wallpaper-test-'));
const source = join(scratch, 'source'), destination = join(scratch, 'destination');
const portraitSource = join(scratch, 'portrait-source'), portrait = join(scratch, 'portrait');
const image = (width, height, color = '#456789') => sharp({ create: { width, height, channels: 3, background: color } });
const pixels = async file => sharp(file, { animated: true }).rotate().ensureAlpha().raw().toBuffer();
const snapshot = async folder => Object.fromEntries(await Promise.all((await readdir(folder, { withFileTypes: true }))
  .filter(entry => entry.isFile()).map(async entry => [entry.name, (await readFile(join(folder, entry.name))).toString('base64')])));
try {
  for (const directory of [source, destination, portraitSource, portrait]) await mkdir(directory);
  await image(384, 216).jpeg().toFile(join(source, 'new #雪.jpg'));
  await image(384, 216, '#abcdef').png().toFile(join(source, 'new #雪.png'));
  await image(48, 32).webp().toFile(join(source, 'small.webp'));
  await image(64, 40).avif().toFile(join(source, 'small.avif'));
  const frames = Buffer.concat([Buffer.alloc(40 * 40 * 3, Buffer.from([255, 0, 0])), Buffer.alloc(40 * 40 * 3, Buffer.from([0, 0, 255]))]);
  await sharp(frames, { raw: { width: 40, height: 80, channels: 3, pageHeight: 40 } }).gif({ delay: [80, 120], loop: 0 }).toFile(join(source, 'animated.gif'));
  await image(64, 40).jpeg().toFile(join(source, 'existing.jpg'));
  await image(32, 20, '#fedcba').jpeg().toFile(join(destination, 'existing.jpg'));
  await writeFile(join(source, 'broken.jpg'), 'not an image');
  await writeFile(join(source, 'notes.txt'), 'ignored');
  await mkdir(join(source, 'nested.jpg'));
  await image(40, 20).jpeg().toFile(join(source, 'nested.jpg', 'ignored.jpg'));
  await image(200, 100).withMetadata({ orientation: 6 }).jpeg().toFile(join(portraitSource, 'rotated.jpg'));
  await image(50, 100).webp().toFile(join(portrait, 'rotated.webp'));
  const originals = await snapshot(source), state = {}, portraitState = {};
  const options = { source, destination, state, log: () => {} };
  const imported = await importLibrary(options);
  assert.deepEqual([imported.added, imported.updated, imported.skipped], [5, 1, 0]);
  assert.deepEqual(imported.failed.map(entry => entry.file), ['broken.jpg']);
  assert.ok(!(await readdir(destination)).includes('existing.jpg'));
  for (const [name, entry] of Object.entries(state)) {
    const originalName = (await readdir(source)).find(file => file.toLocaleLowerCase() === name);
    assert.ok(entry.target.endsWith('.webp'));
    assert.deepEqual(await pixels(join(destination, entry.target)), await pixels(join(source, originalName)), `${originalName}: decoded pixels changed`);
  }
  const animated = await sharp(join(destination, 'animated.webp'), { animated: true }).metadata();
  assert.equal(animated.pages, 2); assert.equal(animated.pageHeight, 40); assert.deepEqual(animated.delay, [80, 120]);
  const mobile = await importLibrary({ source: portraitSource, destination: portrait, state: portraitState, log: () => {} });
  assert.equal(mobile.updated, 1);
  const rotated = await sharp(join(portrait, 'rotated.webp')).metadata();
  assert.deepEqual([rotated.width, rotated.height], [100, 200]);
  assert.deepEqual(await pixels(join(portrait, 'rotated.webp')), await pixels(join(portraitSource, 'rotated.jpg')));
  assert.deepEqual(await snapshot(source), originals);
  const beforeRepeat = await snapshot(destination), repeated = await importLibrary(options);
  assert.deepEqual([repeated.added, repeated.updated, repeated.skipped, repeated.failed.length], [0, 0, 6, 1]);
  assert.deepEqual(await snapshot(destination), beforeRepeat);
  await writeFile(join(destination, state['small.avif'].target), 'tampered image');
  assert.equal((await importLibrary(options)).updated, 1);
  await assert.rejects(importLibrary({ ...options, source: join(scratch, 'missing') }), { code: 'ENOENT' });
  await assert.rejects(importLibrary({ ...options, state: { ...state, 'animated.gif': { target: '../escaped.webp' } } }), /Invalid wallpaper destination/);
  console.log('Verified lossless decoded pixels, full dimensions, old-file migration, animation, EXIF orientation, separate libraries, repeat imports, name collisions, damaged-output repair and safe destinations.');
} finally {
  assert.equal(dirname(resolve(scratch)), temporaryRoot); assert.ok(basename(scratch).startsWith('blog-wallpaper-test-'));
  await rm(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
