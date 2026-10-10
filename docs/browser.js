(() => {
  'use strict';
  const node = (tag, name, text) => {
    const el = document.createElement(tag);
    if (name) el.className = name;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const normalize = value => {
    const text = String(value).trim();
    if (!text) throw new Error('请输入网址');
    const hasPort = /^[\w.-]+:\d+(?:\/|$)/.test(text);
    const href = !hasPort && /^(?:[a-z][\w+.-]*:|\/|\?|#)/i.test(text) ? text : `${/^(localhost|127\.0\.0\.1)(:|\/|$)/.test(text) ? 'http' : 'https'}://${text}`;
    const url = new URL(href, location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('仅支持 HTTP 或 HTTPS 网址');
    if (url.origin === location.origin) url.searchParams.delete('embed');
    return url.href;
  };
  window.BlogBrowser = {
    normalize,
    mount({ content, win, url, iconButton, internalURL, changed }) {
      const toolbar = node('div', 'browser-toolbar');
      const back = iconButton('left', '浏览器后退');
      const forward = iconButton('right', '浏览器前进');
      const reload = iconButton('restart', '重新加载网页');
      const form = node('form', 'browser-address');
      const address = node('input'); address.type = 'text'; address.autocomplete = 'off'; address.spellcheck = false;
      address.setAttribute('aria-label', '浏览器地址');
      const go = iconButton('right', '访问网址'); go.type = 'submit';
      form.append(address, go); toolbar.append(back, forward, reload, form);
      const status = node('div', 'browser-error'); status.hidden = true; status.setAttribute('role', 'status');
      const frame = node('iframe', 'browser-frame'); frame.title = '浏览器网页';
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
      const external = iconButton('external', '在浏览器新标签页打开当前网页'); external.className = 'browser-external';
      win.bar.querySelector('.window-actions').prepend(external);
      content.append(toolbar, status, frame);
      const history = []; let index = -1, current = '', destroyed = false, pendingNavigation = false;
      const update = () => {
        address.value = current;
        back.disabled = index <= 0; forward.disabled = index >= history.length - 1;
        win.url = current;
        win.title = new URL(current).host; win.titleNode.textContent = win.title;
        win.el.setAttribute('aria-label', `浏览器 · ${win.title}`);
        external.title = `在新标签页打开 ${current}`;
        changed?.();
      };
      const navigate = (value, record = true) => {
        let next;
        try { next = normalize(value); } catch (error) { status.hidden = false; status.textContent = error.message; return false; }
        if (record) { history.splice(index + 1); history.push(next); index++; }
        current = next; status.hidden = true;
        frame.title = `浏览器网页 · ${new URL(next).host}`;
        const target = new URL(next);
        if (internalURL(next)) target.searchParams.set('embed', '1');
        pendingNavigation = true; content.classList.add('is-loading'); frame.src = target.href; update();
        return true;
      };
      const adopt = (value, record = true) => {
        const next = normalize(value);
        if (next !== current) {
          if (record) { history.splice(index + 1); history.push(next); index++; }
          else history[index] = next;
          current = next; update();
        }
      };
      const loaded = () => {
        if (destroyed) return;
        content.classList.remove('is-loading');
        try {
          const doc = frame.contentDocument;
          if (doc && doc.location.protocol !== 'about:') {
            adopt(doc.location.href, !pendingNavigation);
            const title = doc.querySelector('main h1')?.textContent || doc.title;
            if (title) { win.title = title; win.titleNode.textContent = title; }
          }
        } catch { /* Cross-origin pages keep the requested address. */ }
        pendingNavigation = false;
        changed?.();
      };
      frame.addEventListener('load', loaded);
      frame.addEventListener('error', () => { content.classList.remove('is-loading'); status.hidden = false; status.textContent = '网页无法嵌入，请使用右上角按钮在新标签页访问。'; });
      form.onsubmit = event => { event.preventDefault(); navigate(address.value); address.blur(); };
      back.onclick = () => { if (index > 0) navigate(history[--index], false); };
      forward.onclick = () => { if (index < history.length - 1) navigate(history[++index], false); };
      reload.onclick = () => navigate(current, false);
      external.onclick = () => window.open(current, '_blank', 'noopener,noreferrer');
      address.addEventListener('focus', () => address.select());
      navigate(url);
      return { frame, navigate, adopt, get url() { return current; }, destroy() { destroyed = true; frame.removeEventListener('load', loaded); frame.remove(); } };
    },
  };
})();
