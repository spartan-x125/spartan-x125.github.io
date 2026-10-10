(() => {
  'use strict';
  const modes = ['none', 'fade', 'slide', 'wipe', 'zoom', 'random'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const images = () => JSON.parse(document.body.dataset[mobile.matches ? 'backgroundsMobile' : 'backgrounds'] || '[]');
  const storageKey = () => mobile.matches ? 'blog-background-state-mobile' : 'blog-background-state';
  const readState = () => { try { return JSON.parse(localStorage.getItem(storageKey()) || '{}'); } catch { return {}; } };
  const saveState = state => { try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch {} };
  const currentIndex = () => {
    const source = document.querySelector('.background-layer:not(.wallpaper-transition-surface)')?.style.backgroundImage || '';
    const index = images().findIndex(url => source.includes(url));
    return index >= 0 ? index : readState().index ?? 0;
  };
  const motion = () => { try { return JSON.parse(localStorage.getItem('desktop-settings') || '{}').wallpaperMotion || 'fade'; } catch { return 'fade'; } };
  let token = 0, surface, animation;
  const clear = () => {
    animation?.cancel(); animation = null;
    surface?.remove(); surface = null;
    const layer = document.querySelector('.background-layer:not(.wallpaper-transition-surface)');
    if (layer) layer.style.visibility = '';
  };
  async function show(source, { mode = 'fade', initial = false } = {}) {
    const layer = document.querySelector('.background-layer:not(.wallpaper-transition-surface)');
    if (!layer) return false;
    const request = ++token;
    const image = new Image(); image.src = source;
    try { await image.decode(); } catch { return false; }
    if (request !== token) return false;
    const previous = layer.style.backgroundImage;
    clear();
    const next = `url("${source}")`;
    layer.style.backgroundImage = next;
    document.documentElement.style.setProperty('--active-background-image', next);
    if (!modes.includes(mode)) mode = 'fade';
    if (mode === 'random') mode = modes.slice(1, -1)[Math.floor(Math.random() * 4)];
    if (initial || reduced.matches || mode === 'none' || !previous || previous === next) return true;
    surface = document.createElement('div');
    surface.className = 'background-layer wallpaper-transition-surface';
    surface.setAttribute('aria-hidden', 'true'); surface.dataset.animation = mode;
    const old = document.createElement('div'), incoming = document.createElement('div');
    old.style.backgroundImage = previous; incoming.style.backgroundImage = next;
    surface.append(old, incoming); layer.after(surface); layer.style.visibility = 'hidden';
    const frames = {
      fade: [{ opacity: 0 }, { opacity: 1 }],
      slide: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
      wipe: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      zoom: [{ opacity: 0, transform: 'scale(1.12)' }, { opacity: 1, transform: 'scale(1)' }],
    };
    animation = incoming.animate(frames[mode], { duration: mode === 'slide' ? 750 : 650, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    animation.finished.then(() => { if (request === token) clear(); }).catch(() => {});
    return true;
  }
  reduced.addEventListener('change', () => { if (reduced.matches) clear(); });
  async function select(index, { mode = motion(), initial = false } = {}) {
    const source = images()[index], key = storageKey();
    if (!source) return false;
    const changed = await show(source, { mode, initial });
    if (changed && key === storageKey()) saveState({ index, changedAt: Date.now() });
    return changed;
  }
  function randomIndex() {
    const choices = images().map((_, i) => i).filter(i => i !== currentIndex());
    return choices.length ? choices[Math.floor(Math.random() * choices.length)] : 0;
  }
  async function restore(poolChanged = false) {
    const saved = readState(), list = images();
    if (!list.length) return;
    const valid = Number.isInteger(saved.index) && list[saved.index] && Date.now() - saved.changedAt < 10 * 60 * 1000;
    const index = valid ? saved.index : randomIndex();
    if (!valid) saveState({ index, changedAt: Date.now() });
    document.documentElement.dataset.wallpaperPool = mobile.matches ? 'mobile' : 'desktop';
    const changed = await show(list[index], { mode: motion(), initial: true });
    if (changed) document.dispatchEvent(new CustomEvent('blog-wallpaper-pool', { detail: { poolChanged } }));
  }
  let initialized = false;
  function init() {
    if (initialized || document.documentElement.dataset.embedded === 'true') return;
    initialized = true; restore();
    const restartTimer = () => {
      clearInterval(window.__blogBackgroundTimer);
      window.__blogBackgroundTimer = setInterval(() => select(randomIndex()), 10 * 60 * 1000);
    };
    restartTimer();
    mobile.addEventListener('change', () => { restore(true); restartTimer(); });
  }
  window.BlogWallpaper = { show, select, init, modes, get images() { return images(); }, get currentIndex() { return currentIndex(); } };
})();
