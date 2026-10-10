import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const musicDir = join(root, "public", "music");
const backgroundsDir = join(root, "public", "backgrounds");
const musicDataFile = join(root, "src", "data", "musicTracks.ts");
const backgroundsDataFile = join(root, "src", "data", "backgroundImages.ts");

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function readExistingTracks() {
  const source = readFileSync(musicDataFile, "utf8");
  const tracks = [];
  const objectPattern = /\{[\s\S]*?\}/g;
  const valuePattern = (key, block) => {
    const match = block.match(new RegExp(`${key}:\\s*"([^"]*)"`));
    return match?.[1] || "";
  };

  for (const match of source.matchAll(objectPattern)) {
    const block = match[0];
    const src = valuePattern("src", block);
    if (!src) continue;
    tracks.push({
      title: valuePattern("title", block),
      artist: valuePattern("artist", block),
      src,
      cover: valuePattern("cover", block) || "/avatar/avatar.jpg",
    });
  }

  return tracks;
}

function parseTrackName(fileName) {
  const name = basename(fileName, extname(fileName));
  const parts = name.split(" - ");
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim() || "Unknown",
      title: parts.slice(1).join(" - ").trim() || name,
    };
  }
  return { artist: "Unknown", title: name };
}

function findCover(fileName, files) {
  const base = basename(fileName, extname(fileName));
  const cover = files.find((item) => {
    const extension = extname(item).toLowerCase();
    return imageExtensions.has(extension) && basename(item, extension) === base;
  });
  return cover ? `/music/${cover}` : "/avatar/avatar.jpg";
}

function formatTracks(tracks) {
  const body = tracks
    .map(
      (track) => `  {
    title: ${JSON.stringify(track.title)},
    artist: ${JSON.stringify(track.artist)},
    src: ${JSON.stringify(track.src)},
    cover: ${JSON.stringify(track.cover)},
  },`,
    )
    .join("\n");

  return `export const musicTracks = [
${body}
];
`;
}

function syncMusicTracks() {
  const files = readdirSync(musicDir);
  const existingTracks = readExistingTracks();
  const knownSources = new Set(existingTracks.map((track) => track.src));
  const nextTracks = [...existingTracks];

  files
    .filter((file) => extname(file).toLowerCase() === ".mp3")
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .forEach((file) => {
      const src = `/music/${file}`;
      if (knownSources.has(src)) return;
      const parsed = parseTrackName(file);
      nextTracks.push({
        title: parsed.title,
        artist: parsed.artist,
        src,
        cover: findCover(file, files),
      });
    });

  writeFileSync(musicDataFile, formatTracks(nextTracks), "utf8");
  return nextTracks.length - existingTracks.length;
}

function readExistingBackgrounds(name = 'backgroundImages') {
  const source = readFileSync(backgroundsDataFile, "utf8");
  const body = source.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`))?.[1] || '';
  return Array.from(body.matchAll(/"([^"]+)"/g), (match) => match[1]);
}

function formatBackgrounds(images, name = 'backgroundImages') {
  const body = images.map((image) => `  ${JSON.stringify(image)},`).join("\n");
  return `export const ${name} = [
${body}
];
`;
}

export function syncBackgrounds() {
  let added = 0;
  const groups = [['backgroundImages', backgroundsDir, '/backgrounds'], ['mobileBackgroundImages', join(backgroundsDir, 'mobile'), '/backgrounds/mobile']];
  const source = groups.map(([name, directory, prefix]) => {
    const files = readdirSync(directory).filter(file => imageExtensions.has(extname(file).toLowerCase()));
    const available = new Set(files.map(file => `${prefix}/${encodeURIComponent(file)}`));
    const existing = readExistingBackgrounds(name), next = [];
    existing.forEach(url => {
      const replacement = url.replace(/\.(?:jpe?g|png|gif|avif)(?=$)/i, '.webp');
      const retained = available.has(url) ? url : available.has(replacement) ? replacement : null;
      if (retained && !next.includes(retained)) next.push(retained);
    });
    files
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')).forEach(file => {
        const url = `${prefix}/${encodeURIComponent(file)}`;
        if (!next.includes(url)) { next.push(url); added++; }
      });
    return formatBackgrounds(next, name);
  }).join('\n');
  writeFileSync(backgroundsDataFile, source, 'utf8');
  return added;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const addedTracks = syncMusicTracks();
  const addedBackgrounds = syncBackgrounds();
  console.log(`Synced assets: ${addedTracks} music track(s), ${addedBackgrounds} background image(s) added.`);
}
