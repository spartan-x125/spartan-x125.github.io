import sharp from 'sharp';
import { readdir, mkdir, access, readFile, writeFile, open, unlink, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { constants, existsSync } from 'node:fs';
import { resolve, join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { syncBackgrounds } from './sync-assets.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

const hash = buffer => createHash('sha256').update(buffer).digest('hex');
export async function importLibrary({ source, destination, state = {}, log = console.log }) {
  const entries = await readdir(source, { withFileTypes: true });
  await mkdir(destination, { recursive: true });
  const existing = (await readdir(destination, { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name);
  const images = entries.filter(entry => entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase()))
    .map(entry => entry.name).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const result = { added: 0, updated: 0, skipped: 0, failed: [] };
  const safeTarget = name => {
    const target = resolve(destination, name);
    if (dirname(target) !== resolve(destination) || basename(name) !== name) throw new Error('Invalid wallpaper destination.');
    return target;
  };

  for (const file of images) {
    const key = file.toLocaleLowerCase(), stem = basename(file, extname(file));
    const collision = images.some(other => other !== file && basename(other, extname(other)).toLocaleLowerCase() === stem.toLocaleLowerCase());
    const proposed = collision ? `${file}.webp` : `${stem}.webp`;
    const targetName = state[key]?.target || proposed;
    if (extname(targetName).toLowerCase() !== '.webp') throw new Error('Invalid wallpaper destination.');
    const target = safeTarget(targetName), temporary = safeTarget(`.${randomUUID()}.tmp`);
    const legacyNames = [file, `${file}.webp`];
    let created = false;
    try {
      const original = await readFile(join(source, file)), sourceHash = hash(original);
      if (state[key]?.mode === 'lossless-webp-v1' && state[key].sourceHash === sourceHash && existsSync(target) && hash(await readFile(target)) === state[key].outputHash) {
        result.skipped++; continue;
      }
      const buffer = await sharp(original, { animated: true }).rotate().keepIccProfile()
        .webp({ lossless: true, effort: 4 }).toBuffer();
      const handle = await open(temporary, 'wx'); created = true;
      try { await handle.writeFile(buffer); } finally { await handle.close(); }
      const replacing = existsSync(target) || existing.some(name => legacyNames.includes(name));
      await rename(temporary, target); created = false;
      for (const name of existing.filter(name => legacyNames.includes(name) && name !== targetName && !images.some(other => other !== file && state[other.toLocaleLowerCase()]?.target === name))) {
        await unlink(safeTarget(name));
      }
      state[key] = { target: targetName, mode: 'lossless-webp-v1', sourceHash, outputHash: hash(buffer) };
      result[replacing ? 'updated' : 'added']++;
      log(`  + ${file} → ${targetName}`);
    } catch (error) {
      if (created) await unlink(temporary);
      result.failed.push({ file, message: error.message });
      log(`  ! ${file}: ${error.message}`);
    }
  }
  return result;
}

function buildSite() {
  const options = { cwd: project, stdio: 'inherit' };
  const npmCLI = process.env.npm_execpath;
  const child = npmCLI && existsSync(npmCLI)
    ? spawnSync(process.execPath, [npmCLI, 'run', 'build'], options)
    : process.platform === 'win32'
      ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd run build'], options)
      : spawnSync('npm', ['run', 'build'], options);
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error('网站构建失败，请查看上方错误信息。导入成功的图片已保留，修复后可以再次运行。');
}

async function main() {
  const libraries = [
    { key: 'desktop', label: '电脑壁纸', source: 'C:\\img', destination: join(project, 'public/backgrounds') },
    { key: 'mobile', label: '手机壁纸', source: 'C:\\竖屏img', destination: join(project, 'public/backgrounds/mobile') },
  ];
  for (const library of libraries) await access(library.source, constants.R_OK);
  const stateFile = join(project, 'scripts/wallpaper-import-state.json');
  const state = existsSync(stateFile) ? JSON.parse(await readFile(stateFile, 'utf8')) : {};
  let failures = 0;
  for (const library of libraries) {
    console.log(`\n${library.label}：${library.source}`);
    const result = await importLibrary({ ...library, state: state[library.key] ||= {} });
    await writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');
    failures += result.failed.length;
    console.log(`新增 ${result.added} 张，转换 ${result.updated} 张，跳过 ${result.skipped} 张，失败 ${result.failed.length} 张。`);
  }
  const added = syncBackgrounds();
  console.log(`\n壁纸列表已更新：加入 ${added} 张。正在构建网站…\n`);
  buildSite();
  if (failures) throw new Error(`${failures} 张图片导入失败；其余图片与网站发布文件已更新。修复失败图片后再次运行即可重试。`);
  console.log('\n壁纸和 docs 发布文件已更新。现在只需提交并推送 Git 改动。');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`\n更新失败：${error.message}`); process.exitCode = 1; });
}
