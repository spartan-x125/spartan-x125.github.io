(() => {
  'use strict';
  const root = document.documentElement;
  const embedded = root.dataset.embedded === 'true';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, label, action) => {
    const node = make('button', '', text);
    node.type = 'button';
    node.title = label;
    node.setAttribute('aria-label', label);
    if (action) node.dataset.windowAction = action;
    return node;
  };
  const iconNode = (name, size = 20) => {
    const svg = $('#desktop-icons')?.content.querySelector(`svg[data-icon="${name}"]`)?.cloneNode(true);
    if (!svg) return make('span');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    return svg;
  };
  const iconButton = (name, label, action) => {
    const node = button('', label, action);
    node.append(iconNode(name, 16));
    return node;
  };
  const readStorage = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const saveStorage = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ }
  };
  const cleanURL = (value) => {
    const url = new URL(value, location.href);
    url.searchParams.delete('embed');
    return url.pathname + url.search + url.hash;
  };
  const internalURL = (value) => {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin && /^\/(?:$|posts(?:\/|$)|about\/?$|friends\/?$|guestbook\/?$|updates\/?$)/.test(url.pathname) ? cleanURL(url.href) : null;
    } catch { return null; }
  };
  const editing = target => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  const send = (type, payload = {}) => parent.postMessage({ channel: 'spartan-desktop', type, ...payload }, location.origin);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', event => {
    const target = event.target.closest?.('button, a, summary');
    if (target && !reduceMotion.matches && !target.matches(':disabled')) {
      target.animate([{ opacity: .68 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    }
  });

  let readingSerial = 0;
  function attachReadingControls(host, scroller, article = null) {
    const tools = make('div', 'window-reading-tools');
    const up = iconButton('up', '回到顶部');
    up.className = 'window-reading-button window-back-to-top';
    tools.append(up); host.append(tools);
    const isDocument = scroller === window;
    const headings = article ? $$('h2, h3', article) : [];
    let panel, toggle, meter, links = [];
    const setOpen = open => {
      if (!panel) return;
      panel.hidden = !open;
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭文章目录' : '打开文章目录');
    };
    if (headings.length) {
      tools.classList.add('has-toc');
      toggle = iconButton('toc', '打开文章目录');
      toggle.className = 'window-reading-button window-toc-toggle';
      panel = make('aside', 'window-toc-panel');
      panel.id = `window-toc-${++readingSerial}`;
      panel.hidden = true;
      panel.setAttribute('aria-label', '文章目录');
      toggle.setAttribute('aria-controls', panel.id);
      toggle.setAttribute('aria-expanded', 'false');
      const heading = make('div', 'window-toc-heading');
      const close = iconButton('close', '关闭文章目录');
      heading.append(make('h2', '', '目录'), close);
      const progress = make('div', 'reading-meter');
      meter = make('span'); progress.append(meter);
      progress.setAttribute('aria-label', '阅读进度');
      const nav = make('nav', 'reading-toc');
      nav.setAttribute('aria-label', '文章章节');
      links = headings.map((heading, index) => {
        if (!heading.id) heading.id = `section-${index + 1}`;
        const link = make('a', heading.tagName === 'H3' ? 'toc-child' : '', heading.textContent);
        link.href = `#${heading.id}`;
        link.onclick = event => {
          event.preventDefault();
          const top = heading.getBoundingClientRect().top + (isDocument ? scrollY : scroller.scrollTop - scroller.getBoundingClientRect().top) - 20;
          setOpen(false);
          scroller.scrollTo({ top, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
        };
        nav.append(link); return link;
      });
      panel.append(heading, progress, nav); host.append(panel); tools.append(toggle);
      toggle.onclick = () => setOpen(panel.hidden);
      close.onclick = () => { setOpen(false); toggle.focus({ preventScroll: true }); };
    }
    up.onclick = () => {
      scroller.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
      if (!reduceMotion.matches) $('svg', up).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)', offset: .5 }, { transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
    };
    const update = () => {
      const element = isDocument ? document.scrollingElement : scroller;
      const height = isDocument ? innerHeight : element.clientHeight;
      const maximum = Math.max(0, element.scrollHeight - height);
      const top = element.scrollTop;
      const visible = maximum > 4 && top > Math.min(180, maximum * .25);
      up.classList.toggle('is-visible', visible);
      up.tabIndex = visible ? 0 : -1;
      up.setAttribute('aria-hidden', String(!visible));
      up.style.setProperty('--reading-progress', `${maximum ? Math.min(top / maximum, 1) * 100 : 0}%`);
      if (meter) {
        const viewportTop = isDocument ? 0 : element.getBoundingClientRect().top;
        const total = Math.max(article.scrollHeight - height, 1);
        meter.style.width = `${Math.min(Math.max((viewportTop - article.getBoundingClientRect().top) / total, 0), 1) * 100}%`;
        let active = 0;
        headings.forEach((heading, index) => { if (heading.getBoundingClientRect().top < viewportTop + 48) active = index; });
        links.forEach((link, index) => { link.classList.toggle('is-current', index === active); if (index === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      }
    };
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); };
    const observer = new ResizeObserver(schedule);
    observer.observe(isDocument ? document.documentElement : scroller);
    if (!isDocument && scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    scroller.addEventListener('scroll', schedule, { passive: true });
    const outside = event => { if (panel && !tools.contains(event.target) && !panel.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape' && panel && !panel.hidden) { event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.focus({ preventScroll: true }); } };
    host.addEventListener('pointerdown', outside);
    host.addEventListener('keydown', escape);
    schedule();
    return { destroy() { observer.disconnect(); cancelAnimationFrame(frame); scroller.removeEventListener('scroll', schedule); host.removeEventListener('pointerdown', outside); host.removeEventListener('keydown', escape); tools.remove(); panel?.remove(); } };
  }

  // A frame is a normal static page with only its content exposed. Its scripts
  // remain isolated, so two articles can have independent comments and likes.
  if (embedded) {
    const main = $('main');
    const archiveInput = $('#post-search');
    if ($('#post-list') && archiveInput) {
      const label = make('label', 'archive-search', '搜索文章');
      label.append(archiveInput);
      $('.feed').insertBefore(label, $('#post-list'));
      const filters = $('.right-sidebar');
      if (filters) {
        const details = make('details', 'embed-filters');
        details.append(make('summary', '', '分类与标签筛选'));
        details.append(...filters.children);
        main.prepend(details);
        filters.remove();
      }
    }
    $('.article-reading-card')?.remove();
    $('#mobile-toc-panel')?.remove();
    $('#mobile-toc-toggle')?.remove();
    attachReadingControls(document.body, window, $('.article-content'));
    document.addEventListener('pointerdown', () => send('focus'), { passive: true });
    document.addEventListener('focusin', () => send('focus'));
    document.addEventListener('click', event => {
      const a = event.target.closest?.('a[href]');
      if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.getAttribute('href').startsWith('#')) return;
      const url = internalURL(a.href);
      if (url) { event.preventDefault(); send('open', { url, title: a.textContent.trim() }); }
    });
    document.addEventListener('keydown', event => {
      if (editing(event.target) && event.key !== 'Escape') return;
      if (event.key === 'Escape' || ((event.metaKey || event.altKey) && isShortcut(event))) {
        // The parent owns the modifier preference; do not consume disabled keys.
        if (event.key !== 'Escape' && !isMod(event, readStorage('desktop-settings', {}).modifier || 'both')) return;
        event.preventDefault();
        send('key', { key: event.key, code: event.code, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey, repeat: event.repeat });
      }
    });
    document.addEventListener('wheel', event => {
      const mod = isMod(event, readStorage('desktop-settings', {}).modifier || 'both');
      if (mod || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        // Horizontal code blocks and tables retain their own touchpad scrolling.
        if (!mod && !event.shiftKey && event.target.closest?.('pre, .article-table-scroll')) return;
        event.preventDefault();
        send('wheel', { deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, mod });
      }
    }, { passive: false });
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.channel !== 'spartan-desktop') return;
      if (event.data.type === 'appearance') {
        root.dataset.theme = event.data.theme;
        for (const [key, value] of Object.entries(event.data.properties || {})) {
          if (['--accent-hue', '--card-opacity', '--card-strong-opacity'].includes(key)) root.style.setProperty(key, value);
        }
        const giscus = $('.giscus-frame');
        giscus?.contentWindow?.postMessage({ giscus: { setConfig: { theme: event.data.theme === 'dark' ? 'dark_dimmed' : 'noborder_light' } } }, 'https://giscus.app');
      }
    });
    window.addEventListener('DOMContentLoaded', () => send('ready'));
    return;
  }

  const main = $('main');
  if (!main || window.desktopWeb) return;
  const originalChildren = [...main.children];
  main.className = 'desktop-space';
  main.replaceChildren();
  document.body.classList.add('desktop-ready');
  const defaults = { hue: 200, opacity: .24, blur: 0, brightness: 1, wallpaperOpacity: 1, modifier: 'both', position: 'top', shellOpacity: 1, shellColorMode: 'wallpaper', shellColor: '#69558c' };
  const legacy = readStorage('blog-appearance-settings', {});
  const stored = readStorage('desktop-settings', { hue: legacy.hue, opacity: legacy.cardOpacity, blur: legacy.backgroundBlur, wallpaperOpacity: legacy.backgroundOpacity });
  const bounded = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  let settings = {
    hue: bounded(stored.hue, 0, 360, defaults.hue), opacity: bounded(stored.opacity, .08, 1, defaults.opacity),
    blur: bounded(stored.blur, 0, 18, defaults.blur), brightness: bounded(stored.brightness, .2, 1, defaults.brightness),
    modifier: ['both', 'super', 'alt'].includes(stored.modifier) ? stored.modifier : 'both',
    wallpaperOpacity: bounded(stored.wallpaperOpacity, .2, 1, defaults.wallpaperOpacity),
    position: ['top', 'bottom', 'left', 'right'].includes(stored.position) ? stored.position : 'top',
    shellOpacity: bounded(stored.shellOpacity, .08, 1, defaults.shellOpacity),
    shellColorMode: stored.shellColorMode === 'custom' ? 'custom' : 'wallpaper',
    shellColor: /^#[\da-f]{6}$/i.test(stored.shellColor || '') ? stored.shellColor : defaults.shellColor,
  };
  const workspaces = [];
  const windows = new Map();
  let workspaceIndex = 0;
  let focused = null;
  let serial = 0;
  let lastWheel = 0;
  let launcherIndex = 0;
  let pointerInteraction = null;
  let fullscreenState = null;
  const fullscreenLayer = make('div', 'desktop-fullscreen-layer');
  fullscreenLayer.hidden = true;
  document.body.append(fullscreenLayer);
  const apps = [...JSON.parse($('#shell-launcher').dataset.apps), { name: '窗口总览', action: 'overview', icon: 'grid' }, { name: '控制中心', action: 'controls', icon: 'settings' }, { name: '终端', action: 'terminal', icon: 'terminal' }, { name: '操作指南', action: 'help', icon: 'help' }];
  const siteTitle = document.title.split(' | ').at(-1);
  const dialogs = $$('.shell-dialog');
  dialogs.forEach(dialog => dialog.classList.add('shell-popover'));
  let panelAnchor = null;
  const panelTimers = new Map();
  const panelBridge = make('div', 'shell-panel-bridge');
  panelBridge.hidden = true;
  panelBridge.setAttribute('aria-hidden', 'true');
  document.body.append(panelBridge);
  const announce = message => {
    const toast = $('#shell-announcement');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };
  const current = () => workspaces[workspaceIndex];
  const windowList = (ws = current()) => $$('.desktop-window, .desktop-fullscreen-placeholder', ws.strip).map(el => windows.get(el.dataset.windowId)).filter(Boolean);
  const columnList = (ws = current()) => $$('.desktop-column', ws.strip);
  const colOf = win => fullscreenState?.win === win ? fullscreenState.column : win?.el.closest('.desktop-column');
  const closeDialogs = (immediate = true) => dialogs.forEach(d => closeDialog(d, immediate));
  const pushURL = win => {
    if (!win?.url || location.pathname + location.search + location.hash === win.url) return;
    history.pushState({ desktopWindow: win.id }, '', win.url);
  };
  const focusWindow = (win, options = {}) => {
    if (!win) return;
    if (fullscreenState && fullscreenState.win !== win) restoreFullscreen();
    const ws = fullscreenState?.win === win ? fullscreenState.ws : workspaces.find(w => w.strip.contains(win.el));
    if (!ws) return;
    if (workspaces.indexOf(ws) !== workspaceIndex) switchWorkspace(workspaces.indexOf(ws), false);
    focused?.el.classList.remove('is-focused');
    focused = win;
    ws.focused = win.id;
    win.el.classList.add('is-focused');
    $('#shell-active-title').textContent = win.title;
    if (win.url) document.title = win.documentTitle || `${win.title} | ${siteTitle}`;
    if (options.scroll !== false && fullscreenState?.win !== win) {
      const col = colOf(win);
      const left = col.offsetLeft - (ws.strip.clientWidth - col.offsetWidth) / 2;
      ws.strip.scrollTo({ left, behavior: reduceMotion.matches || options.instant ? 'instant' : 'smooth' });
      if (col.scrollHeight > col.clientHeight) col.scrollTo({ top: Math.max(0, win.el.offsetTop - (col.clientHeight - win.el.offsetHeight) / 2), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
    }
    if (options.keyboard) win.el.focus({ preventScroll: true });
    if (options.history) pushURL(win);
    refreshChrome();
  };
  function addWorkspace() {
    const strip = make('section', 'desktop-workspace');
    strip.setAttribute('aria-label', `工作区 ${workspaces.length + 1}`);
    strip.hidden = workspaces.length !== workspaceIndex;
    main.append(strip);
    workspaces.push({ strip, focused: null, scroll: 0 });
    refreshChrome();
    return workspaces.at(-1);
  }
  function ensureTrailingWorkspace() {
    while (workspaces.length < 3) addWorkspace();
    if (columnList(workspaces.at(-1)).length) addWorkspace();
  }
  function switchWorkspace(index, restore = true) {
    if (index === workspaceIndex) return;
    const direction = index > workspaceIndex ? 1 : -1;
    restoreFullscreen();
    while (workspaces.length <= index) addWorkspace();
    current().scroll = current().strip.scrollLeft;
    focused?.el.classList.remove('is-focused');
    workspaceIndex = Math.max(0, index);
    workspaces.forEach((ws, i) => { ws.strip.hidden = i !== workspaceIndex; });
    focused = windows.get(current().focused) || windowList()[0] || null;
    current().strip.scrollLeft = current().scroll;
    if (restore && focused) focusWindow(focused, { scroll: false, keyboard: true });
    else { focused?.el.classList.add('is-focused'); refreshChrome(); }
    renderEmpty();
    if (!reduceMotion.matches) current().strip.animate([{ opacity: 0, transform: `translateY(${direction * 28}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function renderEmpty() {
    workspaces.forEach(ws => $('.desktop-empty', ws.strip)?.remove());
  }
  function refreshChrome() {
    const nav = $('#shell-workspaces');
    if (!nav) return;
    workspaces.forEach((ws, i) => {
      const b = nav.children[i] || button('', `切换到工作区 ${i + 1}`);
      b.classList.toggle('is-current', i === workspaceIndex);
      b.classList.toggle('has-windows', columnList(ws).length > 0);
      b.setAttribute('aria-current', i === workspaceIndex ? 'true' : 'false');
      b.dataset.workspaceIndex = i;
      b.onclick = () => switchWorkspace(i);
      b.oncontextmenu = event => { event.preventDefault(); showDialog('overview', b); };
      if (!b.isConnected) nav.append(b);
    });
    $('#shell-active-title').textContent = focused?.title || '空白工作区';
    $$('[data-dock-url]').forEach(a => a.classList.toggle('is-running', [...windows.values()].some(win => win.url && new URL(win.url, location.href).pathname === a.dataset.dockUrl)));
    if ($('#shell-overview').open) renderOverview();
  }
  const newColumn = (width = 600, ws = current(), after = null) => {
    const column = make('div', 'desktop-column');
    column.style.setProperty('--column-width', `${width}px`);
    if (after?.parentElement === ws.strip) after.after(column);
    else ws.strip.append(column);
    $('.desktop-empty', ws.strip)?.remove();
    return column;
  };
  function createWindow({ title, content, url = null, width = 600, column = null, icon = 'file' }) {
    restoreFullscreen();
    const el = make('section', 'desktop-window');
    const id = `window-${++serial}`;
    el.dataset.windowId = id;
    el.tabIndex = -1;
    el.setAttribute('aria-label', title);
    const bar = make('div', 'window-titlebar');
    const titleNode = make('span', 'window-title', title);
    const actions = make('div', 'window-actions');
    actions.append(iconButton('more', '窗口操作', 'menu'), iconButton('fullscreen', '全屏 / 恢复窗口', 'fullscreen'), iconButton('close', '关闭窗口', 'close'));
    const appIcon = make('span', 'window-app-icon'); appIcon.append(iconNode(icon, 16));
    bar.append(appIcon, titleNode, actions);
    const body = make('div', 'window-content');
    body.append(content);
    el.append(bar, body);
    const win = { id, el, bar, body, titleNode, title, url, icon, original: !content.matches('iframe'), baseWidth: width };
    windows.set(id, win);
    (column || newColumn(width, current(), colOf(focused))).append(el);
    if (!content.matches('iframe, .desktop-terminal, .music-card')) win.readingControls = attachReadingControls(el, body, $('.article-content', content));
    el.addEventListener('pointerdown', () => focusWindow(win, { scroll: false, history: true }), { passive: true });
    el.addEventListener('focusin', () => focusWindow(win, { scroll: false, history: true }));
    actions.addEventListener('click', event => {
      const b = event.target.closest('button');
      if (!b) return;
      event.stopPropagation();
      focusWindow(win, { scroll: false });
      if (b.dataset.windowAction === 'close') closeWindow(win);
      if (b.dataset.windowAction === 'fullscreen') fullscreen(win);
      if (b.dataset.windowAction === 'menu') toggleWindowMenu(win);
    });
    bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) fullscreen(win); });
    attachWindowDrag(win);
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(edge => {
      const handle = make('div', `window-resizer resize-${edge}`);
      handle.dataset.resizeEdge = edge;
      handle.setAttribute('aria-hidden', 'true');
      el.append(handle);
      attachWindowResize(win, handle, edge);
    });
    el.classList.add('is-opening');
    el.addEventListener('animationend', () => el.classList.remove('is-opening'), { once: true });
    if (reduceMotion.matches) el.classList.remove('is-opening');
    ensureTrailingWorkspace();
    refreshChrome();
    return win;
  }
  function moveNode(node, parent, before = null) {
    if (fullscreenState && (node === fullscreenState.win.el || node === fullscreenState.column)) restoreFullscreen();
    if (parent.moveBefore && node.isConnected && parent.isConnected) parent.moveBefore(node, before);
    else parent.insertBefore(node, before);
  }
  const windowSlots = col => [...col.children].filter(el => el.matches('.desktop-window'));
  const slotStyle = el => ({ flex: el.style.flex, height: el.style.height, marginTop: el.style.marginTop, maxHeight: el.style.maxHeight });
  function fitColumn(col) {
    windowSlots(col).forEach(el => Object.assign(el.style, { flex: '1 1 0px', height: '', marginTop: '0', maxHeight: 'none' }));
  }
  function layoutWorkspace(ws) {
    const cols = columnList(ws);
    if (!cols.length) return;
    ws.autoLayout = true;
    const styles = getComputedStyle(ws.strip);
    const viewport = ws.strip.clientWidth || main.clientWidth;
    const visible = Math.min(cols.length, viewport < 600 ? 1 : viewport < 900 ? 2 : 3);
    const available = viewport - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight) - parseFloat(styles.columnGap) * (visible - 1);
    const width = Math.max(260, Math.min(900, available / visible));
    cols.forEach(col => {
      col.classList.add('is-layout-changing');
      fitColumn(col);
      col.classList.remove('is-maximized');
      col.dataset.customWidth = 'true';
      col.style.setProperty('--column-width', `${width}px`);
    });
    cols.forEach(col => col.getBoundingClientRect());
    requestAnimationFrame(() => cols.forEach(col => col.classList.remove('is-layout-changing')));
  }
  function animateLayout(before) {
    if (reduceMotion.matches) return;
    before.forEach((rect, el) => {
      if (!el.isConnected) return;
      const next = el.getBoundingClientRect();
      if (!next.width || !next.height || !rect.width || !rect.height) return;
      const dx = rect.left - next.left, dy = rect.top - next.top;
      const sx = rect.width / next.width, sy = rect.height / next.height;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sx - 1) + Math.abs(sy - 1) > .01) el.animate([{ transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1)' }], { duration: 230, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
  function attachWindowDrag(win) {
    let state = null;
    let frame = 0;
    const identifyDrop = () => {
      $$('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
      const elements = document.elementsFromPoint(state.pointerX, state.pointerY);
      state.target = elements.map(el => el.closest('.desktop-window')).find(el => el && el !== win.el) || null;
      state.workspace = elements.map(el => el.closest('[data-workspace-index]')).find(Boolean) || null;
      state.ownSlot = elements.some(el => el === state.placeholder);
      state.zone = null;
      state.preview.hidden = true;
      if (state.target) {
        const rect = state.target.getBoundingClientRect();
        const x = (state.pointerX - rect.left) / rect.width, y = (state.pointerY - rect.top) / rect.height;
        const edges = [['left', x], ['right', 1 - x], ['top', y], ['bottom', 1 - y]].sort((a, b) => a[1] - b[1]);
        state.zone = edges[0][1] < .28 ? edges[0][0] : 'swap';
        const preview = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        if (state.zone === 'left' || state.zone === 'right') {
          preview.width = (rect.width - 16) / 2;
          if (state.zone === 'right') preview.left = rect.right - preview.width;
        }
        if (state.zone === 'top' || state.zone === 'bottom') {
          preview.height = (rect.height - 14) / 2;
          if (state.zone === 'bottom') preview.top = rect.bottom - preview.height;
        }
        Object.entries(preview).forEach(([key, value]) => { state.preview.style[key] = `${value}px`; });
        state.preview.dataset.dropZone = state.zone;
        state.preview.hidden = false;
      }
      (state.target || state.workspace)?.classList.add('is-drop-target');
    };
    const pan = () => {
      if (!state?.dragging) return;
      const rect = current().strip.getBoundingClientRect();
      const amount = state.pointerX < rect.left + 40 ? -12 : state.pointerX > rect.right - 40 ? 12 : 0;
      if (amount && state.pointerY > rect.top) { current().strip.scrollLeft += amount; identifyDrop(); }
      frame = requestAnimationFrame(pan);
    };
    const finish = (commit = false) => {
      if (!state) return;
      const old = state;
      state = null;
      pointerInteraction = null;
      cancelAnimationFrame(frame);
      if (old.dragging) {
        const before = new Map(windowList().map(w => [w.el, w.el.getBoundingClientRect()]));
        const sourceWorkspace = current();
        let destinationWorkspace = sourceWorkspace;
        let changed = false;
        old.columnSlots.forEach(item => { item.el.style.cssText = item.style; });
        win.el.style.cssText = old.style;
        win.el.classList.remove('is-dragging');
        if (commit && old.target?.isConnected) {
          const target = old.target;
          const targetColumn = target.parentElement;
          if (old.zone === 'top' || old.zone === 'bottom') {
            moveNode(win.el, targetColumn, old.zone === 'top' ? target : target.nextElementSibling);
          } else if (old.zone === 'left' || old.zone === 'right') {
            const col = windowSlots(old.column).length === 1 ? old.column : newColumn(old.rect.width);
            if (col !== old.column) moveNode(win.el, col);
            moveNode(col, sourceWorkspace.strip, old.zone === 'left' ? targetColumn : targetColumn.nextElementSibling);
          } else {
            const marker = make('div');
            target.before(marker);
            moveNode(target, old.column, old.placeholder);
            moveNode(win.el, targetColumn, marker);
            marker.remove();
          }
          changed = true;
        } else if (commit && old.workspace) {
          const index = Number(old.workspace.dataset.workspaceIndex);
          const ws = workspaces[index];
          if (ws) {
            const col = newColumn(old.rect.width, ws);
            moveNode(win.el, col);
            ws.focused = win.id;
            destinationWorkspace = ws;
            changed = true;
          }
        } else if (commit && !old.ownSlot && current().strip.getBoundingClientRect().top <= old.pointerY) {
          const cols = columnList();
          const next = cols.find(col => col !== old.column && old.pointerX < col.getBoundingClientRect().left + col.offsetWidth / 2);
          const col = windowSlots(old.column).length === 1 ? old.column : newColumn(old.rect.width);
          if (col !== old.column) moveNode(win.el, col);
          moveNode(col, current().strip, next || null);
          changed = true;
        }
        old.placeholder.remove();
        old.preview.remove();
        if (!old.column.children.length) old.column.remove();
        document.body.classList.remove('is-manipulating');
        $$('.is-drop-target').forEach(el => el.classList.remove('is-drop-target'));
        if (changed) {
          layoutWorkspace(sourceWorkspace);
          if (destinationWorkspace !== sourceWorkspace) layoutWorkspace(destinationWorkspace);
        }
        ensureTrailingWorkspace();
        renderEmpty();
        focusWindow(win, { scroll: changed, history: true });
        animateLayout(before);
      }
      current().strip.style.scrollBehavior = '';
      if (win.bar.hasPointerCapture(old.id)) win.bar.releasePointerCapture(old.id);
    };
    win.bar.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button') || win.el.classList.contains('is-fullscreen')) return;
      win.el.classList.remove('is-opening');
      win.el.getAnimations().forEach(animation => animation.cancel());
      const column = colOf(win);
      const columnSlots = windowSlots(column).map(el => ({ el, style: el.style.cssText, height: el.offsetHeight }));
      state = { id: event.pointerId, x: event.clientX, y: event.clientY, pointerX: event.clientX, pointerY: event.clientY, rect: win.el.getBoundingClientRect(), column, columnSlots, style: win.el.style.cssText, slot: slotStyle(win.el), dragging: false };
      pointerInteraction = { cancel: () => finish(false) };
      win.bar.setPointerCapture(event.pointerId);
    });
    win.bar.addEventListener('pointermove', event => {
      if (!state || state.id !== event.pointerId) return;
      const dx = event.clientX - state.x, dy = event.clientY - state.y;
      state.pointerX = event.clientX; state.pointerY = event.clientY;
      if (!state.dragging && Math.hypot(dx, dy) < 6) return;
      if (!state.dragging) {
        state.dragging = true;
        state.columnSlots.filter(item => item.el !== win.el).forEach(item => Object.assign(item.el.style, { flex: `0 0 ${item.height}px`, height: `${item.height}px`, maxHeight: 'none' }));
        state.placeholder = make('div', 'desktop-placeholder');
        state.preview = make('div', 'desktop-drop-preview');
        state.preview.setAttribute('aria-hidden', 'true');
        state.preview.hidden = true;
        document.body.append(state.preview);
        Object.assign(state.placeholder.style, { height: `${state.rect.height}px`, flex: `0 0 ${state.rect.height}px`, marginTop: state.slot.marginTop });
        win.el.before(state.placeholder);
        win.el.classList.add('is-dragging');
        Object.assign(win.el.style, { position: 'fixed', left: `${state.rect.left}px`, top: `${state.rect.top}px`, width: `${state.rect.width}px`, height: `${state.rect.height}px`, marginTop: '0', maxHeight: 'none' });
        document.body.classList.add('is-manipulating');
        current().strip.style.scrollBehavior = 'auto';
        frame = requestAnimationFrame(pan);
      }
      win.el.style.transform = `translate(${dx}px, ${dy}px)`;
      identifyDrop();
    });
    win.bar.addEventListener('pointerup', () => finish(true));
    win.bar.addEventListener('pointercancel', () => finish(false));
    win.bar.addEventListener('lostpointercapture', () => finish(false));
  }
  function attachWindowResize(win, handle, edge) {
    let state = null;
    const finish = (cancel = false) => {
      if (!state) return;
      const old = state; state = null; pointerInteraction = null;
      if (cancel) {
        old.col.style.cssText = old.columnStyle;
        if (old.customWidth === undefined) delete old.col.dataset.customWidth;
        else old.col.dataset.customWidth = old.customWidth;
        if (old.previous) {
          old.previous.style.cssText = old.previousStyle;
          old.previous.classList.toggle('is-maximized', old.previousMaximized);
          if (old.previousCustomWidth === undefined) delete old.previous.dataset.customWidth;
          else old.previous.dataset.customWidth = old.previousCustomWidth;
        }
        old.col.classList.toggle('is-maximized', old.maximized);
        old.slots.forEach(item => { item.el.style.cssText = item.style; });
      }
      old.col.classList.remove('is-resizing');
      old.previous?.classList.remove('is-resizing');
      document.body.classList.remove('is-manipulating');
      current().strip.style.scrollBehavior = '';
      if (handle.hasPointerCapture(old.id)) handle.releasePointerCapture(old.id);
    };
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || win.el.classList.contains('is-fullscreen')) return;
      event.preventDefault();
      win.el.classList.remove('is-opening');
      const col = colOf(win);
      const slots = windowSlots(col).map(el => ({ el, style: el.style.cssText, height: el.getBoundingClientRect().height, gap: parseFloat(getComputedStyle(el).marginTop) || 0 }));
      const index = slots.findIndex(item => item.el === win.el);
      const previous = col.previousElementSibling?.matches('.desktop-column') ? col.previousElementSibling : null;
      state = { id: event.pointerId, x: event.clientX, y: event.clientY, col, slots, index, width: col.getBoundingClientRect().width, columnStyle: col.style.cssText, maximized: col.classList.contains('is-maximized'), customWidth: col.dataset.customWidth, scroll: current().strip.scrollLeft, previous, previousWidth: previous?.offsetWidth || 0, previousStyle: previous?.style.cssText, previousMaximized: previous?.classList.contains('is-maximized'), previousCustomWidth: previous?.dataset.customWidth };
      pointerInteraction = { cancel: () => finish(true) };
      col.classList.remove('is-maximized'); col.classList.add('is-resizing');
      document.body.classList.add('is-manipulating');
      current().strip.style.scrollBehavior = 'auto';
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!state || state.id !== event.pointerId) return;
      const dx = event.clientX - state.x, dy = event.clientY - state.y;
      if (edge.includes('e') || edge.includes('w')) {
        const maximum = edge.includes('w') && state.previous ? Math.min(innerWidth * 1.4, state.width + state.previousWidth - 220) : innerWidth * 1.4;
        const width = Math.max(220, Math.min(maximum, state.width + (edge.includes('w') ? -dx : dx)));
        state.col.style.setProperty('--column-width', `${width}px`);
        state.col.dataset.customWidth = 'true';
        if (edge.includes('w') && state.previous) {
          state.previous.classList.remove('is-maximized'); state.previous.classList.add('is-resizing');
          state.previous.style.setProperty('--column-width', `${state.previousWidth + state.width - width}px`);
          state.previous.dataset.customWidth = 'true';
        } else if (edge.includes('w')) current().strip.scrollLeft = state.scroll + width - state.width;
      }
      if (edge.includes('n') || edge.includes('s')) {
        state.slots.forEach(item => Object.assign(item.el.style, { flex: `0 0 ${item.height}px`, height: `${item.height}px`, maxHeight: 'none' }));
        const item = state.slots[state.index];
        const north = edge.includes('n');
        const neighbor = state.slots[state.index + (north ? -1 : 1)];
        let delta = north ? -dy : dy;
        if (neighbor) {
          delta = Math.max(120 - item.height, Math.min(neighbor.height - 120, delta));
          neighbor.el.style.flexBasis = `${neighbor.height - delta}px`;
          neighbor.el.style.height = `${neighbor.height - delta}px`;
        } else {
          const available = north ? item.height + item.gap : state.col.clientHeight - win.el.offsetTop;
          delta = Math.max(120 - item.height, Math.min(available - item.height, delta));
          if (north) win.el.style.marginTop = `${item.gap - delta}px`;
        }
        win.el.style.flexBasis = `${item.height + delta}px`;
        win.el.style.height = `${item.height + delta}px`;
      }
    });
    handle.addEventListener('pointerup', () => finish());
    handle.addEventListener('pointercancel', () => finish(true));
    handle.addEventListener('lostpointercapture', () => finish());
  }
  function closeWindow(win = focused) {
    if (!win || win.closing) return;
    if (fullscreenState?.win === win) restoreFullscreen();
    win.closing = true;
    const ws = workspaces.find(workspace => workspace.strip.contains(win.el));
    const finish = () => {
      if ($('#music-audio', win.el)) {
        const hiddenHost = $('#desktop-hidden-music') || make('div');
        hiddenHost.id = 'desktop-hidden-music'; hiddenHost.hidden = true;
        document.body.append(hiddenHost);
        hiddenHost.append($('#mobile-music-panel', win.el));
      }
      const list = windowList(ws);
      const i = list.indexOf(win);
      const next = list.slice(i + 1).find(w => !w.closing) || list.slice(0, i).reverse().find(w => !w.closing);
      const col = colOf(win);
      windows.delete(win.id);
      win.readingControls?.destroy();
      win.el.remove();
      if (!col.children.length) col.remove();
      if (ws.autoLayout) layoutWorkspace(ws);
      if (focused === win) focused = null;
      if (next && current() === ws) focusWindow(next, { history: true, keyboard: true });
      else { ws.focused = next?.id || null; refreshChrome(); }
      renderEmpty();
    };
    if (reduceMotion.matches) finish();
    else { win.el.classList.remove('is-opening'); win.el.classList.add('is-closing'); setTimeout(finish, 160); }
  }
  function maximize(win = focused) {
    if (!win) return;
    restoreFullscreen();
    colOf(win).classList.toggle('is-maximized');
    focusWindow(win);
  }
  function restoreFullscreen() {
    if (!fullscreenState) return;
    const { win, column, placeholder } = fullscreenState;
    fullscreenState = null;
    const before = new Map([[win.el, win.el.getBoundingClientRect()]]);
    moveNode(win.el, column, placeholder);
    win.el.classList.remove('is-fullscreen');
    $('[data-window-action=fullscreen]', win.el).setAttribute('aria-pressed', 'false');
    placeholder.remove();
    fullscreenLayer.hidden = true;
    main.inert = false;
    animateLayout(before);
  }
  function fullscreen(win = focused) {
    if (!win) return;
    if (fullscreenState?.win === win) { restoreFullscreen(); focusWindow(win, { scroll: false }); return; }
    restoreFullscreen();
    focusWindow(win, { scroll: false });
    const column = colOf(win);
    const before = new Map([[win.el, win.el.getBoundingClientRect()]]);
    const placeholder = make('div', 'desktop-fullscreen-placeholder');
    placeholder.dataset.windowId = win.id;
    placeholder.style.cssText = win.el.style.cssText;
    placeholder.style.flex = `0 0 ${win.el.offsetHeight}px`;
    placeholder.style.height = `${win.el.offsetHeight}px`;
    win.el.before(placeholder);
    fullscreenLayer.hidden = false;
    moveNode(win.el, fullscreenLayer);
    fullscreenState = { win, column, placeholder, ws: current() };
    main.inert = true;
    win.el.classList.remove('is-opening');
    win.el.classList.add('is-fullscreen');
    $('[data-window-action=fullscreen]', win.el).setAttribute('aria-pressed', 'true');
    animateLayout(before);
  }
  function toggleWindowMenu(win) {
    const existing = $('.window-menu', win.el);
    $$('.window-menu').forEach(m => m.remove());
    if (existing) return;
    const menu = make('div', 'window-menu');
    const items = [
      ['向左移动列', 'left', () => moveColumn(-1)], ['向右移动列', 'right', () => moveColumn(1)],
      ['切换列宽', 'columns', () => cycleWidth()], ['全屏阅读 / 恢复', 'fullscreen', () => fullscreen(win)],
      ['堆叠右侧窗口', 'stack', () => consume()], ['拆出底部窗口', 'unstack', () => expel()],
      ['移动到下一工作区', 'workspace', () => moveToWorkspace(workspaceIndex + 1)],
    ];
    if (win.url) items.push(['在浏览器新标签页打开', 'external', () => window.open(win.url, '_blank', 'noopener')]);
    for (const [name, icon, fn] of items) {
      const b = button('', name); b.append(iconNode(icon, 16), make('span', '', name));
      b.onclick = () => { menu.remove(); if (icon !== 'fullscreen') restoreFullscreen(); fn(); }; menu.append(b);
    }
    win.el.append(menu);
  }
  function openURL(value, title, recordHistory = true) {
    const url = internalURL(value);
    if (!url) return;
    closeDialogs();
    const existing = [...windows.values()].find(win => win.url === url);
    if (existing) { focusWindow(existing, { history: recordHistory, keyboard: true }); return existing; }
    const frame = make('iframe');
    const frameURL = new URL(url, location.origin);
    frameURL.searchParams.set('embed', '1');
    frame.src = frameURL.href;
    frame.title = title || '博客页面';
    const app = apps.find(a => a.url === url);
    const win = createWindow({ title: app?.name || title || '博客页面', content: frame, url, icon: app?.icon || 'file', width: url.startsWith('/posts/') && url !== '/posts/' ? 720 : 610 });
    win.frame = frame;
    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        const name = $('main h1', doc)?.textContent || $('main .feed h2', doc)?.textContent || win.title;
        win.title = name; win.titleNode.textContent = name; frame.title = name; win.el.setAttribute('aria-label', name);
        win.documentTitle = doc.title;
        if (focused === win) document.title = doc.title;
        if (!doc.querySelector('main')) {
          const error = make('div', 'desktop-terminal');
          error.append(make('p', '', '这个页面暂时无法打开。'));
          const retry = button('重试', '重新加载页面'); retry.onclick = () => { win.body.replaceChildren(frame); frame.src = frameURL.href; };
          const direct = make('a', '', '在新标签页访问'); direct.href = url; direct.target = '_blank'; direct.rel = 'noopener';
          error.append(retry, direct); win.body.replaceChildren(error);
        }
      } catch { /* Same-origin pages only; a failed load retains the direct link. */ }
      syncAppearance(win);
      refreshChrome();
    });
    focusWindow(win, { history: recordHistory, keyboard: true });
    return win;
  }
  function navigateColumn(direction) {
    const cols = columnList();
    const index = cols.indexOf(colOf(focused));
    const col = cols[Math.max(0, Math.min(cols.length - 1, index + direction))];
    const win = col && windows.get($('.desktop-window', col)?.dataset.windowId);
    focusWindow(win, { keyboard: true, history: true });
  }
  function navigateStack(direction, move = false) {
    const col = colOf(focused);
    if (!col) return;
    const list = [...col.children];
    const index = list.indexOf(focused.el);
    const sibling = list[index + direction];
    if (!sibling) return;
    if (move) {
      const before = new Map(list.map(el => [el, el.getBoundingClientRect()]));
      moveNode(focused.el, col, direction < 0 ? sibling : sibling.nextElementSibling);
      animateLayout(before); refreshChrome();
    }
    else focusWindow(windows.get(sibling.dataset.windowId), { keyboard: true });
  }
  function moveColumn(direction) {
    const col = colOf(focused);
    const sibling = direction < 0 ? col?.previousElementSibling : col?.nextElementSibling;
    if (!sibling?.matches('.desktop-column')) return;
    const before = new Map(windowList().map(win => [win.el, win.el.getBoundingClientRect()]));
    moveNode(col, current().strip, direction < 0 ? sibling : sibling.nextElementSibling);
    animateLayout(before);
    focusWindow(focused, { keyboard: true });
  }
  function moveToWorkspace(index) {
    if (!focused || index < 0) return;
    while (workspaces.length <= index) addWorkspace();
    const col = colOf(focused);
    moveNode(col, workspaces[index].strip);
    workspaces[index].focused = focused.id;
    current().focused = windowList()[0]?.id || null;
    ensureTrailingWorkspace();
    switchWorkspace(index);
    focusWindow(focused);
    renderEmpty();
  }
  function consume() {
    const col = colOf(focused);
    const right = col?.nextElementSibling;
    if (!right?.matches('.desktop-column')) return;
    const win = $('.desktop-window', right);
    moveNode(win, col);
    if (!right.children.length) right.remove();
    if (current().autoLayout) layoutWorkspace(current());
    else { fitColumn(col); if (right.isConnected) fitColumn(right); }
    refreshChrome();
  }
  function expel() {
    const col = colOf(focused);
    if (!col || col.children.length < 2) return;
    const win = col.lastElementChild;
    const dest = newColumn(col.offsetWidth, current(), col);
    moveNode(win, dest);
    if (current().autoLayout) layoutWorkspace(current());
    else { fitColumn(col); fitColumn(dest); }
    focusWindow(windows.get(win.dataset.windowId));
  }
  function cycleWidth(reverse = false) {
    const col = colOf(focused);
    if (!col) return;
    const presets = [.333, .5, .667];
    const index = Number(col.dataset.preset || 0);
    const next = (index + (reverse ? 2 : 1)) % presets.length;
    col.dataset.preset = next;
    col.classList.remove('is-maximized');
    col.style.setProperty('--column-width', `${Math.max(300, Math.round((innerWidth - 70) * presets[next]))}px`);
    focusWindow(focused);
  }
  function closeDialog(dialog, immediate = false) {
    if (!dialog?.open) return;
    clearTimeout(panelTimers.get(dialog));
    const finish = () => {
      panelTimers.delete(dialog);
      dialog.classList.remove('is-closing');
      dialog.close();
      if (!dialogs.some(d => d.open)) {
        panelBridge.hidden = true;
        panelAnchor?.classList.remove('is-panel-active');
      }
    };
    if (immediate || reduceMotion.matches) { finish(); return; }
    dialog.classList.add('is-closing');
    panelBridge.classList.add('is-closing');
    panelTimers.set(dialog, setTimeout(finish, 180));
  }
  function positionPanel(dialog) {
    if (!dialog?.open) return;
    const bar = $('.shell-bar').getBoundingClientRect();
    const anchor = (panelAnchor || $('.shell-logo')).getBoundingClientRect();
    const edge = root.dataset.shellPosition || 'top';
    const horizontal = edge === 'top' || edge === 'bottom';
    const available = horizontal ? (edge === 'top' ? innerHeight - bar.bottom : bar.top) - 20 : innerHeight - 24;
    dialog.style.maxHeight = `${Math.max(100, available)}px`;
    dialog.style.maxWidth = `${horizontal ? innerWidth - 24 : (edge === 'left' ? innerWidth - bar.right : bar.left) - 20}px`;
    const width = dialog.offsetWidth, height = dialog.offsetHeight;
    const clamp = (value, maximum) => Math.max(12, Math.min(value, maximum - 12));
    const centerX = anchor.left + anchor.width / 2, centerY = anchor.top + anchor.height / 2;
    const left = horizontal ? clamp(centerX - width / 2, innerWidth - width) : edge === 'left' ? bar.right + 8 : bar.left - width - 8;
    const top = horizontal ? edge === 'top' ? bar.bottom + 8 : bar.top - height - 8 : clamp(centerY - height / 2, innerHeight - height);
    Object.assign(dialog.style, { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
    dialog.dataset.edge = edge;
    dialog.style.transformOrigin = horizontal ? `${Math.max(20, Math.min(width - 20, centerX - left))}px ${edge === 'top' ? 0 : height}px` : `${edge === 'left' ? 0 : width}px ${Math.max(20, Math.min(height - 20, centerY - top))}px`;
    dialog.style.setProperty('--panel-enter-x', horizontal ? '0px' : edge === 'left' ? '-12px' : '12px');
    dialog.style.setProperty('--panel-enter-y', horizontal ? edge === 'top' ? '-12px' : '12px' : '0px');
    dialog.style.setProperty('--panel-scale-x', horizontal ? '.6' : '.08');
    dialog.style.setProperty('--panel-scale-y', horizontal ? '.08' : '.6');
    const bridgeLeft = horizontal ? Math.max(left + 20, Math.min(left + width - 60, centerX - 20)) : edge === 'left' ? bar.right - 4 : bar.left - 12;
    const bridgeTop = horizontal ? edge === 'top' ? bar.bottom - 4 : bar.top - 12 : Math.max(top + 20, Math.min(top + height - 60, centerY - 20));
    Object.assign(panelBridge.style, { left: `${bridgeLeft}px`, top: `${bridgeTop}px`, width: horizontal ? '40px' : '16px', height: horizontal ? '16px' : '40px' });
    panelBridge.dataset.edge = edge;
    panelBridge.classList.remove('is-closing');
    panelBridge.hidden = false;
  }
  function showDialog(name, anchor = null) {
    const dialog = $(`#shell-${name}`);
    if (!dialog) return;
    if (dialog.open) { closeDialog(dialog); return; }
    const previousAnchor = panelAnchor;
    closeDialogs();
    const fallback = name === 'overview' ? $('#shell-workspaces .is-current') : $(`.shell-bar [data-shell-action="${name}"]`);
    panelAnchor = anchor?.closest('.shell-bar') ? anchor : anchor?.closest('.shell-dialog') ? previousAnchor : fallback || $('.shell-logo');
    panelAnchor.classList.add('is-panel-active');
    if (name === 'overview') renderOverview();
    if (name === 'launcher') { $('#launcher-query').value = ''; launcherIndex = 0; renderLauncher(); }
    if (name === 'calendar') renderCalendar();
    dialog.show();
    positionPanel(dialog);
    if (name === 'launcher') $('#launcher-query').focus();
    if (name === 'music') requestAnimationFrame(() => window.__musicListResizeHandler?.());
  }
  function renderLauncher() {
    const query = $('#launcher-query').value.trim().toLowerCase();
    const matches = apps.filter(app => !query || app.name.toLowerCase().includes(query));
    launcherIndex = Math.max(0, Math.min(launcherIndex, matches.length - 1));
    const list = $('#launcher-results');
    list.replaceChildren();
    matches.forEach((app, index) => {
      const b = button('', `打开 ${app.name}`);
      b.classList.toggle('is-selected', index === launcherIndex);
      const info = make('span'); info.append(make('strong', '', app.name));
      const appIcon = make('span', 'result-icon'); appIcon.append(iconNode(app.icon));
      b.append(appIcon, info);
      b.onclick = () => app.action ? action(app.action) : openURL(app.url, app.name);
      list.append(b);
    });
    if (!matches.length) list.append(make('h3', '', '无结果'));
  }
  function renderOverview() {
    const host = $('#overview-workspaces'); host.replaceChildren();
    workspaces.forEach((ws, i) => {
      const row = make('section', `overview-row${i === workspaceIndex ? ' is-current' : ''}`);
      const heading = make('div', 'overview-row-heading');
      const select = button(i === workspaceIndex ? '当前工作区' : '切换到这里', `切换到工作区 ${i + 1}`);
      select.onclick = () => { closeDialogs(); switchWorkspace(i); };
      heading.append(make('strong', '', `工作区 ${i + 1}`), select);
      const cards = make('div', 'overview-windows');
      windowList(ws).forEach(win => {
        const card = button('', `定位 ${win.title}`);
        card.className = `overview-card${win === focused ? ' is-selected' : ''}`;
        card.append(iconNode(win.icon, 24), make('strong', '', win.title));
        card.onclick = () => { closeDialogs(); focusWindow(win, { keyboard: true, history: true }); };
        cards.append(card);
      });
      row.append(heading, cards); host.append(row);
    });
  }
  function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    $('#shell-calendar-title').textContent = `${year} 年 ${month + 1} 月`;
    const grid = $('#shell-calendar-grid'); grid.replaceChildren();
    ['日', '一', '二', '三', '四', '五', '六'].forEach(day => grid.append(make('span', '', day)));
    for (let i = 0; i < new Date(year, month, 1).getDay(); i++) grid.append(make('span'));
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) grid.append(make('span', day === now.getDate() ? 'today' : '', String(day)));
  }
  function terminal({ column = null, width = 720, focus = true } = {}) {
    closeDialogs();
    const content = make('div', 'desktop-terminal');
    const profile = JSON.parse($('#shell-launcher').dataset.profile);
    const host = new URL(profile.github).pathname.split('/').filter(Boolean)[0] + '.github.io';
    const prompt = () => {
      const node = make('span', 'terminal-prompt');
      node.append(make('span', 'terminal-user', `${profile.name}@blog`), make('span', '', ':'), make('span', 'terminal-directory', '~'), make('span', '', '$ '));
      return node;
    };
    const commandLine = text => {
      const line = make('div', 'terminal-command-line');
      line.append(prompt(), make('span', 'terminal-command', text));
      return line;
    };
    const fastfetch = () => {
      const panel = make('div', 'terminal-fastfetch');
      const avatar = make('img', 'fastfetch-avatar');
      avatar.src = profile.avatar; avatar.alt = `${profile.name} 的头像`;
      const info = make('div', 'fastfetch-info');
      const title = `${profile.name}@blog`;
      const heading = make('a', 'fastfetch-heading', title);
      heading.href = '/about/';
      info.append(heading, make('div', 'fastfetch-separator', '-'.repeat(title.length)));
      const details = make('div', 'fastfetch-fields');
      const stats = profile.stats;
      const days = Math.max(1, Math.floor((Date.now() - new Date(`${stats.started}T00:00:00+08:00`).getTime()) / 86400000) + 1);
      const words = `${(stats.words / 1000).toFixed(1)}k`;
      const rows = [
        ['Site', host, `https://${host}/`],
        ['Host', 'GitHub Pages'],
        ['Framework', 'Astro'],
        ['Posts', String(profile.postCount)],
        ['Categories', String(stats.categories)],
        ['Tags', String(stats.tags)],
        ['Uptime', `${days} days`],
        ['Words', words],
        ['Updated', stats.updated],
        ['GitHub', profile.github.replace(/^https?:\/\//, ''), profile.github],
        ['Email', profile.email.replace(/^mailto:/, ''), profile.email],
      ];
      rows.forEach(([label, value, href]) => {
        const row = make('div', 'fastfetch-row');
        const term = make('strong', 'fastfetch-key', `${label}:`.padEnd(12, ' ')), description = make('span', 'fastfetch-value');
        if (href) { const link = make('a', '', value); link.href = href; if (!href.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener'; } description.append(link); }
        else description.textContent = value;
        row.append(term, description); details.append(row);
      });
      const colors = make('div', 'fastfetch-colors');
      colors.setAttribute('aria-hidden', 'true');
      for (let row = 0; row < 2; row++) {
        const line = make('div', 'fastfetch-color-row');
        for (let color = 0; color < 8; color++) {
          const block = make('span', `ansi-color ansi-${row * 8 + color}`, '███');
          line.append(block);
        }
        colors.append(line);
      }
      info.append(details, colors); panel.append(avatar, info);
      return panel;
    };
    const output = make('div', 'terminal-output');
    output.append(commandLine('fastfetch'), fastfetch());
    const form = make('form', 'terminal-input');
    const input = make('input'); input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', '桌面终端命令');
    input.autocapitalize = 'off'; input.setAttribute('autocorrect', 'off');
    form.append(prompt(), input); content.append(output, form);
    const win = createWindow({ title: `${profile.name}@blog: ~`, content, width, column, icon: 'terminal' });
    win.el.dataset.kind = 'terminal';
    const history = [];
    let historyIndex = 0;
    let draft = '';
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex === history.length) draft = input.value;
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
        input.value = historyIndex === history.length ? draft : history[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); output.replaceChildren(); }
      if (event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault(); output.append(commandLine(`${input.value}^C`)); input.value = '';
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const text = input.value.trim(); input.value = '';
      if (!text) return;
      history.push(text); historyIndex = history.length; draft = '';
      output.append(commandLine(text));
      const [command, ...args] = text.split(/\s+/);
      const commands = { posts: '/posts/', about: '/about/', friends: '/friends/', guestbook: '/guestbook/', updates: '/updates/', home: '/' };
      if (command === 'help') output.append(make('div', '', 'fastfetch  clear  date  whoami  pwd  ls  echo\nposts  about  friends  guestbook  updates  home\nopen <path>'));
      else if (command === 'fastfetch') output.append(fastfetch());
      else if (command === 'clear') output.replaceChildren();
      else if (command === 'date') output.append(make('div', '', new Date().toLocaleString('zh-CN')));
      else if (command === 'whoami') output.append(make('div', '', profile.name));
      else if (command === 'pwd') output.append(make('div', '', `/home/${profile.name}`));
      else if (command === 'echo') output.append(make('div', '', args.join(' ')));
      else if (command === 'ls') output.append(make('div', '', 'posts/  about/  friends/  guestbook/  updates/'));
      else if (commands[command]) openURL(commands[command]);
      else if (command === 'open' && internalURL(args.join(' '))) openURL(args.join(' '));
      else output.append(make('div', 'terminal-error', `${command}: command not found`));
      win.body.scrollTop = win.body.scrollHeight;
    });
    if (focus) { input.focus({ preventScroll: true }); focusWindow(win); }
    return win;
  }
  const appearanceMessage = () => ({ channel: 'spartan-desktop', type: 'appearance', theme: root.dataset.theme, properties: { '--accent-hue': String(settings.hue), '--card-opacity': String(settings.opacity), '--card-strong-opacity': String(Math.min(settings.opacity + .1, 1)) } });
  function syncAppearance(win) { win?.frame?.contentWindow?.postMessage(appearanceMessage(), location.origin); }
  let wallpaperPalette = { hue: 200, saturation: 45 };
  let wallpaperRequest = 0;
  const wallpaperColors = new Map();
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const lightness = (max + min) / 2, delta = max - min;
    if (!delta) return { hue: 200, saturation: 0, lightness };
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    return { hue, saturation: saturation * 100, lightness };
  }
  function applyShellPalette() {
    const custom = settings.shellColorMode === 'custom';
    const rgb = custom ? settings.shellColor.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16)) : null;
    const palette = custom ? rgbToHsl(...rgb) : wallpaperPalette;
    root.style.setProperty('--shell-hue', Math.round(palette.hue));
    root.style.setProperty('--shell-saturation', `${Math.max(0, Math.min(65, palette.saturation))}%`);
    if (custom) root.style.setProperty('--shell-accent', settings.shellColor);
    else root.style.removeProperty('--shell-accent');
  }
  async function sampleWallpaper() {
    const layer = $('.background-layer');
    const source = layer && (layer.style.backgroundImage || getComputedStyle(layer).backgroundImage).match(/url\(["']?(.*?)["']?\)/)?.[1];
    if (!source) return;
    const request = ++wallpaperRequest;
    if (wallpaperColors.has(source)) { wallpaperPalette = wallpaperColors.get(source); applyShellPalette(); return; }
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 48;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, 48, 48);
      const pixels = context.getImageData(0, 0, 48, 48).data;
      const bins = Array.from({ length: 24 }, () => ({ weight: 0, x: 0, y: 0, saturation: 0 }));
      for (let i = 0; i < pixels.length; i += 4) {
        const color = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (color.lightness < .12 || color.lightness > .9 || color.saturation < 12) continue;
        const weight = (color.saturation / 100) ** 2 * (1 - Math.abs(color.lightness - .5));
        const bin = bins[Math.floor(color.hue / 15) % bins.length];
        const angle = color.hue * Math.PI / 180;
        bin.weight += weight; bin.x += Math.cos(angle) * weight; bin.y += Math.sin(angle) * weight; bin.saturation += color.saturation * weight;
      }
      const dominant = bins.reduce((best, bin) => bin.weight > best.weight ? bin : best, bins[0]);
      const palette = dominant.weight ? { hue: (Math.atan2(dominant.y, dominant.x) * 180 / Math.PI + 360) % 360, saturation: Math.max(30, dominant.saturation / dominant.weight) } : { hue: 200, saturation: 0 };
      wallpaperColors.set(source, palette);
      if (request === wallpaperRequest) { wallpaperPalette = palette; applyShellPalette(); }
    } catch { if (request === wallpaperRequest) { wallpaperPalette = { hue: 200, saturation: 45 }; applyShellPalette(); } }
  }
  function applySettings() {
    root.style.setProperty('--accent-hue', settings.hue);
    root.style.setProperty('--card-opacity', settings.opacity);
    root.style.setProperty('--card-strong-opacity', Math.min(settings.opacity + .1, 1));
    root.style.setProperty('--background-blur', `${settings.blur}px`);
    root.style.setProperty('--background-blur-offset', `${-settings.blur}px`);
    root.style.setProperty('--wallpaper-brightness', settings.brightness);
    root.style.setProperty('--background-opacity', settings.wallpaperOpacity);
    root.style.setProperty('--shell-opacity', settings.shellOpacity);
    applyShellPalette();
    root.dataset.shellPosition = settings.position;
    ['hue', 'opacity', 'blur', 'brightness', 'wallpaperOpacity', 'shellOpacity'].forEach(key => {
      $(`#shell-${key}`).value = settings[key];
      $(`#shell-${key}-value`).textContent = key === 'hue' ? `${settings[key]}°` : key === 'blur' ? `${settings[key]}px` : `${Math.round(settings[key] * 100)}%`;
    });
    $('#shell-modifier').value = settings.modifier;
    $('#shell-position').value = settings.position;
    $('#shell-color-mode').value = settings.shellColorMode;
    $('#shell-color').value = settings.shellColor;
    $('#shell-custom-color').hidden = settings.shellColorMode !== 'custom';
    saveStorage('desktop-settings', settings);
    windows.forEach(syncAppearance);
  }
  function action(name, anchor = null) {
    if (['launcher', 'overview', 'controls', 'help', 'calendar', 'notifications', 'network', 'session'].includes(name)) {
      if (name === 'network') $('#shell-network-state').textContent = navigator.onLine ? '当前网络已连接' : '当前处于离线状态';
      showDialog(name, anchor); return;
    }
    if (name === 'audio') { $('#shell-audio-volume').value = Math.round(($('#music-audio')?.volume ?? .8) * 100); showDialog('audio', anchor); return; }
    if (name === 'mute') { const audio = $('#music-audio'); if (audio) { audio.muted = !audio.muted; announce(audio.muted ? '音乐已静音' : '已恢复音乐音量'); } return; }
    if (name === 'clipboard') {
      navigator.clipboard?.writeText(location.origin + cleanURL(location.href)).then(() => announce('页面链接已复制')).catch(() => announce('未能复制链接，请从地址栏复制'));
      return;
    }
    if (name === 'home') { closeDialogs(); openURL('/'); return; }
    if (name === 'restart') { location.reload(); return; }
    if (name === 'new-workspace') { switchWorkspace(workspaces.length - 1); if (columnList().length) switchWorkspace(workspaces.length); closeDialogs(); return; }
    if (name === 'previous') navigateColumn(-1);
    if (name === 'next') navigateColumn(1);
    if (name === 'terminal') terminal();
    if (name === 'reset-settings') { settings = { ...defaults }; applySettings(); announce('已恢复默认外观'); }
    if (name === 'wallpaper') {
      const backgrounds = JSON.parse(document.body.dataset.backgrounds || '[]');
      if (!backgrounds.length) return;
      const saved = readStorage('blog-background-state', {});
      const choices = backgrounds.map((_, i) => i).filter(i => i !== saved.index);
      const index = choices.length ? choices[Math.floor(Math.random() * choices.length)] : 0;
      $('.background-layer').style.backgroundImage = `url("${backgrounds[index]}")`;
      root.style.setProperty('--active-background-image', `url("${backgrounds[index]}")`);
      saveStorage('blog-background-state', { index, changedAt: Date.now() });
    }
    if (name === 'music') showDialog('music', anchor);
  }
  function isMod(event, preference = 'both') {
    return (preference !== 'alt' && event.metaKey) || (preference !== 'super' && event.altKey && !event.getModifierState?.('AltGraph'));
  }
  function isShortcut(event) {
    return ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Space', 'Slash', 'Comma', 'Period', 'BracketLeft', 'BracketRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyQ', 'KeyO', 'KeyD', 'KeyS', 'KeyT', 'KeyF', 'KeyM', 'KeyC', 'KeyR', 'KeyI', 'KeyU'].includes(event.code);
  }
  function handleKey(event) {
    if (editing(event.target) && event.key !== 'Escape') return;
    if (event.key === 'Escape') {
      if (pointerInteraction) { pointerInteraction.cancel(); return; }
      const open = dialogs.find(d => d.open);
      if (open) closeDialog(open);
      else restoreFullscreen();
      $$('.window-menu').forEach(m => m.remove());
      return;
    }
    if (pointerInteraction || !isMod(event, settings.modifier) || !isShortcut(event)) return;
    event.preventDefault?.();
    // Repeated presses should move focus, but must not repeatedly close windows.
    if (event.repeat && ['KeyQ', 'KeyO', 'Space', 'KeyD', 'KeyS', 'KeyT', 'KeyF', 'KeyM'].includes(event.code)) return;
    const code = event.code;
    if (code === 'Slash' && event.shiftKey) { showDialog('help'); return; }
    if (code === 'Space' || code === 'KeyD') { showDialog('launcher'); return; }
    if (code === 'KeyS') { showDialog('controls'); return; }
    if (code === 'KeyO') { showDialog('overview'); return; }
    if (dialogs.some(d => d.open)) return;
    if (!['KeyF', 'KeyM', 'KeyQ'].includes(code)) restoreFullscreen();
    if (code === 'Tab') {
      const list = windowList();
      const next = (list.indexOf(focused) + (event.shiftKey ? -1 : 1) + list.length) % Math.max(1, list.length);
      focusWindow(list[next], { keyboard: true, history: true }); return;
    }
    if (/^Digit[1-9]$/.test(code)) { const index = Number(code.slice(-1)) - 1; event.ctrlKey ? moveToWorkspace(index) : switchWorkspace(Math.min(index, workspaces.length - 1)); return; }
    const direction = { ArrowLeft: -1, KeyH: -1, ArrowRight: 1, KeyL: 1 }[code];
    if (direction) { event.ctrlKey ? moveColumn(direction) : navigateColumn(direction); return; }
    const vertical = { ArrowUp: -1, KeyK: -1, ArrowDown: 1, KeyJ: 1 }[code];
    if (vertical) { navigateStack(vertical, event.ctrlKey); return; }
    const wsDirection = { PageUp: -1, KeyI: -1, PageDown: 1, KeyU: 1 }[code];
    if (wsDirection) { const index = Math.max(0, Math.min(workspaces.length - 1, workspaceIndex + wsDirection)); event.ctrlKey ? moveToWorkspace(index) : switchWorkspace(index); return; }
    if (code === 'KeyQ') closeWindow();
    if (code === 'KeyT') terminal();
    if (code === 'KeyF' || code === 'KeyM') event.shiftKey ? fullscreen() : maximize();
    if (code === 'KeyC') focusWindow(focused);
    if (code === 'KeyR') cycleWidth(event.shiftKey);
    if (code === 'Comma') consume();
    if (code === 'Period') expel();
    if (code === 'BracketLeft' || code === 'BracketRight') {
      const col = colOf(focused);
      if (col?.children.length > 1) {
        const win = focused.el;
        const newCol = newColumn(col.offsetWidth, current(), col);
        if (code === 'BracketLeft') col.before(newCol);
        moveNode(win, newCol); focusWindow(focused);
      } else if (col) {
        const target = code === 'BracketLeft' ? col.previousElementSibling : col.nextElementSibling;
        if (target?.matches('.desktop-column')) { moveNode(focused.el, target); col.remove(); focusWindow(focused); }
      }
    }
    if (code === 'Home' || code === 'End') {
      const cols = columnList(); const target = code === 'Home' ? cols[0] : cols.at(-1);
      if (event.ctrlKey && focused && target && target !== colOf(focused)) { moveNode(colOf(focused), current().strip, code === 'Home' ? target : target.nextElementSibling); focusWindow(focused); }
      else if (target) focusWindow(windows.get($('.desktop-window', target).dataset.windowId), { keyboard: true });
    }
    refreshChrome();
  }
  function handleWheel(event) {
    const delta = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? innerWidth : 1;
    if (event.mod) {
      if (Date.now() - lastWheel < 150) return;
      lastWheel = Date.now();
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        const dir = (event.deltaX || event.deltaY) > 0 ? 1 : -1;
        event.ctrlKey ? moveColumn(dir) : navigateColumn(dir);
      } else {
        const index = Math.max(0, Math.min(workspaces.length - 1, workspaceIndex + (event.deltaY > 0 ? 1 : -1)));
        event.ctrlKey ? moveToWorkspace(index) : switchWorkspace(index);
      }
    } else current().strip.scrollBy({ left: (event.deltaX || event.deltaY) * delta, behavior: 'instant' });
  }

  // Prepare native content before the legacy feature initializers run.
  addWorkspace();
  $('#mobile-toc-panel')?.remove();
  $('#mobile-toc-toggle')?.remove();
  let primary;
  originalChildren.forEach((content, i) => {
    if (content.matches('.article-reading-card')) return;
    const profile = content.matches('.sidebar-column');
    const auxiliary = content.matches('.right-sidebar, .article-reading-card');
    if (profile) {
      const col = newColumn(420, workspaces[0]);
      const musicCard = $('.music-card', content);
      if ($('.profile-card', content)) {
        const profileTerminal = terminal({ column: col, width: 420, focus: false });
        Object.assign(profileTerminal.el.style, { flex: '1', maxHeight: 'none' });
      }
      if (musicCard) {
        $('#shell-music-content').append(musicCard);
      }
      return;
    }
    if (content.matches('.feed') && $('#post-list', content)) {
      const label = make('label', 'archive-search', '搜索文章'); label.append($('#post-search'));
      content.insertBefore(label, $('#post-list', content));
    }
    const title = auxiliary ? '分类与标签' : location.pathname === '/' ? '最新文章' : document.title.split(' | ')[0];
    const width = profile ? 320 : auxiliary ? 300 : content.matches('.article-page') ? 720 : 570;
    // Original page order is intentionally retained rather than inserting after focus.
    const col = newColumn(width, workspaces[0]);
    const icon = content.matches('.article-reading-card') ? 'toc' : auxiliary ? 'info' : apps.find(app => app.url === cleanURL(location.href))?.icon || 'file';
    const win = createWindow({ title, content, width, column: col, url: profile || auxiliary ? null : cleanURL(location.href), icon });
    if (content.matches('.right-sidebar')) win.el.dataset.kind = 'auxiliary';
    if (!profile && !auxiliary) primary = win;
  });
  ensureTrailingWorkspace();
  renderEmpty();
  applySettings();
  focusWindow(primary || windowList()[0], { scroll: matchMedia('(max-width: 860px)').matches, instant: true });
  history.replaceState({ desktopWindow: focused?.id }, '', location.href);

  document.addEventListener('click', event => {
    const shellAction = event.target.closest('[data-shell-action]');
    if (shellAction) { action(shellAction.dataset.shellAction, shellAction); return; }
    if (event.target.closest('[data-close-dialog]')) { closeDialog(event.target.closest('dialog')); return; }
    if (!event.target.closest('.window-menu, [data-window-action="menu"]')) $$('.window-menu').forEach(m => m.remove());
    const a = event.target.closest('a[href]');
    if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (target?.closest('.desktop-window')) {
        event.preventDefault();
        const win = windows.get(target.closest('.desktop-window').dataset.windowId);
        focusWindow(win);
        const top = target.getBoundingClientRect().top - win.body.getBoundingClientRect().top + win.body.scrollTop;
        win.body.scrollTo({ top, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
      }
      return;
    }
    const url = internalURL(a.href);
    if (url) { event.preventDefault(); openURL(url, a.textContent.trim()); }
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.shell-dialog, .shell-bar')) closeDialogs(false);
  });
  document.addEventListener('keydown', handleKey);
  document.addEventListener('wheel', event => {
    if (dialogs.some(d => d.open)) return;
    const mod = isMod(event, settings.modifier);
    const content = event.target.closest('.window-content');
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!mod && horizontal && event.target.closest('pre, .article-table-scroll')) return;
    if (mod || event.shiftKey || horizontal || (!content && event.target.closest('.desktop-workspace'))) {
      event.preventDefault(); handleWheel({ deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, mod });
    }
  }, { passive: false });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.channel !== 'spartan-desktop') return;
    const win = [...windows.values()].find(w => w.frame?.contentWindow === event.source);
    if (!win) return;
    const data = event.data;
    if (data.type === 'focus') focusWindow(win, { scroll: false, history: true });
    if (data.type === 'ready') syncAppearance(win);
    if (data.type === 'open' && typeof data.url === 'string') { focusWindow(win, { scroll: false }); openURL(data.url, String(data.title || '博客页面')); }
    if (data.type === 'key') { focusWindow(win, { scroll: false }); handleKey(data); }
    if (data.type === 'wheel' && Number.isFinite(data.deltaX) && Number.isFinite(data.deltaY)) handleWheel(data);
    if (data.type === 'state' && typeof data.url === 'string' && internalURL(data.url)) {
      win.url = cleanURL(data.url);
      if (focused === win) history.replaceState({ desktopWindow: win.id }, '', win.url);
    }
  });
  window.addEventListener('popstate', event => {
    const win = windows.get(event.state?.desktopWindow);
    if (win) focusWindow(win, { keyboard: true });
    else openURL(cleanURL(location.href), null, false);
  });
  $('#launcher-query').addEventListener('input', () => { launcherIndex = 0; renderLauncher(); });
  $('#launcher-query').addEventListener('keydown', event => {
    const list = $$('#launcher-results button');
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      launcherIndex = (launcherIndex + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % Math.max(1, list.length);
      list.forEach((b, i) => b.classList.toggle('is-selected', i === launcherIndex));
      list[launcherIndex]?.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === 'Enter') { event.preventDefault(); list[launcherIndex]?.click(); }
  });
  ['hue', 'opacity', 'blur', 'brightness', 'wallpaperOpacity', 'shellOpacity'].forEach(key => $(`#shell-${key}`).addEventListener('input', event => { settings[key] = Number(event.target.value); applySettings(); }));
  $('#shell-color-mode').addEventListener('change', event => { settings.shellColorMode = event.target.value; applySettings(); });
  $('#shell-color').addEventListener('input', event => { settings.shellColor = event.target.value; applySettings(); });
  $('#shell-modifier').addEventListener('change', event => { settings.modifier = event.target.value; applySettings(); });
  $('#shell-position').addEventListener('change', event => {
    settings.position = event.target.value;
    applySettings();
    workspaces.filter(ws => ws.autoLayout).forEach(layoutWorkspace);
    if (focused) focusWindow(focused);
    positionPanel(dialogs.find(dialog => dialog.open));
  });
  $('#shell-audio-volume').addEventListener('input', event => {
    const audio = $('#music-audio');
    const volume = $('#music-volume');
    if (audio) { audio.volume = Number(event.target.value) / 100; audio.muted = false; }
    if (volume) { volume.value = event.target.value; volume.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  if (navigator.getBattery) navigator.getBattery().then(battery => {
    const update = () => {
      const level = `${Math.round(bounded(battery.level, 0, 1, 1) * 100)}%`;
      const state = battery.charging ? '正在充电' : '电池电量';
      $('#shell-battery-value').textContent = level;
      $('#shell-battery-charging').hidden = !battery.charging;
      $('#shell-battery').classList.toggle('is-charging', battery.charging);
      $('#shell-battery').title = `${state} ${level}`;
      $('#shell-battery').setAttribute('aria-label', `${state} ${level}`);
    };
    update(); battery.addEventListener('levelchange', update); battery.addEventListener('chargingchange', update);
  }).catch(() => {});
  const themeObserver = new MutationObserver(() => { $('#theme-toggle').setAttribute('aria-pressed', String(root.dataset.theme === 'dark')); windows.forEach(syncAppearance); });
  themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  $('#theme-toggle').setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  const wallpaperLayer = $('.background-layer');
  if (wallpaperLayer) new MutationObserver(sampleWallpaper).observe(wallpaperLayer, { attributes: true, attributeFilter: ['style'] });
  sampleWallpaper();
  const tick = () => {
    const now = new Date();
    $('#shell-clock').textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    $('#shell-date').textContent = now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' });
    $('#shell-track').textContent = $('#music-title')?.textContent || '音乐';
  };
  tick(); setInterval(tick, 1000);
  addEventListener('resize', () => {
    workspaces.filter(ws => ws.autoLayout).forEach(layoutWorkspace);
    if (focused) focusWindow(focused);
    positionPanel(dialogs.find(dialog => dialog.open));
  });
  const panelObserver = new ResizeObserver(() => requestAnimationFrame(() => positionPanel(dialogs.find(dialog => dialog.open && !dialog.classList.contains('is-closing')))));
  dialogs.forEach(dialog => panelObserver.observe(dialog));
  window.desktopWeb = { openURL, action, focusWindow, updateURL(url) { if (focused?.url) focused.url = cleanURL(url); }, get windows() { return [...windows.values()]; }, get workspaces() { return workspaces; } };
})();
