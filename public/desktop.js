(() => {
  'use strict';
  const root = document.documentElement;
  const shortcuts = window.BlogShortcuts;
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
      return url.origin === location.origin && /^\/(?:$|posts(?:\/|$)|about\/?$|friends\/?$|guestbook\/?$|updates\/?$|clab(?:\/|$))/.test(url.pathname) ? cleanURL(url.href) : null;
    } catch { return null; }
  };
  const editing = target => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  const send = (type, payload = {}) => parent.postMessage({ channel: 'spartan-desktop', type, ...payload }, location.origin);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
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
    document.addEventListener('pointerdown', () => send('focus', { pointer: true }), { passive: true });
    document.addEventListener('focusin', () => send('focus'));
    document.addEventListener('click', event => {
      const a = event.target.closest?.('a[href]');
      if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      if (a.getAttribute('href').startsWith('#')) return;
      if (a.matches('.friend-card')) { event.preventDefault(); send('browse', { url: a.href, title: a.textContent.trim() }); return; }
      const url = internalURL(a.href);
      if (url) { event.preventDefault(); send('open', { url, title: a.textContent.trim() }); }
    });
    document.addEventListener('keydown', event => {
      const id = shortcuts.match(event, readStorage('desktop-settings', {}));
      if (id) { event.preventDefault(); event.stopImmediatePropagation(); send('shortcut', { id, repeat: event.repeat }); }
      else if (event.key === 'Escape' && !editing(event.target)) send('key', { key: 'Escape' });
    }, { capture: true });
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
  const defaults = { hue: 200, opacity: .24, blur: 0, barBlur: 18, brightness: 1, wallpaperOpacity: 1, modifier: 'both', position: 'top', shellOpacity: 1, shellColorMode: 'wallpaper', shellColor: '#69558c', wallpaperMotion: 'fade', shortcutPreset: 'web', shortcutsEnabled: true, shortcuts: {} };
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
    barBlur: bounded(stored.barBlur, 0, 40, defaults.barBlur),
    wallpaperMotion: window.BlogWallpaper.modes.includes(stored.wallpaperMotion) ? stored.wallpaperMotion : defaults.wallpaperMotion,
    shortcutPreset: stored.shortcutPreset === 'niri' ? 'niri' : 'web',
    shortcutsEnabled: stored.shortcutsEnabled !== false,
    shortcuts: Object.fromEntries(shortcuts.definitions.filter(item => stored.shortcuts?.[item.id] === null || shortcuts.valid(stored.shortcuts?.[item.id])).map(item => [item.id, stored.shortcuts[item.id]])),
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
  const apps = [...JSON.parse($('#shell-launcher').dataset.apps), { name: '浏览器', action: 'browser', icon: 'browser' }, { name: '窗口总览', action: 'overview', icon: 'grid' }, { name: '控制中心', action: 'controls', icon: 'settings' }, { name: '终端', action: 'terminal', icon: 'terminal' }, { name: '操作指南', action: 'help', icon: 'help' }];
  const siteTitle = JSON.parse($('#shell-launcher').dataset.profile).name;
  document.title = siteTitle;
  const dialogs = $$('.shell-dialog');
  dialogs.forEach(dialog => {
    dialog.classList.add('shell-popover');
    dialog.addEventListener('cancel', event => event.preventDefault());
  });
  let panelAnchor = null;
  const panelTimers = new Map();
  const panelBridge = make('div', 'shell-panel-bridge');
  let panelSurface = null, surfaceFrame = 0;
  let surfaceHitContext, wallpaperPage = 0;
  let recordingShortcut = null, keyboardLocked = false, keyboardRequest = 0;
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
    if (!win || history.state?.desktopWindow === win.id) return;
    history.pushState({ desktopWindow: win.id, url: win.url }, '', '/');
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
    document.title = siteTitle;
    if (options.scroll !== false && fullscreenState?.win !== win) {
      const col = colOf(win);
      const behavior = reduceMotion.matches || options.instant ? 'instant' : 'smooth';
      if (mobile.matches) {
        const top = win.el.getBoundingClientRect().top - ws.strip.getBoundingClientRect().top + ws.strip.scrollTop;
        ws.strip.scrollTo({ top: Math.max(0, top - 12), behavior });
      } else {
        const left = col.offsetLeft - (ws.strip.clientWidth - col.offsetWidth) / 2;
        ws.strip.scrollTo({ left, behavior });
        if (col.scrollHeight > col.clientHeight) col.scrollTo({ top: Math.max(0, win.el.offsetTop - (col.clientHeight - win.el.offsetHeight) / 2), behavior });
      }
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
    if (mobile.matches) return;
    while (workspaces.length < 3) addWorkspace();
    if (columnList(workspaces.at(-1)).length) addWorkspace();
  }
  function compactWorkspaces() {
    if (mobile.matches) return;
    const activeBefore = current();
    if (!windowList(activeBefore).length && workspaces.slice(workspaceIndex + 1).every(ws => !windowList(ws).length)) {
      while (workspaces.length > 3 && workspaces.at(-1) !== activeBefore) workspaces.pop().strip.remove();
    }
    ensureTrailingWorkspace();
    const active = current(), trailing = workspaces.at(-1);
    const occupied = workspaces.filter(ws => windowList(ws).length).length;
    const minimum = Math.max(3, occupied + 1 + (!windowList(active).length && active !== trailing ? 1 : 0));
    for (let i = workspaces.length - 2; i >= 0 && workspaces.length > minimum; i--) {
      const ws = workspaces[i];
      if (ws !== active && !windowList(ws).length) { ws.strip.remove(); workspaces.splice(i, 1); }
    }
    workspaceIndex = workspaces.indexOf(active);
    workspaces.forEach((ws, i) => { ws.strip.setAttribute('aria-label', `工作区 ${i + 1}`); ws.strip.hidden = ws !== active; });
    refreshChrome();
  }
  function switchWorkspace(index, restore = true) {
    if (mobile.matches) return;
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
    compactWorkspaces();
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
      b.setAttribute('aria-label', `切换到工作区 ${i + 1}`);
      b.dataset.workspaceIndex = i;
      b.onclick = () => {
        const panel = dialogs.find(dialog => dialog.open);
        if (panel && panelAnchor === b) closeDialog(panel);
        else switchWorkspace(i);
      };
      b.oncontextmenu = event => { event.preventDefault(); showDialog('overview', b); };
      if (!b.isConnected) nav.append(b);
    });
    while (nav.children.length > workspaces.length) nav.lastElementChild.remove();
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
    if (!content.matches('iframe, .desktop-terminal, .desktop-browser, .music-card')) win.readingControls = attachReadingControls(el, body, $('.article-content', content));
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
    el.addEventListener('click', event => {
      if (!event.target.closest('input, textarea, select, iframe, a') && !getSelection()?.toString()) restoreTerminalFocus(win);
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
    if (mobile.matches) return;
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
        compactWorkspaces();
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
  function closeWindow(win = focused, { returnTo = null } = {}) {
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
      win.terminal?.destroy();
      win.browser?.destroy();
      win.readingControls?.destroy();
      win.el.remove();
      if (!col.children.length) col.remove();
      if (ws.autoLayout) layoutWorkspace(ws);
      const wasFocused = focused === win;
      if (wasFocused) focused = null;
      if (returnTo && windows.has(returnTo.id) && !returnTo.closing) { focusWindow(returnTo, { history: true, keyboard: true }); returnTo.terminal?.focus(); }
      else if (wasFocused && next && current() === ws) focusWindow(next, { history: true, keyboard: true });
      else { if (ws.focused === win.id) ws.focused = next?.id || null; refreshChrome(); }
      renderEmpty();
      compactWorkspaces();
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
      ...(!mobile.matches ? [['移动到下一工作区', 'workspace', () => moveToWorkspace(workspaceIndex + 1)]] : []),
    ];
    if (win.url) items.push(['在浏览器新标签页打开', 'external', () => window.open(win.url, '_blank', 'noopener')]);
    for (const [name, icon, fn] of items) {
      const b = button('', name); b.append(iconNode(icon, 16), make('span', '', name));
      b.onclick = () => { menu.remove(); if (icon !== 'fullscreen') restoreFullscreen(); fn(); restoreTerminalFocus(win); }; menu.append(b);
    }
    win.el.append(menu);
  }
  function openURL(value, title, recordHistory = true) {
    const url = internalURL(value);
    if (!url) return;
    const frame = make('iframe');
    const frameURL = new URL(url, location.origin);
    frameURL.searchParams.set('embed', '1');
    frame.src = frameURL.href;
    frame.title = title || '博客页面';
    const app = apps.find(a => a.url === url);
    const win = createWindow({ title: app?.name || title || '博客页面', content: frame, url, icon: app?.icon || 'file', width: url.startsWith('/clab') ? 1100 : url.startsWith('/posts/') && url !== '/posts/' ? 720 : 610 });
    win.frame = frame;
    if (url.startsWith('/clab')) {
      const external = iconButton('external', '在浏览器新标签页打开 Clab');
      external.onclick = () => {
        let currentURL = win.url || url;
        try { currentURL = internalURL(frame.contentWindow.location.href) || currentURL; } catch { /* Keep the card address if the frame becomes inaccessible. */ }
        window.open(new URL(currentURL, location.origin).href, '_blank', 'noopener,noreferrer');
      };
      $('.window-actions', win.bar).prepend(external);
    }
    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        const name = url.startsWith('/clab') ? 'Clab · 通信实验室' : $('main h1', doc)?.textContent || $('main .feed h2', doc)?.textContent || win.title;
        win.title = name; win.titleNode.textContent = name; frame.title = name; win.el.setAttribute('aria-label', name);
        win.documentTitle = doc.title;
        document.title = siteTitle;
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
  function openBrowser(value = location.origin) {
    let url;
    try { url = window.BlogBrowser.normalize(value); } catch { return; }
    const content = make('div', 'desktop-browser');
    const win = createWindow({ title: new URL(url).host, content, url, icon: 'browser', width: 860 });
    win.el.dataset.kind = 'browser';
    win.browser = window.BlogBrowser.mount({ content, win, url, iconButton, internalURL, changed: () => { syncAppearance(win); refreshChrome(); } });
    win.frame = win.browser.frame;
    focusWindow(win, { history: true, keyboard: true });
    return win;
  }
  async function openStars() {
    restoreFullscreen();
    const cols = columnList(), slot = Math.floor(Math.random() * (cols.length + 1)), column = newColumn(560);
    if (cols[slot]) current().strip.insertBefore(column, cols[slot]);
    const content = make('article', 'star-card');
    content.append(make('p', 'star-loading', 'Connecting to the universe…'));
    const win = createWindow({ title: 'stars', content, width: 560, column, icon: 'star' }); win.el.dataset.kind = 'star';
    focusWindow(win, { history: true, keyboard: true });
    let star;
    try { star = await window.BlogStars.next(); } catch (error) { if (windows.has(win.id)) content.replaceChildren(make('p', 'star-loading', error.message)); return win; }
    if (root.dataset.crashed === 'true' || !windows.has(win.id) || win.closing) return;
    content.replaceChildren();
    const image = make('img', 'star-image'); image.src = star.image; image.alt = star.name; image.decoding = 'async';
    const copy = make('div', 'star-copy');
    copy.append(make('p', 'star-english', `${star.english} · ${star.type}`), make('h1', '', star.name), make('p', 'star-description', star.description));
    const facts = make('dl', 'star-facts');
    Object.entries(star.facts).forEach(([key, value]) => facts.append(make('dt', '', key), make('dd', '', value)));
    const sources = make('div', 'star-sources');
    [['资料 · NASA', star.source], ['照片来源', star.photoSource || star.source], ['原始图片', star.imageSource]].forEach(([label, href]) => { const link = make('a', '', label); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link); });
    copy.append(facts, sources, make('p', 'star-credit', `Image credit: ${star.credit}`)); content.append(image, copy);
    win.title = star.name; win.titleNode.textContent = star.name; win.el.setAttribute('aria-label', star.name); refreshChrome();
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
    if (mobile.matches) return;
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
  function restoreTerminalFocus(win = focused) {
    queueMicrotask(() => {
      if (root.dataset.crashed !== 'true' && win === focused && windows.has(win?.id) && !dialogs.some(dialog => dialog.open) && !$('.window-menu', win.el)) win.terminal?.focus();
    });
  }
  function closeDialog(dialog, immediate = false) {
    if (!dialog?.open) return;
    if (dialog.id === 'shell-shortcuts') cancelShortcutRecording();
    if (!immediate && dialog.classList.contains('is-closing')) return;
    clearTimeout(panelTimers.get(dialog));
    const finish = () => {
      panelTimers.delete(dialog);
      dialog.classList.remove('is-closing');
      dialog.close();
      restoreTerminalFocus();
      if (!dialogs.some(d => d.open)) {
        panelSurface = null;
        cancelAnimationFrame(surfaceFrame);
        delete root.dataset.barPanel;
        panelAnchor?.classList.remove('is-panel-active');
        panelAnchor?.setAttribute('aria-expanded', 'false');
        paintPanelSurface();
      }
    };
    if (immediate || reduceMotion.matches) { finish(); return; }
    dialog.classList.add('is-closing');
    paintPanelSurface();
    panelTimers.set(dialog, setTimeout(finish, 180));
  }
  function paintPanelSurface() {
    cancelAnimationFrame(surfaceFrame);
    surfaceFrame = 0;
    const surface = panelSurface?.dialog.open ? panelSurface : null;
    const bar = surface?.bar || $('.shell-bar').getBoundingClientRect();
    const edge = surface?.edge || root.dataset.shellPosition || 'top';
    const horizontal = edge === 'top' || edge === 'bottom';
    const barStart = horizontal ? bar.left : bar.top, barEnd = horizontal ? bar.right : bar.bottom;
    const thickness = horizontal ? bar.height : bar.width, radius = Math.min(12, thickness / 2);
    let extension = '';
    if (surface) {
      const { dialog, start, length, depth, gap, flare, origin } = surface;
      const transform = getComputedStyle(dialog).transform;
      const matrix = transform === 'none' ? { a: 1, d: 1 } : new DOMMatrix(transform);
      const along = horizontal ? matrix.a : matrix.d, outward = horizontal ? matrix.d : matrix.a;
      const left = origin + (start - origin) * along, right = left + length * along;
      const near = gap * outward, far = (gap + depth) * outward;
      const shoulder = flare * along, radiusX = 20 * along, radiusY = 20 * outward;
      extension = `H${right + shoulder}C${right + shoulder * .45} 0 ${right} ${near * .45} ${right} ${near}V${far - radiusY}Q${right} ${far} ${right - radiusX} ${far}H${left + radiusX}Q${left} ${far} ${left} ${far - radiusY}V${near}C${left} ${near * .45} ${left - shoulder * .45} 0 ${left - shoulder} 0`;
    }
    const path = `M${barStart + radius} ${-thickness}H${barEnd - radius}A${radius} ${radius} 0 0 1 ${barEnd} ${-thickness + radius}V${-radius}A${radius} ${radius} 0 0 1 ${barEnd - radius} 0${extension}H${barStart + radius}A${radius} ${radius} 0 0 1 ${barStart} ${-radius}V${-thickness + radius}A${radius} ${radius} 0 0 1 ${barStart + radius} ${-thickness}Z`;
    const orientation = edge === 'top' ? `translate(0 ${bar.bottom})` : edge === 'bottom' ? `matrix(1 0 0 -1 0 ${bar.top})` : edge === 'left' ? `matrix(0 1 1 0 ${bar.right} 0)` : `matrix(0 1 -1 0 ${bar.left} 0)`;
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${innerWidth} ${innerHeight}"><path transform="${orientation}" d="${path}"/></svg>`;
    panelBridge.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
    Object.assign(panelBridge.style, { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` });
    panelBridge.hidden = false;
    if (surface) {
      surface.hitPath = new Path2D(path);
      if (surface.dialog.getAnimations().some(animation => animation.playState === 'running')) surfaceFrame = requestAnimationFrame(paintPanelSurface);
    }
  }
  function insidePanelSurface(x, y) {
    if (!panelSurface?.dialog.open || !panelSurface.hitPath) return false;
    const { edge, bar, horizontal } = panelSurface;
    const along = horizontal ? x : y;
    const outward = edge === 'top' ? y - bar.bottom : edge === 'bottom' ? bar.top - y : edge === 'left' ? x - bar.right : bar.left - x;
    surfaceHitContext ||= document.createElement('canvas').getContext('2d');
    return surfaceHitContext?.isPointInPath(panelSurface.hitPath, along, outward) || false;
  }
  function positionPanel(dialog) {
    if (!dialog?.open) return;
    const bar = $('.shell-bar').getBoundingClientRect();
    const anchor = (panelAnchor || $('.shell-logo')).getBoundingClientRect();
    const edge = root.dataset.shellPosition || 'top';
    const horizontal = edge === 'top' || edge === 'bottom';
    const flare = horizontal && mobile.matches ? 12 : 20;
    const gap = flare;
    const flatStart = horizontal ? bar.left + 12 : bar.top + 12;
    const flatEnd = horizontal ? bar.right - 12 : bar.bottom - 12;
    const joinedLength = Math.max(100, flatEnd - flatStart - flare * 2);
    const available = horizontal ? (edge === 'top' ? innerHeight - bar.bottom : bar.top) - gap - 12 : joinedLength;
    dialog.style.maxHeight = `${Math.max(100, available)}px`;
    dialog.style.maxWidth = `${horizontal ? joinedLength : Math.max(100, (edge === 'left' ? innerWidth - bar.right : bar.left) - gap - 12)}px`;
    const width = dialog.offsetWidth, height = dialog.offsetHeight;
    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));
    const centerX = anchor.left + anchor.width / 2, centerY = anchor.top + anchor.height / 2;
    const left = horizontal ? clamp(centerX - width / 2, flatStart + flare, flatEnd - flare - width) : edge === 'left' ? bar.right + gap : bar.left - width - gap;
    const top = horizontal ? edge === 'top' ? bar.bottom + gap : bar.top - height - gap : clamp(centerY - height / 2, flatStart + flare, flatEnd - flare - height);
    Object.assign(dialog.style, { left: `${left}px`, top: `${top}px`, right: 'auto', bottom: 'auto' });
    dialog.dataset.edge = edge;
    const originX = horizontal ? clamp(centerX - left, 0, width) : edge === 'left' ? -gap : width + gap;
    const originY = horizontal ? edge === 'top' ? -gap : height + gap : clamp(centerY - top, 0, height);
    dialog.style.transformOrigin = `${originX}px ${originY}px`;
    const scaleX = horizontal ? '.28' : '.025', scaleY = horizontal ? '.025' : '.28';
    dialog.style.setProperty('--panel-scale-x', scaleX);
    dialog.style.setProperty('--panel-scale-y', scaleY);
    Object.assign(panelBridge.style, { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` });
    panelSurface = { dialog, bar, edge, horizontal, start: horizontal ? left : top, length: horizontal ? width : height, depth: horizontal ? height : width, gap, flare, origin: horizontal ? left + originX : top + originY };
    panelBridge.dataset.edge = edge;
    panelBridge.classList.remove('is-closing');
    panelBridge.hidden = false;
    paintPanelSurface();
  }
  function showDialog(name, anchor = null) {
    const dialog = $(`#shell-${name}`);
    if (!dialog) return;
    const fromBar = anchor?.closest('.shell-bar');
    const active = dialogs.find(panel => panel.open);
    if (fromBar && active && (dialog.open || anchor === panelAnchor)) { closeDialog(active); return; }
    if (dialog.open) return;
    const previousAnchor = panelAnchor;
    closeDialogs();
    const fallback = name === 'overview' ? $('#shell-workspaces .is-current') : $(`.shell-bar [data-shell-action="${name}"]`);
    panelAnchor = anchor?.closest('.shell-bar') ? anchor : anchor?.closest('.shell-dialog') ? previousAnchor : fallback || $('.shell-logo');
    panelAnchor.classList.add('is-panel-active');
    panelAnchor.setAttribute('aria-expanded', 'true');
    if (name === 'overview') renderOverview();
    if (name === 'launcher') { $('#launcher-query').value = ''; launcherIndex = 0; renderLauncher(); }
    if (name === 'calendar') renderCalendar();
    if (name === 'shortcuts') { renderShortcutBindings(); updateKeyboardPriority(); }
    if (name === 'help') renderShortcutGuide();
    if (name === 'wallpaper') {
      wallpaperPage = Math.floor(Math.max(0, currentWallpaper()) / 9);
      renderWallpapers();
    }
    root.dataset.barPanel = 'true';
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
      if (mobile.matches && i !== 0) return;
      const row = make('section', `overview-row${i === workspaceIndex ? ' is-current' : ''}`);
      const heading = make('div', 'overview-row-heading');
      const select = button(i === workspaceIndex ? '当前工作区' : '切换到这里', `切换到工作区 ${i + 1}`);
      select.onclick = () => switchWorkspace(i);
      heading.append(make('strong', '', mobile.matches ? '窗口' : `工作区 ${i + 1}`));
      if (!mobile.matches) heading.append(select);
      const cards = make('div', 'overview-windows');
      windowList(ws).forEach(win => {
        const card = button('', `定位 ${win.title}`);
        card.className = `overview-card${win === focused ? ' is-selected' : ''}`;
        card.append(iconNode(win.icon, 24), make('strong', '', win.title));
        card.onclick = () => focusWindow(win, { keyboard: true, history: true });
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
  function currentWallpaper() {
    return window.BlogWallpaper.currentIndex;
  }
  function renderWallpapers() {
    const wallpapers = window.BlogWallpaper.images;
    const pages = Math.max(1, Math.ceil(wallpapers.length / 9));
    wallpaperPage = Math.max(0, Math.min(pages - 1, wallpaperPage));
    const grid = $('#wallpaper-grid'); grid.replaceChildren();
    const selected = currentWallpaper();
    for (let slot = 0; slot < 9; slot++) {
      const index = wallpaperPage * 9 + slot, source = wallpapers[index];
      if (!source) { const empty = make('div', 'wallpaper-empty'); empty.setAttribute('aria-hidden', 'true'); grid.append(empty); continue; }
      const tile = button('', `选择壁纸 ${index + 1}`);
      tile.className = 'wallpaper-tile'; tile.setAttribute('aria-pressed', String(index === selected));
      const image = make('img'); image.src = source; image.alt = `壁纸 ${index + 1}`; image.loading = 'lazy'; image.decoding = 'async';
      tile.append(image);
      tile.onclick = async () => {
        const changed = await window.BlogWallpaper.select(index, { mode: settings.wallpaperMotion });
        if (!changed) return;
        $$('.wallpaper-tile', grid).forEach((item, i) => item.setAttribute('aria-pressed', String(wallpaperPage * 9 + i === index)));
      };
      grid.append(tile);
    }
    $('#wallpaper-page').textContent = `${wallpaperPage + 1} / ${pages}`;
    $$('[data-wallpaper-page]').forEach(item => { item.disabled = Number(item.dataset.wallpaperPage) < 0 ? wallpaperPage === 0 : wallpaperPage === pages - 1; });
  }
  function terminal({ column = null, width = 720, focus = true, page = null, origin = null } = {}) {
    const content = make('div', 'desktop-terminal');
    const profile = JSON.parse($('#shell-launcher').dataset.profile);
    const win = createWindow({ title: `${profile.name}@blog: ~`, content, width, column, icon: 'terminal' });
    win.el.dataset.kind = 'terminal';
    win.terminal = window.BlogTerminal.mount({ content, win, profile, openURL, openBrowser, openStars, close: closeWindow, internalURL, page,
      openTerminal: (url, source) => terminal({ page: url, origin: source, width: colOf(source)?.offsetWidth || 720 }),
      goBack: (parent = false) => {
        let destination = origin && windows.has(origin.id) && !origin.closing ? origin : null;
        if (parent && win.terminal.path) {
          const path = new URL(win.terminal.path, location.origin).pathname.replace(/\/$/, '') || '/';
          if (path === '/') { closeWindow(win, { returnTo: destination }); return; }
          const parentPath = path.startsWith('/posts/') ? '/posts/' : '/';
          if (!destination?.terminal?.path || new URL(destination.terminal.path, location.origin).pathname !== parentPath) {
            destination = windowList().find(item => item !== win && !item.closing && item.terminal?.path && new URL(item.terminal.path, location.origin).pathname === parentPath)
              || terminal({ page: parentPath, origin: destination, width: colOf(win)?.offsetWidth || 720 });
          }
        }
        closeWindow(win, { returnTo: destination });
      },
    });
    if (focus) { focusWindow(win); win.terminal.focus(); }
    return win;
  }
  const appearanceMessage = () => ({ channel: 'spartan-desktop', type: 'appearance', theme: root.dataset.theme, properties: { '--accent-hue': String(settings.hue), '--card-opacity': String(settings.opacity), '--card-strong-opacity': String(Math.min(settings.opacity + .1, 1)) } });
  function syncAppearance(win) { if (win?.frame && (!win.browser || new URL(win.browser.url).origin === location.origin)) win.frame.contentWindow?.postMessage(appearanceMessage(), location.origin); }
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
    root.style.setProperty('--bar-blur', `${settings.barBlur}px`);
    applyShellPalette();
    root.dataset.shellPosition = settings.position;
    ['hue', 'opacity', 'blur', 'barBlur', 'brightness', 'wallpaperOpacity', 'shellOpacity'].forEach(key => {
      $(`#shell-${key}`).value = settings[key];
      $(`#shell-${key}-value`).textContent = key === 'hue' ? `${settings[key]}°` : ['blur', 'barBlur'].includes(key) ? `${settings[key]}px` : `${Math.round(settings[key] * 100)}%`;
      const range = $(`#shell-${key}`);
      range.style.setProperty('--range-progress', `${(settings[key] - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100}%`);
    });
    $('#shell-modifier').value = settings.modifier;
    $('#shell-wallpaperMotion').value = settings.wallpaperMotion;
    $('#shortcut-preset').value = settings.shortcutPreset;
    $('#shortcuts-enabled').checked = settings.shortcutsEnabled;
    $('#shortcut-modifier-setting').hidden = settings.shortcutPreset !== 'niri';
    updateShortcutTitles();
    $('#shell-position').value = settings.position;
    $('#shell-color-mode').value = settings.shellColorMode;
    $('#shell-color').value = settings.shellColor;
    $('#shell-custom-color').hidden = settings.shellColorMode !== 'custom';
    saveStorage('desktop-settings', settings);
    windows.forEach(syncAppearance);
    const panel = dialogs.find(dialog => dialog.open);
    panel ? positionPanel(panel) : paintPanelSurface();
  }
  function action(name, anchor = null) {
    if (['launcher', 'overview', 'controls', 'help', 'shortcuts', 'calendar', 'wallpaper', 'notifications', 'network', 'session'].includes(name)) {
      if (name === 'network') $('#shell-network-state').textContent = navigator.onLine ? '当前网络已连接' : '当前处于离线状态';
      showDialog(name, anchor); return;
    }
    if (name === 'audio') {
      const range = $('#shell-audio-volume');
      range.value = Math.round(($('#music-audio')?.volume ?? .8) * 100);
      range.style.setProperty('--range-progress', `${range.value}%`);
      showDialog('audio', anchor); return;
    }
    if (name === 'mute') { const audio = $('#music-audio'); if (audio) { audio.muted = !audio.muted; announce(audio.muted ? '音乐已静音' : '已恢复音乐音量'); } return; }
    if (name === 'clipboard') {
      navigator.clipboard?.writeText(location.origin + cleanURL(location.href)).then(() => announce('页面链接已复制')).catch(() => announce('未能复制链接，请从地址栏复制'));
      return;
    }
    if (name === 'home') { openURL('/'); return; }
    if (name === 'restart') { location.reload(); return; }
    if (name === 'new-workspace') { switchWorkspace(workspaces.length - 1); if (columnList().length) switchWorkspace(workspaces.length); return; }
    if (name === 'previous') navigateColumn(-1);
    if (name === 'next') navigateColumn(1);
    if (name === 'terminal') terminal();
    if (name === 'browser') openBrowser();
    if (name === 'reset-settings') { settings = { ...defaults, shortcutPreset: settings.shortcutPreset, shortcuts: settings.shortcuts, shortcutsEnabled: settings.shortcutsEnabled, modifier: settings.modifier }; applySettings(); announce('已恢复默认外观'); }
    if (name === 'music') showDialog('music', anchor);
  }
  function isMod(event, preference = 'both') {
    return (preference !== 'alt' && event.metaKey) || (preference !== 'super' && event.altKey && !event.getModifierState?.('AltGraph'));
  }
  function shortcutLabel(id) {
    const values = shortcuts.bindings(settings, id);
    return values.length ? values.map(shortcuts.format).join(' / ') : '未绑定';
  }
  function updateShortcutTitles() {
    ['launcher', 'controls', 'overview', 'shortcuts'].forEach(id => {
      const item = shortcuts.definitions.find(item => item.id === id);
      $$(`.shell-bar [data-shell-action="${id}"]`).forEach(button => { button.title = `${item.label} · ${shortcutLabel(id)}`; });
    });
  }
  function renderShortcutGuide() {
    const list = $('#shell-help .shortcut-list'); list.replaceChildren();
    shortcuts.definitions.filter(item => !mobile.matches || item.group !== '工作区').forEach(item => {
      const row = make('div'); row.append(make('span', '', item.label), make('kbd', '', shortcutLabel(item.id))); list.append(row);
    });
    const row = make('div'); row.append(make('span', '', '退出窗口全屏'), make('kbd', '', 'Esc')); list.append(row);
  }
  function cancelShortcutRecording() {
    const id = recordingShortcut; recordingShortcut = null;
    const button = id && $(`[data-shortcut="${id}"]`);
    if (button) { button.classList.remove('is-recording'); button.textContent = shortcutLabel(id); button.setAttribute('aria-pressed', 'false'); }
  }
  function renderShortcutBindings() {
    cancelShortcutRecording();
    const list = $('#shortcut-bindings'); list.replaceChildren(); let group = '';
    shortcuts.definitions.filter(item => !mobile.matches || item.group !== '工作区').forEach(item => {
      if (item.group !== group) { group = item.group; list.append(make('h3', '', group)); }
      const row = make('div', 'shortcut-row'), record = button(shortcutLabel(item.id), `修改：${item.label}`);
      record.className = 'shortcut-record'; record.dataset.shortcut = item.id;
      record.onclick = () => {
        const cancel = recordingShortcut === item.id; cancelShortcutRecording();
        $('#shortcut-status').textContent = cancel ? '' : '按下组合键；Esc 取消，Delete 清除。';
        if (!cancel) { recordingShortcut = item.id; record.classList.add('is-recording'); record.textContent = '按下组合键…'; record.setAttribute('aria-pressed', 'true'); }
      };
      const reset = iconButton('reset', `重置：${item.label}`); reset.className = 'shortcut-reset';
      reset.onclick = () => { delete settings.shortcuts[item.id]; cancelShortcutRecording(); applySettings(); renderShortcutBindings(); $('#shortcut-status').textContent = ''; };
      row.append(make('span', '', item.label), record, reset); list.append(row);
    });
  }
  function captureShortcut(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat || event.isComposing) return;
    if (event.key === 'Escape') { cancelShortcutRecording(); $('#shortcut-status').textContent = ''; return; }
    if (/^(Control|Alt|Shift|Meta)/.test(event.code)) return;
    const binding = shortcuts.normalize(event), status = $('#shortcut-status');
    if (['Delete', 'Backspace'].includes(event.code) && !event.ctrlKey && !event.altKey && !event.metaKey) settings.shortcuts[recordingShortcut] = null;
    else {
      if (!shortcuts.valid(binding) || event.getModifierState?.('AltGraph')) { status.textContent = '请使用 Ctrl、Alt、Super 组合键或功能键。'; return; }
      const conflict = shortcuts.definitions.find(item => item.id !== recordingShortcut && shortcuts.bindings(settings, item.id).some(value => shortcuts.identity(value) === shortcuts.identity(binding)));
      if (conflict) { status.textContent = `已用于「${conflict.label}」，请换一个组合键。`; return; }
      settings.shortcuts[recordingShortcut] = binding;
    }
    cancelShortcutRecording(); applySettings(); renderShortcutBindings(); status.textContent = '已保存';
  }
  function updateKeyboardPriority(message = '') {
    $('#shortcut-priority').textContent = document.fullscreenElement ? '退出全屏键盘优先' : '开启全屏键盘优先';
    $('#shortcut-priority').setAttribute('aria-pressed', String(!!document.fullscreenElement));
    $('#shortcut-priority-status').textContent = message || (keyboardLocked ? '已启用。长按 Esc 可退出；系统保留按键仍由系统处理。' : navigator.keyboard?.lock ? '全屏后可请求键盘锁定，系统保留按键仍由系统处理。' : '当前浏览器不支持键盘锁定。');
  }
  async function toggleKeyboardPriority() {
    const request = ++keyboardRequest;
    try {
      if (document.fullscreenElement) { navigator.keyboard?.unlock?.(); keyboardLocked = false; await document.exitFullscreen(); return; }
      await root.requestFullscreen();
      if (request !== keyboardRequest || !document.fullscreenElement) return;
      if (!navigator.keyboard?.lock) { updateKeyboardPriority('已进入全屏；当前浏览器不支持键盘锁定。'); return; }
      updateKeyboardPriority('等待浏览器允许键盘锁定；可随时退出全屏。');
      await navigator.keyboard.lock();
      if (request !== keyboardRequest || !document.fullscreenElement) { if (!document.fullscreenElement) navigator.keyboard.unlock(); return; }
      keyboardLocked = true; updateKeyboardPriority();
    } catch {
      if (request !== keyboardRequest) return;
      keyboardLocked = false; updateKeyboardPriority('浏览器未允许全屏或键盘锁定，可使用自定义组合键。');
    }
  }
  function handleKey(event) {
    if (root.dataset.crashed === 'true') return;
    if (recordingShortcut) { captureShortcut(event); return; }
    const id = shortcuts.match(event, settings);
    if (id) { event.preventDefault(); event.stopImmediatePropagation(); executeShortcut(id, event.repeat); return; }
    if (event.key === 'Escape') {
      if (pointerInteraction) { pointerInteraction.cancel(); return; }
      if (dialogs.some(dialog => dialog.open)) return;
      restoreFullscreen();
      $$('.window-menu').forEach(m => m.remove());
    }
  }
  function executeShortcut(id, repeat = false) {
    if (pointerInteraction || root.dataset.crashed === 'true') return;
    if (repeat && !/^(focus|moveLeft|moveRight|moveUp|moveDown|workspacePrevious|workspaceNext|cycle|width)/.test(id)) return;
    if (['help', 'launcher', 'controls', 'overview', 'shortcuts'].includes(id)) { showDialog(id); return; }
    if (dialogs.some(d => d.open)) return;
    if (!['maximize', 'fullscreen', 'close'].includes(id)) restoreFullscreen();
    if (id === 'cycleNext' || id === 'cyclePrevious') {
      const list = windowList();
      const next = (list.indexOf(focused) + (id === 'cyclePrevious' ? -1 : 1) + list.length) % Math.max(1, list.length);
      focusWindow(list[next], { keyboard: true, history: true }); return;
    }
    const numbered = /^(moveWorkspace|workspace)([1-9])$/.exec(id);
    if (numbered) { const index = Number(numbered[2]) - 1; numbered[1] === 'moveWorkspace' ? moveToWorkspace(index) : switchWorkspace(Math.min(index, workspaces.length - 1)); return; }
    const direction = { focusLeft: -1, focusRight: 1, moveLeft: -1, moveRight: 1 }[id];
    if (direction) { id.startsWith('move') ? moveColumn(direction) : navigateColumn(direction); return; }
    const vertical = { focusUp: -1, focusDown: 1, moveUp: -1, moveDown: 1 }[id];
    if (vertical) { navigateStack(vertical, id.startsWith('move')); return; }
    const wsDirection = { workspacePrevious: -1, workspaceNext: 1, moveWorkspacePrevious: -1, moveWorkspaceNext: 1 }[id];
    if (wsDirection) { const index = Math.max(0, Math.min(workspaces.length - 1, workspaceIndex + wsDirection)); id.startsWith('move') ? moveToWorkspace(index) : switchWorkspace(index); return; }
    if (id === 'close') closeWindow();
    if (id === 'terminal') terminal();
    if (id === 'fullscreen') fullscreen();
    if (id === 'maximize') maximize();
    if (id === 'center') focusWindow(focused);
    if (id === 'widthNext' || id === 'widthPrevious') cycleWidth(id === 'widthPrevious');
    if (id === 'consume') consume();
    if (id === 'expel') expel();
    if (id === 'joinLeft' || id === 'joinRight') {
      const col = colOf(focused);
      if (col?.children.length > 1) {
        const win = focused.el;
        const newCol = newColumn(col.offsetWidth, current(), col);
        if (id === 'joinLeft') col.before(newCol);
        moveNode(win, newCol); focusWindow(focused);
      } else if (col) {
        const target = id === 'joinLeft' ? col.previousElementSibling : col.nextElementSibling;
        if (target?.matches('.desktop-column')) { moveNode(focused.el, target); col.remove(); focusWindow(focused); }
      }
    }
    if (['first', 'last', 'moveFirst', 'moveLast'].includes(id)) {
      const first = id === 'first' || id === 'moveFirst';
      const cols = columnList(), target = first ? cols[0] : cols.at(-1);
      if (id.startsWith('move') && focused && target && target !== colOf(focused)) { moveNode(colOf(focused), current().strip, first ? target : target.nextElementSibling); focusWindow(focused); }
      else if (target) focusWindow(windows.get($('.desktop-window', target).dataset.windowId), { keyboard: true });
    }
    refreshChrome();
  }
  function handleWheel(event) {
    if (mobile.matches) { current().strip.scrollBy({ top: event.deltaY || event.deltaX, behavior: 'instant' }); return; }
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
  const initialPath = cleanURL(location.href);
  originalChildren.forEach((content, i) => {
    if (content.matches('.article-reading-card')) return;
    const profile = content.matches('.sidebar-column');
    const auxiliary = content.matches('.right-sidebar, .article-reading-card');
    if (profile) {
      const width = Math.max(320, (main.clientWidth - 70) / 2);
      const col = newColumn(width, workspaces[0]);
      col.classList.add('initial-terminal-column');
      const musicCard = $('.music-card', content);
      if ($('.profile-card', content)) {
        const profileTerminal = terminal({ column: col, width, focus: false });
        Object.assign(profileTerminal.el.style, { flex: '1', maxHeight: 'none' });
        if (initialPath === '/') primary = profileTerminal;
      }
      if (musicCard) {
        $('#shell-music-content').append(musicCard);
      }
      return;
    }
    if (initialPath === '/') return;
    if (content.matches('.feed') && $('#post-list', content)) {
      const label = make('label', 'archive-search', '搜索文章'); label.append($('#post-search'));
      content.insertBefore(label, $('#post-list', content));
    }
    const title = auxiliary ? '分类与标签' : $('h1, h2', content)?.textContent || siteTitle;
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
  history.replaceState({ desktopWindow: focused?.id, url: focused?.url }, '', '/');
  if (primary?.terminal && !mobile.matches) primary.terminal.focus();

  document.addEventListener('click', event => {
    const shellAction = event.target.closest('[data-shell-action]');
    if (shellAction) { action(shellAction.dataset.shellAction, shellAction); restoreTerminalFocus(); return; }
    if (!event.target.closest('.window-menu, [data-window-action="menu"]')) $$('.window-menu').forEach(m => m.remove());
    const a = event.target.closest('a[href]');
    if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.matches('.friend-card')) { event.preventDefault(); openBrowser(a.href); return; }
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
    if (!event.target.closest('.shell-dialog, .shell-bar') && !insidePanelSurface(event.clientX, event.clientY)) closeDialogs(false);
  }, { passive: true });
  document.addEventListener('keydown', handleKey, { capture: true });
  document.addEventListener('wheel', event => {
    if (dialogs.some(d => d.open)) return;
    if (mobile.matches) return;
    const mod = isMod(event, settings.modifier);
    const content = event.target.closest('.window-content');
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!mod && horizontal && event.target.closest('pre, .article-table-scroll')) return;
    if (mod || event.shiftKey || horizontal || (!content && event.target.closest('.desktop-workspace'))) {
      event.preventDefault(); handleWheel({ deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, mod });
    }
  }, { passive: false });
  window.addEventListener('message', event => {
    if (root.dataset.crashed === 'true' || event.origin !== location.origin || event.data?.channel !== 'spartan-desktop') return;
    const win = [...windows.values()].find(w => w.frame?.contentWindow === event.source);
    if (!win) return;
    const data = event.data;
    if (data.type === 'focus') { if (data.pointer) closeDialogs(false); focusWindow(win, { scroll: false, history: true }); }
    if (data.type === 'ready') syncAppearance(win);
    if (data.type === 'open' && typeof data.url === 'string' && internalURL(data.url)) { focusWindow(win, { scroll: false }); if (win.browser) win.browser.navigate(data.url); else openURL(data.url, String(data.title || '博客页面')); }
    if (data.type === 'browse' && typeof data.url === 'string') { focusWindow(win, { scroll: false }); openBrowser(data.url); }
    if (data.type === 'key') { focusWindow(win, { scroll: false }); handleKey(data); }
    if (data.type === 'shortcut' && settings.shortcutsEnabled && shortcuts.definitions.some(item => item.id === data.id)) { focusWindow(win, { scroll: false }); executeShortcut(data.id, data.repeat); }
    if (data.type === 'wheel' && Number.isFinite(data.deltaX) && Number.isFinite(data.deltaY)) handleWheel(data);
    if (data.type === 'state' && typeof data.url === 'string' && internalURL(data.url)) {
      if (win.browser) win.browser.adopt(data.url);
      else win.url = cleanURL(data.url);
      if (focused === win) history.replaceState({ desktopWindow: win.id, url: win.url }, '', '/');
    }
  });
  window.addEventListener('popstate', event => {
    const win = windows.get(event.state?.desktopWindow);
    if (win) focusWindow(win, { keyboard: true });
    else if (event.state?.url) openURL(event.state.url, null, false);
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
  ['hue', 'opacity', 'blur', 'barBlur', 'brightness', 'wallpaperOpacity', 'shellOpacity'].forEach(key => $(`#shell-${key}`).addEventListener('input', event => { settings[key] = Number(event.target.value); applySettings(); }));
  $$('[data-wallpaper-page]').forEach(item => item.addEventListener('click', () => { wallpaperPage += Number(item.dataset.wallpaperPage); renderWallpapers(); }));
  document.addEventListener('blog-wallpaper-pool', event => {
    if ($('#shell-wallpaper').open) { if (event.detail.poolChanged) wallpaperPage = Math.floor(currentWallpaper() / 9); renderWallpapers(); }
  });
  $('#shell-color-mode').addEventListener('change', event => { settings.shellColorMode = event.target.value; applySettings(); });
  $('#shell-color').addEventListener('input', event => { settings.shellColor = event.target.value; applySettings(); });
  $('#shell-modifier').addEventListener('change', event => { settings.modifier = event.target.value; applySettings(); renderShortcutBindings(); });
  $('#shell-wallpaperMotion').addEventListener('change', event => { settings.wallpaperMotion = event.target.value; applySettings(); });
  $('#shortcut-preset').addEventListener('change', event => { settings.shortcutPreset = event.target.value; applySettings(); renderShortcutBindings(); $('#shortcut-status').textContent = ''; });
  $('#shortcuts-enabled').addEventListener('change', event => { settings.shortcutsEnabled = event.target.checked; applySettings(); });
  $('#shortcut-reset-all').addEventListener('click', () => { settings.shortcuts = {}; applySettings(); renderShortcutBindings(); $('#shortcut-status').textContent = ''; });
  $('#shortcut-priority').addEventListener('click', toggleKeyboardPriority);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { ++keyboardRequest; navigator.keyboard?.unlock?.(); keyboardLocked = false; } updateKeyboardPriority(); });
  addEventListener('pagehide', () => navigator.keyboard?.unlock?.());
  $('#shell-position').addEventListener('change', event => {
    settings.position = event.target.value;
    applySettings();
    workspaces.filter(ws => ws.autoLayout).forEach(layoutWorkspace);
    if (focused) focusWindow(focused);
    const panel = dialogs.find(dialog => dialog.open);
    panel ? positionPanel(panel) : paintPanelSurface();
  });
  $('#shell-audio-volume').addEventListener('input', event => {
    event.target.style.setProperty('--range-progress', `${event.target.value}%`);
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
    const panel = dialogs.find(dialog => dialog.open);
    panel ? positionPanel(panel) : paintPanelSurface();
  });
  mobile.addEventListener('change', () => {
    restoreFullscreen();
    if (mobile.matches) {
      const first = workspaces[0];
      workspaces.slice(1).forEach(ws => columnList(ws).forEach(col => moveNode(col, first.strip)));
      workspaceIndex = 0;
      workspaces.forEach((ws, i) => { ws.strip.hidden = i !== 0; });
      first.focused = focused?.id || windowList(first)[0]?.id;
    } else compactWorkspaces();
    refreshChrome();
    if ($('#shell-wallpaper').open) { wallpaperPage = Math.floor(currentWallpaper() / 9); renderWallpapers(); }
    if (focused) focusWindow(focused, { instant: true });
  });
  const panelObserver = new ResizeObserver(() => requestAnimationFrame(() => positionPanel(dialogs.find(dialog => dialog.open && !dialog.classList.contains('is-closing')))));
  dialogs.forEach(dialog => panelObserver.observe(dialog));
  window.desktopWeb = { openURL, action, focusWindow, updateURL(url) { if (focused?.url) focused.url = cleanURL(url); }, get activeURL() { return focused?.url || initialPath; }, get windows() { return [...windows.values()]; }, get workspaces() { return workspaces; } };
})();
