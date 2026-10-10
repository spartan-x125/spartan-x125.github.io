(() => {
  'use strict';
  const definitions = [];
  const add = (id, label, webCode, niriCodes = [webCode], ctrl = false, shift = false, group = '窗口') => {
    definitions.push({ id, label, webCode, niriCodes, ctrl, shift, group, webShift: true });
  };
  add('launcher', '打开启动器', 'Space', ['Space', 'KeyD'], false, false, 'bar');
  add('controls', '控制中心', 'KeyS', ['KeyS'], false, false, 'bar');
  add('overview', '窗口总览', 'KeyO', ['KeyO'], false, false, 'bar');
  add('help', '操作指南', 'Slash', ['Slash'], false, true, 'bar');
  add('shortcuts', '快捷键设置', 'KeyV', ['KeyV'], false, false, 'bar');
  add('terminal', '新建终端', 'KeyT');
  add('close', '关闭当前窗口', 'KeyQ');
  add('focusLeft', '聚焦左侧窗口', 'ArrowLeft', ['ArrowLeft', 'KeyH']);
  add('focusRight', '聚焦右侧窗口', 'ArrowRight', ['ArrowRight', 'KeyL']);
  add('focusUp', '聚焦上方窗口', 'ArrowUp', ['ArrowUp', 'KeyK']);
  add('focusDown', '聚焦下方窗口', 'ArrowDown', ['ArrowDown', 'KeyJ']);
  add('cycleNext', '下一个窗口', 'Tab');
  add('cyclePrevious', '上一个窗口', 'KeyP', ['Tab'], false, true);
  add('moveLeft', '向左移动列', 'KeyH', ['ArrowLeft', 'KeyH'], true);
  add('moveRight', '向右移动列', 'KeyL', ['ArrowRight', 'KeyL'], true);
  add('moveUp', '向上移动窗口', 'KeyK', ['ArrowUp', 'KeyK'], true);
  add('moveDown', '向下移动窗口', 'KeyJ', ['ArrowDown', 'KeyJ'], true);
  add('maximize', '最大化 / 恢复', 'KeyF', ['KeyF', 'KeyM']);
  add('fullscreen', '全屏窗口 / 恢复', 'KeyM', ['KeyF', 'KeyM'], false, true);
  add('center', '居中当前列', 'KeyC');
  add('widthNext', '增大列宽', 'KeyR');
  add('widthPrevious', '减小列宽', 'KeyE', ['KeyR'], false, true);
  add('consume', '堆叠右侧窗口', 'Comma');
  add('expel', '拆出底部窗口', 'Period');
  add('joinLeft', '拆出 / 合入左侧列', 'BracketLeft');
  add('joinRight', '拆出 / 合入右侧列', 'BracketRight');
  add('first', '聚焦第一列', 'Home');
  add('last', '聚焦最后一列', 'End');
  add('moveFirst', '移到第一列', 'KeyA', ['Home'], true);
  add('moveLast', '移到最后一列', 'KeyZ', ['End'], true);
  add('workspacePrevious', '上一个工作区', 'PageUp', ['PageUp', 'KeyI'], false, false, '工作区');
  add('workspaceNext', '下一个工作区', 'PageDown', ['PageDown', 'KeyU'], false, false, '工作区');
  add('moveWorkspacePrevious', '移到上一个工作区', 'KeyI', ['PageUp', 'KeyI'], true, false, '工作区');
  add('moveWorkspaceNext', '移到下一个工作区', 'KeyU', ['PageDown', 'KeyU'], true, false, '工作区');
  for (let i = 1; i <= 9; i++) {
    add(`workspace${i}`, `切换到工作区 ${i}`, `Digit${i}`, [`Digit${i}`], false, false, '工作区');
    add(`moveWorkspace${i}`, `移到工作区 ${i}`, `Digit${i}`, [`Digit${i}`], true, false, '工作区');
    definitions.at(-1).webShift = false;
  }
  const valid = binding => binding && /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F(?:[1-9]|1[0-2])|Arrow(?:Left|Right|Up|Down)|Space|Tab|Home|End|PageUp|PageDown|Comma|Period|Slash|Backslash|BracketLeft|BracketRight|Semicolon|Quote|Backquote|Minus|Equal|Enter|Backspace|Delete|Insert)$/.test(binding.code)
    && (binding.ctrlKey || binding.altKey || binding.metaKey || /^F\d+$/.test(binding.code));
  const normalize = binding => ({ code: binding.code, ctrlKey: !!binding.ctrlKey, altKey: !!binding.altKey, shiftKey: !!binding.shiftKey, metaKey: !!binding.metaKey });
  const identity = binding => [binding.code, +binding.ctrlKey, +binding.altKey, +binding.shiftKey, +binding.metaKey].join(':');
  const bindings = (settings, id) => {
    const item = definitions.find(item => item.id === id);
    if (!item) return [];
    const custom = settings.shortcuts?.[id];
    if (custom === null) return [];
    if (valid(custom)) return [normalize(custom)];
    if (settings.shortcutPreset !== 'niri') return [{ code: item.webCode, ctrlKey: true, altKey: true, shiftKey: item.webShift, metaKey: false }];
    const mods = settings.modifier === 'super' ? ['metaKey'] : settings.modifier === 'alt' ? ['altKey'] : ['metaKey', 'altKey'];
    return item.niriCodes.flatMap(code => mods.map(mod => ({ code, ctrlKey: item.ctrl, shiftKey: item.shift, metaKey: mod === 'metaKey', altKey: mod === 'altKey' })));
  };
  const matches = (event, binding) => identity(normalize(event)) === identity(binding);
  const match = (event, settings) => {
    if (event.isComposing || event.getModifierState?.('AltGraph') || settings.shortcutsEnabled === false) return null;
    return definitions.find(item => bindings(settings, item.id).some(binding => matches(event, binding)))?.id || null;
  };
  const labels = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Space', Comma: ',', Period: '.', Slash: '/', Backslash: '\\', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Backquote: '`', Minus: '-', Equal: '=' };
  const format = binding => [binding.ctrlKey && 'Ctrl', binding.altKey && 'Alt', binding.shiftKey && 'Shift', binding.metaKey && 'Super', labels[binding.code] || binding.code.replace(/^(Key|Digit)/, '')].filter(Boolean).join(' + ');
  window.BlogShortcuts = { definitions, bindings, match, valid, normalize, identity, format };
})();
