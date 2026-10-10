import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

class Element {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {}; this.style = {}; this.value = ''; this.scrollTop = 0; this.scrollHeight = 800; this.clientHeight = 400; this.offsetTop = 0; this.offsetHeight = 60; }
  get classList() { const el = this; return { add(...names) { el.className = [...new Set([...(el.className || '').split(' '), ...names])].join(' '); }, remove(...names) { el.className = (el.className || '').split(' ').filter(name => !names.includes(name)).join(' '); }, contains(name) { return (el.className || '').split(' ').includes(name); }, toggle(name, force) { const has = this.contains(name), next = force ?? !has; if (next) this.add(name); else this.remove(name); return next; } }; }
  append(...nodes) { nodes.forEach(node => { this.children.push(node); if (typeof node === 'object') node.parentElement = this; }); }
  prepend(...nodes) { this.children.unshift(...nodes); nodes.forEach(node => { node.parentElement = this; }); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  removeEventListener(name, callback) { this.listeners[name] = (this.listeners[name] || []).filter(fn => fn !== callback); }
  async emit(name, detail = {}) { const event = { target: this, preventDefault() {}, stopPropagation() {}, ...detail }; await this[`on${name}`]?.(event); for (const callback of this.listeners[name] || []) await callback(event); }
  matches(selector) { return selector.split(',').some(raw => { const part = raw.trim(); if (part.startsWith('.')) return this.classList.contains(part.slice(1)); return this.tagName.toLowerCase() === part; }); }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
  querySelectorAll(selector) { return this.children.filter(child => typeof child === 'object').flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { document.activeElement = this; }
  blur() { if (document.activeElement === this) document.activeElement = null; }
  select() {} setSelectionRange() {}
  contains(el) { return this === el || this.children.some(child => child?.contains?.(el)); }
  scrollTo({ top }) { this.scrollTop = top; }
  scrollBy({ top }) { this.scrollTop += top; }
  getBoundingClientRect() { return { top: 0 }; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
  get textContent() { return (this.text || '') + this.children.map(child => typeof child === 'object' ? child.textContent : child).join(''); }
  set textContent(value) { this.text = String(value); this.children = []; }
}
const document = { createElement: tag => new Element(tag), documentElement: new Element('html'), body: new Element('body'), querySelector: () => null, querySelectorAll: () => [] };
const opened = [], scheduled = [];
const location = { origin: 'https://spartan-x125.github.io', reload() { location.reloaded = true; } };
const window = { open: (...args) => opened.push(args) };
const context = { window, document, location, URL, URLSearchParams, Element, console, getSelection: () => null, matchMedia: () => ({ matches: false }), setTimeout: (fn, time) => { scheduled.push({ fn, time }); return scheduled.length; }, clearTimeout() {} };
const load = name => runInNewContext(readFileSync(new URL(`../public/${name}.js`, import.meta.url), 'utf8'), context);
const internalURL = value => { const url = new URL(value, location.origin); url.searchParams.delete('embed'); return url.origin === location.origin ? url.pathname + url.search + url.hash : null; };
load('browser');
assert.equal(window.BlogBrowser.normalize('for-each.cn'), 'https://for-each.cn/');
assert.equal(window.BlogBrowser.normalize('/about/'), `${location.origin}/about/`);
assert.equal(window.BlogBrowser.normalize('localhost:4322'), 'http://localhost:4322/');
for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///C:/']) assert.throws(() => window.BlogBrowser.normalize(url));
const win = { el: new Element('section'), bar: new Element('header'), titleNode: new Element('span'), body: new Element('div') };
win.bar.append(Object.assign(new Element('div'), { className: 'window-actions' }));
const content = new Element('div');
const browser = window.BlogBrowser.mount({ content, win, url: '/about/', internalURL, iconButton: (icon, label) => { const button = new Element('button'); button.setAttribute('aria-label', label); return button; } });
assert.match(browser.frame.src, /\/about\/\?embed=1$/);
browser.navigate('https://for-each.cn/');
assert.equal(browser.url, 'https://for-each.cn/');
const [toolbar] = content.children, [back, forward, reload, form] = toolbar.children;
await back.emit('click'); assert.match(browser.url, /\/about\/$/);
await forward.emit('click'); assert.equal(browser.url, 'https://for-each.cn/');
await back.emit('click'); browser.navigate('/friends/'); assert.equal(forward.disabled, true);
await reload.emit('click'); assert.equal(forward.disabled, true);
form.children[0].value = 'javascript:alert(1)'; await form.emit('submit'); assert.match(browser.url, /\/friends\/$/);
await win.bar.querySelector('.window-actions').children[0].emit('click');
assert.deepEqual(opened.at(-1), [`${location.origin}/friends/`, '_blank', 'noopener,noreferrer']);
browser.navigate('/about');
browser.frame.contentDocument = { location: { protocol: 'https:', href: `${location.origin}/about/?embed=1` }, querySelector: () => null, title: 'About' };
await browser.frame.emit('load');
assert.match(browser.url, /\/about\/$/);
await back.emit('click'); assert.match(browser.url, /\/friends\/$/, 'A redirect should replace an entry rather than trapping Back');
browser.destroy(); assert.ok(!content.children.includes(browser.frame));

const desktopCode = readFileSync(new URL('../public/desktop.js', import.meta.url), 'utf8');
const desktopWindows = new Map();
const openContext = { internalURL, make: tag => new Element(tag), URL, location, window, $: (selector, scope) => scope.querySelector(selector), iconButton: () => new Element('button'), apps: [{ url: '/about/', name: 'About', icon: 'user' }], windows: desktopWindows, focusWindow() {}, syncAppearance() {}, refreshChrome() {},
  createWindow(options) { const result = { ...options, id: `window-${desktopWindows.size + 1}`, el: new Element(), bar: new Element('header') }; result.bar.append(Object.assign(new Element('div'), { className: 'window-actions' })); desktopWindows.set(result.id, result); return result; },
};
runInNewContext(desktopCode.slice(desktopCode.indexOf('  function openURL('), desktopCode.indexOf('  function openBrowser(')) + '\nthis.open = openURL;', openContext);
const one = openContext.open('/about/'), two = openContext.open('/about/');
assert.equal(desktopWindows.size, 2); assert.notEqual(one.id, two.id); assert.notEqual(one.frame, two.frame);
const clab = openContext.open('/clab/');
clab.frame.contentWindow = { location: { href: `${location.origin}/clab/?embed=1&mode=lab#workspace` } };
await clab.bar.querySelector('.window-actions').children[0].emit('click');
assert.deepEqual(opened.at(-1), [`${location.origin}/clab/?mode=lab#workspace`, '_blank', 'noopener,noreferrer']);

context.fetch = async () => ({ ok: true, json: async () => ({ posts: [], friends: [
  { name: 'Alpha', url: 'https://alpha.example/', description: 'Alpha site', preview: '/friend-previews/alpha.webp' },
  { name: 'for_each', url: 'https://for-each.cn/', description: 'for_each site', preview: '/friend-previews/for-each.webp' },
] }) });
load('terminal');
const profile = { name: 'Spartan_x', avatar: '/avatar/avatar.jpg', github: 'https://github.com/spartan-x125', email: 'mailto:spartan_x@126.com', postCount: 2, stats: { started: '2026-05-16', words: 12345, categories: 1, tags: 2, updated: '2026-10-10' } };
const terminalContent = new Element('div'), terminalWin = { ...win, el: new Element('section'), body: new Element('div'), titleNode: new Element('span') }, friendWindows = [];
let starCalls = 0;
const terminal = window.BlogTerminal.mount({ content: terminalContent, win: terminalWin, profile, internalURL, openURL() {}, openBrowser: url => friendWindows.push(url), openStars: async () => { starCalls++; }, close() {}, openTerminal() {}, goBack() {} });
const terminalForm = terminalContent.querySelector('.terminal-input'), input = terminalForm.children[1];
input.value = 'stars'; await terminalForm.emit('submit'); assert.equal(starCalls, 1);
input.value = 'help friends'; await terminalForm.emit('submit'); assert.match(terminalContent.textContent, /separate browser card/);
await terminal.browse('/friends/');
const app = terminalContent.querySelector('.terminal-app');
assert.equal(app.querySelector('.terminal-friend-preview').src, '/friend-previews/alpha.webp');
assert.equal(app.querySelector('.terminal-friend-preview').tagName, 'IMG');
assert.equal(app.querySelectorAll('iframe').length, 0);
const row = app.querySelectorAll('.terminal-list-row')[1];
await row.emit('pointermove', { movementX: 3, movementY: 1 });
assert.equal(app.querySelector('.terminal-friend-preview').src, '/friend-previews/for-each.webp');
assert.equal(app.querySelectorAll('iframe').length, 0);
await row.emit('click');
await terminalWin.el.emit('keydown', { target: app, key: 'ArrowRight' });
assert.equal(friendWindows.at(-1), 'https://for-each.cn/');
await terminalWin.el.emit('keydown', { target: app, key: 'ArrowUp' });
await terminalWin.el.emit('keydown', { target: app, key: 'Enter' });
assert.equal(friendWindows.at(-1), 'https://alpha.example/');
await terminalWin.el.emit('keydown', { target: app, key: 'q' });
input.value = 'rm -rf /\\*'; await terminalForm.emit('submit');
assert.equal(document.documentElement.dataset.crashed, 'true');
assert.equal(document.body.querySelector('.terminal-crash'), null, 'Blue screen must follow the shell output, not replace it immediately');
scheduled.sort((a, b) => a.time - b.time);
const early = scheduled.filter(item => item.time < 2650);
early.forEach(item => item.fn());
assert.ok(terminalContent.querySelectorAll('.terminal-rm-error').length >= 50);
assert.match(terminalContent.textContent, /Read-only file system/);
scheduled.filter(item => item.time >= 2650).forEach(item => item.fn());
assert.ok(document.body.querySelector('.terminal-crash'));
assert.match(document.body.textContent, /CRITICAL_INIT_PROCESS_DIED/);
await document.body.querySelector('.terminal-reboot').emit('click'); assert.equal(location.reloaded, true);
assert.ok(opened.every(args => !args[0].includes('for-each')), 'Terminal friends must open cards rather than real tabs');
terminal.destroy();
console.log('Verified independent repeated windows, browser URL validation, back/forward/reload, real-tab action, terminal friends preview, mouse-to-keyboard selection, stars dispatch, staged Linux errors and blue-screen reboot.');
