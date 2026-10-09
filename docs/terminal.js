(() => {
  'use strict';
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  let dataPromise;
  const loadData = () => dataPromise ||= fetch('/terminal-data.json').then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).catch(error => { dataPromise = null; throw error; });
  let crashed = false;
  function destructiveCommand(text, args) {
    if (/:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}/.test(text)) return true;
    const tokens = [...args];
    if (tokens[0] === 'sudo') tokens.shift();
    const command = tokens.shift()?.split('/').at(-1);
    if (command === 'rm') return tokens.some(arg => arg === '--recursive' || /^-[^-]*[rR]/.test(arg)) && tokens.some(arg => ['/', '/*', '~', '~/', '~/*', '/home', '/home/*'].includes(arg));
    if (/^mkfs(?:\.|$)/.test(command || '')) return tokens.some(arg => arg.startsWith('/dev/'));
    return command === 'dd' && tokens.some(arg => /^of=\/dev\/(?:[sv]d[a-z]|nvme\d+n\d+|mmcblk\d+)/.test(arg));
  }
  function simulateCrash(command) {
    if (crashed) return;
    crashed = true;
    const root = document.documentElement;
    root.dataset.crashed = 'true';
    document.querySelectorAll('.desktop-space,.desktop-fullscreen-layer,.shell-bar,.shell-dialog').forEach(el => { el.inert = true; });
    document.querySelector('#music-audio')?.pause();
    const overlay = node('section', 'terminal-crash'); overlay.tabIndex = -1; overlay.setAttribute('aria-label', 'BlogOS simulated kernel panic');
    const screen = node('div', 'terminal-crash-screen');
    const label = node('div', 'terminal-crash-label', 'SPARTAN_OS  /  VIRTUAL MACHINE');
    const log = node('div', 'terminal-crash-log');
    log.append(node('div', 'terminal-crash-command', `$ ${command}`), node('div', '', '[ 0.000000] destructive operation accepted'));
    const panic = node('div', 'terminal-crash-panic'); panic.hidden = true;
    panic.append(node('span', 'terminal-crash-code', 'KERNEL PANIC'), node('h1', '', 'No working init found.'), node('p', '', 'The virtual root filesystem has left the chat.'), node('p', 'terminal-note', 'Simulation complete. Nothing was deleted.'));
    const reboot = node('button', 'terminal-reboot', 'Reboot [R]'); reboot.type = 'button'; reboot.onclick = () => location.reload();
    panic.append(reboot, node('p', 'terminal-crash-hint', 'Refresh the page to restore your desktop.'));
    screen.append(label, log, panic); overlay.append(screen); document.body.append(overlay); overlay.focus();
    const messages = ['[ 0.021043] unlink /usr/bin/blog-browser', '[ 0.082117] unlink /lib/libwallpaper.so', '[ 0.143209] bar.service: connection lost', '[ 0.221405] /sbin/init: no such file or directory', '[ 0.390011] VFS: unable to mount virtual root', '[ 0.404404] Kernel panic - not syncing'];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    messages.forEach((message, index) => setTimeout(() => {
      log.append(node('div', index > 2 ? 'terminal-error' : '', message));
    }, reduced ? 0 : 140 + index * 190));
    setTimeout(() => { overlay.classList.add('is-panicked'); panic.hidden = false; }, reduced ? 0 : 1550);
    overlay.addEventListener('keydown', event => {
      if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) return;
      event.stopPropagation();
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); location.reload(); }
    });
  }
  const commands = {
    help: ['help [-d | -s | -m] [command]', 'Display command help.', 'Use help for an overview, help COMMAND for details, -s for syntax, -d for a short description, or -m for a manual page.', ['help posts', 'help -m open']],
    man: ['man <command>', 'Read a command manual.', 'Equivalent to help -m COMMAND.', ['man read']],
    home: ['home', 'Browse the site directory.', 'Open the keyboard-driven site browser inside this shell.', ['home']],
    posts: ['posts [search terms]', 'Browse and search articles.', 'Select an article with j/k or the arrow keys. Press Enter to read it. Search matches titles, summaries, categories and tags.', ['posts', 'posts ISAC']],
    read: ['read <slug | number>', 'Read an article.', 'Use an article slug or the number shown by ls posts. The reader supports scrolling, text search, headings and links.', ['read welcome', 'read 1']],
    cat: ['cat <slug | number>', 'Read an article.', 'Alias for read.', ['cat welcome']],
    about: ['about', 'Read the About page.', 'Read the profile and contact links in the terminal reader.', ['about']],
    friends: ['friends', 'Browse friend links.', 'Select a site with j/k or the arrow keys. Enter opens the selected external site in a new tab.', ['friends']],
    guestbook: ['guestbook', 'Open the guestbook.', 'Read the guestbook in the terminal and press c to load the live GitHub discussion. Tab reaches its controls; GitHub handles sign-in and posting.', ['guestbook']],
    updates: ['updates', 'Browse the update history.', 'Articles are sorted by their latest update. Enter reads the selected article.', ['updates']],
    open: ['open [--gui] <path>', 'Open a site page.', 'By default, pages open inside this shell. --gui opens the original graphical page as a desktop window. Paths may include article search parameters.', ['open /about/', 'open /posts/welcome/', 'open --gui /posts/']],
    cd: ['cd <path>', 'Navigate to a site page.', 'Open a virtual directory or article. This browser does not access your device filesystem.', ['cd posts', 'cd /about/']],
    ls: ['ls [posts]', 'List virtual directories or articles.', 'ls lists page commands. ls posts lists article numbers, slugs and titles.', ['ls', 'ls posts']],
    fastfetch: ['fastfetch', 'Display the site profile and statistics.', 'Show the avatar, site details, contact links and statistics.', ['fastfetch']],
    clear: ['clear', 'Clear the shell output.', 'Command history remains available. Ctrl+L does the same.', ['clear']],
    history: ['history', 'List commands from this session.', 'Up/Down recall commands. Tab completes commands and site paths.', ['history']],
    date: ['date', 'Display the current date and time.', 'Use the browser device clock.', ['date']],
    whoami: ['whoami', 'Print the site owner.', 'Display the blog profile name.', ['whoami']],
    pwd: ['pwd', 'Print the virtual home directory.', 'This is the blog shell home, not a directory on your device.', ['pwd']],
    echo: ['echo [text ...]', 'Print text.', 'Quoted text and escaped characters are supported. Commands are never executed by the operating system.', ['echo "Hello, world"']],
    exit: ['exit', 'Close this shell window.', 'You can open another shell from the launcher or with Mod+T.', ['exit']],
    reboot: ['reboot', 'Restart the blog desktop.', 'Reload the page and start a fresh shell session. Appearance preferences are retained.', ['reboot']],
  };
  const pagePaths = { home: '/', posts: '/posts/', about: '/about/', friends: '/friends/', guestbook: '/guestbook/', updates: '/updates/' };
  const parse = text => {
    const args = []; let value = '', quote = '', escaped = false, started = false;
    for (const char of text) {
      if (escaped) { value += char; escaped = false; started = true; }
      else if (char === '\\' && quote !== "'") { escaped = true; started = true; }
      else if (quote) { if (char === quote) quote = ''; else value += char; }
      else if (char === '"' || char === "'") { quote = char; started = true; }
      else if (/\s/.test(char)) { if (started) { args.push(value); value = ''; started = false; } }
      else { value += char; started = true; }
    }
    if (quote) throw new Error('Unclosed quote. Close it and try again.');
    if (escaped) value += '\\';
    if (started) args.push(value);
    return args;
  };
  function manual(name, mode) {
    const info = commands[name];
    if (!info) return node('div', 'terminal-error', `help: no help topic matches '${name}'. Try help.`);
    if (mode === '-s') return node('div', '', info[0]);
    if (mode === '-d') return node('div', '', `${name} — ${info[1]}`);
    const block = node('section', 'terminal-help');
    block.append(node('h2', '', `${name.toUpperCase()}(1)  ·  BLOG SHELL`));
    for (const [heading, text] of [
      ['NAME', `${name} — ${info[1]}`], ['SYNOPSIS', info[0]], ['DESCRIPTION', info[2]],
      ['EXAMPLES', info[3].map(example => `$ ${example}`).join('\n')],
      ['KEYBOARD', 'Shell: ↑/↓ history · Tab complete · Ctrl+L clear · Ctrl+C cancel\nBrowser: j/k or ↑/↓ select · Enter open · / search · q back\nReader: Space/b page · g/G start/end · t headings · l links · n/N search'],
      ['SEE ALSO', 'help, home, posts, read, open'],
    ]) block.append(node('h3', '', heading), node('div', '', text));
    return block;
  }
  function help() {
    const block = node('section', 'terminal-help');
    block.append(node('h2', '', 'BLOG SHELL'), node('p', '', 'Usage: command [options] [arguments]\nType help COMMAND or man COMMAND for a detailed manual.'));
    const groups = [
      ['BROWSE', ['home', 'posts', 'read', 'about', 'friends', 'guestbook', 'updates', 'open']],
      ['SHELL', ['help', 'man', 'ls', 'cd', 'fastfetch', 'clear', 'history', 'date', 'whoami', 'pwd', 'echo', 'reboot', 'exit']],
    ];
    groups.forEach(([title, names]) => {
      block.append(node('h3', '', title));
      names.forEach(name => {
        const row = node('div', 'terminal-help-row');
        row.append(node('strong', '', name), node('span', '', commands[name][1])); block.append(row);
      });
    });
    block.append(node('h3', '', 'GETTING STARTED'), node('div', '', '$ posts          Browse articles\n$ read welcome   Read an article\n$ open --gui /about/   Open a graphical window'),
      node('h3', '', 'KEYBOARD'), node('div', '', '↑/↓ history · Tab complete · Ctrl+L clear · Ctrl+C cancel\nj/k or ↑/↓ select · Enter open · / search · q back\nSpace/b page · g/G start/end · t headings · l links'),
      node('p', 'terminal-note', 'This shell navigates the blog. It does not run commands on your device.'));
    return block;
  }
  function safeDocument(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    parsed.querySelectorAll('script, style, iframe, object, embed, form, input, button').forEach(el => el.remove());
    parsed.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith('on') || (!el.closest('.katex') && !['class', 'id', 'href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'aria-hidden', 'role', 'xmlns', 'display', 'encoding'].includes(attr.name))) el.removeAttribute(attr.name);
      });
      if (el.hasAttribute('href') || el.hasAttribute('src')) {
        const attr = el.hasAttribute('href') ? 'href' : 'src';
        try { if (!['http:', 'https:', 'mailto:'].includes(new URL(el.getAttribute(attr), location.origin).protocol)) el.removeAttribute(attr); } catch { el.removeAttribute(attr); }
      }
    });
    const article = node('article', 'terminal-document');
    article.append(...[...parsed.body.childNodes].map(el => document.importNode(el, true)));
    return article;
  }
  window.BlogTerminal = {
    mount({ content, win, profile, openURL, close, internalURL }) {
      const prompt = () => {
        const el = node('span', 'terminal-prompt');
        el.append(node('span', 'terminal-user', `${profile.name}@blog`), node('span', '', ':'), node('span', 'terminal-directory', '~'), node('span', '', '$ ')); return el;
      };
      const commandLine = text => { const line = node('div', 'terminal-command-line'); line.append(prompt(), node('span', 'terminal-command', text)); return line; };
      const hint = () => node('p', 'terminal-welcome', "Type 'help' to learn more. Try 'posts' to start exploring.");
      const fastfetch = () => {
        const panel = node('div', 'terminal-fastfetch');
        const avatar = node('img', 'fastfetch-avatar'); avatar.src = profile.avatar; avatar.alt = `${profile.name} 的头像`;
        const info = node('div', 'fastfetch-info');
        const title = `${profile.name}@blog`, heading = node('a', 'fastfetch-heading', title); heading.href = '/about/';
        heading.onclick = event => { event.preventDefault(); showPage('/about/'); };
        info.append(heading, node('div', 'fastfetch-separator', '-'.repeat(title.length)));
        const stats = profile.stats;
        const days = Math.max(1, Math.floor((Date.now() - new Date(`${stats.started}T00:00:00+08:00`).getTime()) / 86400000) + 1);
        const host = new URL(profile.github).pathname.split('/').filter(Boolean)[0] + '.github.io';
        const rows = [['Site', host, '/'], ['Host', 'GitHub Pages'], ['Framework', 'Astro'], ['Posts', profile.postCount], ['Categories', stats.categories], ['Tags', stats.tags], ['Uptime', `${days} days`], ['Words', `${(stats.words / 1000).toFixed(1)}k`], ['Updated', stats.updated], ['GitHub', profile.github.replace(/^https?:\/\//, ''), profile.github], ['Email', profile.email.replace(/^mailto:/, ''), profile.email]];
        rows.forEach(([label, value, href]) => {
          const row = node('div', 'fastfetch-row'), description = node('span', 'fastfetch-value');
          row.append(node('strong', 'fastfetch-key', `${label}:`.padEnd(12, ' ')));
          if (href) {
            const link = node('a', '', String(value)); link.href = href;
            if (href.startsWith('/')) link.onclick = event => { event.preventDefault(); showPage(href); };
            else if (!href.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
            description.append(link);
          } else description.textContent = String(value);
          row.append(description); info.append(row);
        });
        const colors = node('div', 'fastfetch-colors');
        for (let group = 0; group < 2; group++) {
          const line = node('div', 'fastfetch-color-row');
          for (let i = 0; i < 8; i++) line.append(node('span', `ansi-color ansi-${group * 8 + i}`, '   '));
          colors.append(line);
        }
        info.append(colors); panel.append(avatar, info); return panel;
      };
      const output = node('div', 'terminal-output'); output.append(commandLine('fastfetch'), fastfetch(), hint());
      const form = node('form', 'terminal-input'), input = node('input');
      input.autocomplete = 'off'; input.spellcheck = false; input.autocapitalize = 'off'; input.setAttribute('autocorrect', 'off'); input.setAttribute('aria-label', '桌面终端命令');
      form.append(prompt(), input); content.append(output, form);
      const app = node('section', 'terminal-app'); app.tabIndex = 0; app.hidden = true; app.setAttribute('aria-label', '命令行页面浏览器'); content.append(app);
      const appHistory = [], commandHistory = [];
      let historyIndex = 0, draft = '', state = null, data, request = 0, destroyed = false, loading = false;
      let listHost, preview, pane, footer, searchForm, searchInput, searchCount, headerPath;
      const print = (text, className = '') => output.append(node('div', className, text));
      const scrollOutput = () => { win.body.scrollTop = win.body.scrollHeight; };
      const focusShell = () => input.focus({ preventScroll: true });
      const focusApp = () => app.focus({ preventScroll: true });
      const setTitle = title => { win.title = title; win.titleNode.textContent = title; win.el.setAttribute('aria-label', title); };
      const leave = () => {
        loading = false; request++; state = null; appHistory.length = 0; app.hidden = true; app.replaceChildren();
        content.classList.remove('is-browsing'); win.body.classList.remove('is-terminal-app');
        setTitle(`${profile.name}@blog: ~`); focusShell(); scrollOutput();
      };
      const back = () => {
        request++;
        if (loading) { loading = false; if (state) render(); else leave(); return; }
        if (appHistory.length) { state = appHistory.pop(); render(); } else leave();
      };
      const remember = () => { if (state) { state.scroll = pane?.scrollTop || 0; appHistory.push(state); } };
      const browserURL = value => {
        const path = pagePaths[value] || (value.startsWith('/') ? value : `/${value}/`);
        return internalURL(path);
      };
      const makeLink = (text, href) => {
        const link = node('a', '', text); link.href = href;
        if (!internalURL(href) && !href.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        return link;
      };
      async function showPage(value, rememberPage = true) {
        const url = browserURL(value);
        if (!url) throw new Error('Unknown site path. Use home to browse pages.');
        const token = ++request; loading = true;
        const previous = state;
        if (previous) previous.scroll = pane?.scrollTop || 0;
        content.classList.add('is-browsing'); win.body.classList.add('is-terminal-app'); app.hidden = false;
        app.replaceChildren(node('div', 'terminal-loading', 'Connecting to blog…')); focusApp();
        try {
          data = await loadData();
          if (destroyed || token !== request) return;
          const parsed = new URL(url, location.origin), path = parsed.pathname.replace(/\/$/, '') || '/';
          let next;
          const entries = data.posts.map(post => ({ title: post.title, meta: `${post.date} · ${post.category}`, description: post.description, tags: post.tags, url: post.url, slug: post.slug, kind: 'md', action: () => showPage(post.url) }));
          if (path === '/' || path === '/posts' || path === '/updates') {
            let items = entries;
            if (path === '/') {
              items = Object.entries(pagePaths).filter(([key]) => key !== 'home').map(([key, url]) => ({ title: key, meta: commands[key][1], description: commands[key][2], kind: 'dir', url, action: () => showPage(url) }));
              items.push(...entries);
            }
            if (path === '/updates') items = [...entries].sort((a, b) => data.posts.find(post => post.url === b.url).updatedDate.localeCompare(data.posts.find(post => post.url === a.url).updatedDate)).map(item => ({ ...item, meta: `updated ${data.posts.find(post => post.url === item.url).updatedDate}` }));
            const filter = parsed.searchParams.get('q') || parsed.searchParams.get('tag') || parsed.searchParams.get('category') || '';
            next = { type: 'list', path: url, title: path === '/' ? 'HOME' : path === '/posts' ? 'POSTS' : 'UPDATES', items, query: filter, selected: 0 };
          } else if (path === '/friends') {
            next = { type: 'list', path: url, title: 'FRIENDS', items: data.friends.map(friend => ({ title: friend.name, meta: new URL(friend.url).host, description: friend.description, url: friend.url, kind: 'link', action: () => window.open(friend.url, '_blank', 'noopener,noreferrer') })), query: '', selected: 0 };
          } else if (path === '/about') {
            const article = node('article', 'terminal-document');
            article.append(node('h1', '', data.profile.about.heading), ...data.profile.about.paragraphs.map(text => node('p', '', text)), node('h2', '', 'Contact'), makeLink('GitHub', data.profile.github), node('p', '', ''), makeLink(data.profile.email.replace('mailto:', ''), data.profile.email));
            next = { type: 'reader', path: url, title: 'ABOUT', article };
          } else if (path === '/guestbook') {
            const article = node('article', 'terminal-document');
            article.append(node('h1', '', '留言板'), node('p', '', '欢迎留下想法、问题，或只是打个招呼。'), node('p', '', '按 c 载入实时留言。使用 Tab 浏览 GitHub 留言控件，登录后即可留言。'));
            next = { type: 'reader', path: url, title: 'GUESTBOOK', article, term: 'guestbook' };
          } else {
            const post = data.posts.find(item => item.url.replace(/\/$/, '') === path);
            if (!post) throw new Error('Page not found. Use posts to find an article.');
            const article = safeDocument(post.html);
            article.prepend(node('p', 'terminal-article-meta', `${post.date} · ${post.category} · ${(post.wordCount / 1000).toFixed(1)}k`), node('h1', '', post.title));
            next = { type: 'reader', path: url, title: post.slug.toUpperCase(), article, term: `post-${post.slug}` };
          }
          loading = false;
          if (rememberPage && previous) appHistory.push(previous);
          state = next; render();
        } catch (error) {
          if (destroyed || token !== request) return;
          leave(); print(`open: ${error.message}`, 'terminal-error'); scrollOutput();
        }
      }
      function shellButton(text, label, callback) {
        const el = node('button', '', text); el.type = 'button'; el.setAttribute('aria-label', label); el.onclick = callback; return el;
      }
      function render() {
        app.replaceChildren(); setTitle(`${profile.name}@blog: ${state.path}`);
        const header = node('header', 'terminal-browser-header');
        headerPath = node('span', 'terminal-browser-path', `blog:${state.path}`);
        header.append(shellButton('‹', '返回命令行上一级', back), headerPath, shellButton('×', '退出命令行页面浏览器', leave));
        searchForm = node('form', 'terminal-browser-search'); searchForm.hidden = true;
        searchInput = node('input'); searchInput.type = 'search'; searchInput.autocomplete = 'off'; searchInput.setAttribute('aria-label', state.type === 'list' ? '终端列表搜索' : '终端页面搜索');
        searchInput.placeholder = state.type === 'list' ? 'Filter…' : 'Find in page…'; searchInput.value = state.query || '';
        searchCount = node('span', 'terminal-search-count'); searchForm.append(node('span', '', '/'), searchInput, searchCount);
        searchForm.onsubmit = event => { event.preventDefault(); searchForm.hidden = true; focusApp(); if (state.type === 'reader') jumpMatch(1, true); };
        searchInput.oninput = () => { state.query = searchInput.value; if (state.type === 'list') { state.selected = 0; renderList(); } else findText(); };
        searchInput.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); searchForm.hidden = true; focusApp(); } };
        footer = node('footer', 'terminal-browser-footer'); footer.setAttribute('role', 'status');
        app.append(header, searchForm);
        if (state.type === 'list') {
          const split = node('div', 'terminal-browser-split');
          pane = node('div', 'terminal-browser-list-pane'); listHost = node('div', 'terminal-browser-list'); listHost.setAttribute('role', 'list');
          pane.append(node('h2', 'terminal-section-title', state.title), listHost);
          preview = node('aside', 'terminal-browser-preview'); split.append(pane, preview); app.append(split); renderList();
        } else {
          pane = node('div', 'terminal-browser-reader'); pane.append(state.article); app.append(pane);
          if (state.query) findText();
          pane.scrollTop = state.scroll || 0;
          pane.addEventListener('scroll', readerStatus, { passive: true }); readerStatus();
        }
        app.append(footer); focusApp();
      }
      function filteredItems() {
        const words = (state.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
        return state.items.filter(item => words.every(word => `${item.title} ${item.meta} ${item.description} ${(item.tags || []).join(' ')} ${item.slug || ''}`.toLocaleLowerCase().includes(word)));
      }
      function renderList() {
        const items = filteredItems(); state.selected = Math.max(0, Math.min(state.selected, items.length - 1));
        listHost.replaceChildren();
        items.forEach((item, index) => {
          const row = shellButton('', `打开 ${item.title}`, () => { if (state.selected === index) item.action(); else { state.selected = index; renderList(); focusApp(); } });
          row.className = `terminal-list-row${index === state.selected ? ' is-selected' : ''}`;
          row.setAttribute('aria-current', String(index === state.selected)); row.setAttribute('role', 'listitem');
          row.append(node('span', 'terminal-list-number', `${index === state.selected ? '›' : ' '} ${String(index + 1).padStart(2, '0')}`), node('span', 'terminal-list-kind', item.kind), node('span', 'terminal-list-title', item.title), node('span', 'terminal-list-meta', item.meta));
          row.ondblclick = () => item.action(); listHost.append(row);
        });
        if (!items.length) listHost.append(node('p', 'terminal-note', 'No matching entries. Press / to change the filter.'));
        const item = items[state.selected];
        preview.replaceChildren(node('span', 'terminal-preview-label', 'PREVIEW'));
        if (item) preview.append(node('h2', '', item.title), node('p', 'terminal-note', item.meta), node('p', '', item.description || item.url), node('p', 'terminal-preview-tags', (item.tags || []).map(tag => `#${tag}`).join(' ')), node('p', 'terminal-note', item.url));
        footer.textContent = `j/k ↑/↓ select · Enter open · / search · q back  ${items.length ? state.selected + 1 : 0}/${items.length}`;
        searchCount.textContent = `${items.length} entries`;
        const row = listHost.children[state.selected];
        if (row) { const top = row.offsetTop - pane.offsetTop; if (top < pane.scrollTop || top + row.offsetHeight > pane.scrollTop + pane.clientHeight) pane.scrollTo({ top: Math.max(0, top - pane.clientHeight / 2), behavior: 'instant' }); }
      }
      function readerStatus() {
        if (state?.type !== 'reader') return;
        const max = Math.max(0, pane.scrollHeight - pane.clientHeight);
        footer.textContent = `j/k scroll · / find · t toc · l links · q back${state.term ? ' · c comments' : ''}  ${max ? Math.round(pane.scrollTop / max * 100) : 100}%${state.matches?.length && state.matchIndex >= 0 ? ` · ${state.matchIndex + 1}/${state.matches.length} matches (n/N)` : ''}`;
      }
      function findText() {
        state.article.querySelectorAll('mark.terminal-search-hit').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
        state.article.normalize(); state.matches = []; state.matchIndex = -1;
        const query = (state.query || '').trim();
        if (query) {
          const walker = document.createTreeWalker(state.article, NodeFilter.SHOW_TEXT);
          const texts = []; let text;
          while ((text = walker.nextNode())) if (!text.parentElement.closest('.katex, .terminal-comments')) texts.push(text);
          texts.forEach(text => {
            const value = text.textContent, lower = value.toLocaleLowerCase(), needle = query.toLocaleLowerCase();
            let position = 0, match = lower.indexOf(needle), fragment = document.createDocumentFragment();
            if (match === -1) return;
            while (match !== -1) {
              fragment.append(document.createTextNode(value.slice(position, match)));
              const mark = node('mark', 'terminal-search-hit', value.slice(match, match + query.length)); fragment.append(mark); state.matches.push(mark);
              position = match + query.length; match = lower.indexOf(needle, position);
            }
            fragment.append(document.createTextNode(value.slice(position))); text.replaceWith(fragment);
          });
        }
        searchCount.textContent = `${state.matches.length} matches`;
      }
      function jumpTo(el) { pane.scrollTo({ top: el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 24, behavior: 'instant' }); }
      function jumpMatch(direction, first = false) {
        if (!state.matches?.length) return;
        state.matches.forEach(el => el.classList.remove('is-current'));
        state.matchIndex = first ? 0 : (state.matchIndex + direction + state.matches.length) % state.matches.length;
        const match = state.matches[state.matchIndex]; match.classList.add('is-current'); jumpTo(match);
        footer.textContent = `n/N next/previous · / find · q back  ${state.matchIndex + 1}/${state.matches.length} matches`;
      }
      function showOutline(links = false) {
        const reader = state, elements = [...reader.article.querySelectorAll(links ? 'a[href]' : 'h1,h2,h3,h4')];
        if (!elements.length) { footer.textContent = links ? 'No links on this page. q back' : 'No headings on this page. q back'; return; }
        remember();
        state = { type: 'list', path: `${reader.path}${links ? ':links' : ':toc'}`, title: links ? 'LINKS' : 'CONTENTS', query: '', selected: 0, items: elements.map(el => ({
          title: el.textContent.trim() || el.getAttribute('href'), meta: links ? el.getAttribute('href') : el.tagName.toLowerCase(), kind: links ? 'link' : 'h', description: '',
          action: () => {
            if (links) followLink(el);
            else { back(); jumpTo(el); }
          },
        })) }; render();
      }
      function followLink(link) {
        const href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('#')) {
          const reader = state.type === 'reader' ? state : [...appHistory].reverse().find(page => page.type === 'reader');
          const target = [...reader.article.querySelectorAll('[id]')].find(el => el.id === decodeURIComponent(href.slice(1)));
          if (target) { if (state !== reader) back(); jumpTo(target); }
        } else if (internalURL(href)) showPage(href);
        else window.open(link.href, '_blank', 'noopener,noreferrer');
      }
      function comments() {
        if (!state.term) return;
        const existing = state.article.querySelector('.terminal-comments');
        if (existing) { jumpTo(existing); existing.querySelector('iframe')?.focus(); return; }
        const host = node('section', 'terminal-comments'); host.append(node('h2', '', state.term === 'guestbook' ? '留言' : '评论'));
        const note = node('p', 'terminal-note', 'GitHub Discussions · Tab to reach the discussion controls'); host.append(note);
        const mount = node('div', 'giscus'); host.append(mount); state.article.append(host);
        const script = node('script'); script.src = 'https://giscus.app/client.js'; script.async = true; script.crossOrigin = 'anonymous';
        Object.assign(script.dataset, { repo: data.giscus.repo, repoId: data.giscus.repoId, category: data.giscus.category, categoryId: data.giscus.categoryId, mapping: 'specific', term: state.term, strict: '0', reactionsEnabled: '1', emitMetadata: '0', inputPosition: 'top', theme: 'dark_dimmed', lang: 'zh-CN' });
        mount.append(script); jumpTo(host);
      }
      app.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (link && state?.type === 'reader' && !event.ctrlKey && !event.metaKey && !event.shiftKey) { event.preventDefault(); followLink(link); }
      });
      win.el.addEventListener('keydown', event => {
        if (app.hidden) return;
        if (event.target.matches('input, textarea') || event.altKey || event.metaKey) return;
        const key = event.key;
        const known = ['q', 'Escape', 'Backspace', 'j', 'k', 'ArrowUp', 'ArrowDown', 'Enter', '/', 'g', 'G', 'Home', 'End', ' ', 'b', 'PageDown', 'PageUp', 't', 'l', 'n', 'N', 'c', '?'];
        const ctrl = event.ctrlKey && ['c', 'd', 'u'].includes(key.toLowerCase());
        if (event.ctrlKey && !ctrl) return;
        if (!known.includes(key) && !ctrl) return;
        event.preventDefault(); event.stopPropagation();
        if (ctrl && key.toLowerCase() === 'c') { leave(); return; }
        if (['q', 'Escape', 'Backspace'].includes(key)) { back(); return; }
        if (!state) return;
        if (key === '/') { searchForm.hidden = false; searchInput.focus(); searchInput.select(); return; }
        if (key === '?') { footer.textContent = state.type === 'list' ? 'j/k ↑/↓ · Enter open · / filter · g/G first/last · q back · Ctrl+C shell' : 'j/k ↑/↓ · Space/b page · g/G start/end · / find · n/N next/previous · t toc · l links · c comments · q back'; return; }
        if (state.type === 'list') {
          const items = filteredItems(), step = Math.max(1, Math.floor(pane.clientHeight / 66) - 1);
          if (key === 'Enter') { items[state.selected]?.action(); return; }
          if (['g', 'Home'].includes(key)) state.selected = 0;
          else if (['G', 'End'].includes(key)) state.selected = items.length - 1;
          else state.selected += ['k', 'ArrowUp', 'b', 'PageUp', 'u'].includes(key) ? (['b', 'PageUp', 'u'].includes(key) ? -step : -1) : ['j', 'ArrowDown', ' ', 'PageDown', 'd'].includes(key) ? ([' ', 'PageDown', 'd'].includes(key) ? step : 1) : 0;
          renderList();
        } else {
          if (key === 't' || key === 'l') { showOutline(key === 'l'); return; }
          if (key === 'n' || key === 'N') { jumpMatch(key === 'n' ? 1 : -1); return; }
          if (key === 'c') { comments(); return; }
          if (['g', 'Home'].includes(key)) pane.scrollTop = 0;
          else if (['G', 'End'].includes(key)) pane.scrollTop = pane.scrollHeight;
          else {
            const direction = ['k', 'ArrowUp', 'b', 'PageUp', 'u'].includes(key) ? -1 : 1;
            const amount = ctrl ? pane.clientHeight / 2 : [' ', 'b', 'PageDown', 'PageUp'].includes(key) ? pane.clientHeight * .85 : ['j', 'k', 'ArrowUp', 'ArrowDown'].includes(key) ? 44 : 0;
            pane.scrollBy({ top: direction * amount, behavior: 'instant' });
          }
          readerStatus();
        }
      });
      win.el.addEventListener('focus', () => app.hidden ? focusShell() : focusApp());
      content.addEventListener('click', event => {
        if (!event.target.closest('a, button, input, iframe') && !getSelection()?.toString()) app.hidden ? focusShell() : focusApp();
      });
      async function run(text) {
        let args;
        try { args = parse(text); } catch (error) { print(error.message, 'terminal-error'); return; }
        if (destructiveCommand(text, args)) { simulateCrash(text); return; }
        const command = args.shift();
        if (command === 'rm') { print('rm: the blog filesystem is read-only.', 'terminal-error'); return; }
        if (!commands[command]) { print(`${command}: command not found. Type 'help' to see available commands.`, 'terminal-error'); return; }
        if (args.includes('--help') || args.includes('-h')) { output.append(manual(command)); return; }
        if (command === 'help' || command === 'man') {
          const mode = args.find(arg => ['-s', '-d', '-m'].includes(arg)), name = args.find(arg => !arg.startsWith('-'));
          if (args.some(arg => arg.startsWith('-') && !['-s', '-d', '-m'].includes(arg))) { print('help: unknown option. Usage: help [-d | -s | -m] [command]', 'terminal-error'); return; }
          output.append(name ? manual(name, mode) : help());
        } else if (command === 'fastfetch') output.append(fastfetch(), hint());
        else if (command === 'clear') output.replaceChildren();
        else if (command === 'history') commandHistory.forEach((item, index) => print(`${String(index + 1).padStart(4)}  ${item}`));
        else if (command === 'date') print(new Date().toLocaleString('en-GB'));
        else if (command === 'whoami') print(profile.name);
        else if (command === 'pwd') print(`/home/${profile.name}`);
        else if (command === 'echo') print(args.join(' '));
        else if (command === 'exit') close(win);
        else if (command === 'reboot') location.reload();
        else if (command === 'ls') {
          if (args[0] === 'posts') { const data = await loadData(); data.posts.forEach((post, index) => print(`${String(index + 1).padStart(2)}  ${post.slug.padEnd(24)} ${post.title}`)); }
          else if (args.length) print(`ls: unknown directory '${args[0]}'. Try ls posts.`, 'terminal-error');
          else print('posts/  about/  friends/  guestbook/  updates/');
        } else if (command === 'read' || command === 'cat') {
          if (!args.length) { output.append(manual(command)); return; }
          const data = await loadData(), post = /^\d+$/.test(args[0]) ? data.posts[Number(args[0]) - 1] : data.posts.find(item => item.slug === args[0] || item.url === args[0]);
          if (!post) print(`read: article '${args[0]}' not found. Use ls posts.`, 'terminal-error'); else await showPage(post.url);
        } else if (command === 'open' || command === 'cd') {
          const graphical = args[0] === '--gui'; if (graphical) args.shift();
          if (!args.length) { output.append(manual(command)); return; }
          const path = browserURL(args.join(' '));
          if (!path) print('open: unknown path. Use home to browse pages.', 'terminal-error');
          else if (graphical) openURL(path); else await showPage(path);
        } else {
          const path = command === 'posts' && args.length ? `/posts/?q=${encodeURIComponent(args.join(' '))}` : pagePaths[command];
          await showPage(path);
        }
      }
      input.addEventListener('keydown', async event => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault(); if (historyIndex === commandHistory.length) draft = input.value;
          historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
          input.value = historyIndex === commandHistory.length ? draft : commandHistory[historyIndex]; input.setSelectionRange(input.value.length, input.value.length);
        }
        if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); output.replaceChildren(); }
        if (event.ctrlKey && event.key.toLowerCase() === 'c' && !getSelection()?.toString()) { event.preventDefault(); output.append(commandLine(`${input.value}^C`)); input.value = ''; scrollOutput(); }
        if (event.key === 'Tab') {
          event.preventDefault(); const value = input.value, parts = value.split(/\s+/), partial = parts.at(-1);
          let choices = Object.keys(commands);
          if (parts.length > 1 && !['help', 'man'].includes(parts[0])) {
            const data = await loadData().catch(() => null);
            if (!data || destroyed || input.value !== value) return;
            choices = ['read', 'cat'].includes(parts[0]) ? data.posts.map(post => post.slug) : Object.values(pagePaths).concat(data.posts.map(post => post.url));
          }
          const matches = choices.filter(choice => choice.startsWith(partial));
          if (matches.length === 1) input.value = parts.slice(0, -1).concat(matches[0]).join(' ') + (parts.length === 1 ? ' ' : '');
          else if (matches.length) { let prefix = matches[0]; while (!matches.every(match => match.startsWith(prefix))) prefix = prefix.slice(0, -1); input.value = parts.slice(0, -1).concat(prefix).join(' '); if (prefix === partial) { print(matches.join('  '), 'terminal-note'); scrollOutput(); } }
        }
      });
      let running = false;
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (running) return;
        const text = input.value.trim(); input.value = ''; if (!text) return;
        commandHistory.push(text); historyIndex = commandHistory.length; draft = ''; output.append(commandLine(text)); running = true;
        try { await run(text); } catch (error) { if (!destroyed) print(`shell: ${error.message}`, 'terminal-error'); }
        finally { running = false; if (!destroyed && app.hidden) scrollOutput(); }
      });
      return { focus() {
        if (app.hidden) focusShell();
        else if (!app.contains(document.activeElement) || !document.activeElement.matches('input, textarea, iframe')) focusApp();
      }, browse: showPage, destroy() { destroyed = true; request++; } };
    },
  };
})();
