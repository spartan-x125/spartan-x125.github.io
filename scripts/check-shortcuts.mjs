import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const context = { window: {} };
runInNewContext(readFileSync(new URL('../public/shortcuts.js', import.meta.url), 'utf8'), context);
const shortcuts = context.window.BlogShortcuts;
for (const shortcutPreset of ['web', 'niri']) {
  for (const modifier of ['both', 'super', 'alt']) {
    const settings = { shortcutPreset, modifier };
    for (const item of shortcuts.definitions) {
      for (const binding of shortcuts.bindings(settings, item.id)) {
        assert.equal(shortcuts.match(binding, settings), item.id, `${shortcutPreset}/${modifier}: ${shortcuts.format(binding)}`);
      }
    }
  }
}
const binding = { code: 'KeyY', ctrlKey: true, altKey: false, shiftKey: true, metaKey: false };
const custom = { shortcuts: { terminal: binding, close: null } };
assert.equal(shortcuts.match(binding, custom), 'terminal');
assert.equal(shortcuts.bindings(custom, 'close').length, 0);
assert.equal(shortcuts.match({ ...binding, isComposing: true }, custom), null);
assert.equal(shortcuts.match({ ...binding, getModifierState: () => true }, custom), null);
assert.equal(shortcuts.match(binding, { ...custom, shortcutsEnabled: false }), null);
assert.equal(shortcuts.match({ ...binding, altKey: true }, custom), null);
assert.equal(shortcuts.match({ code: 'KeyT' }, {}), null);
assert.equal(shortcuts.valid({ code: 'KeyT' }), false);
assert.equal(shortcuts.valid({ code: 'F3' }), true);
assert.equal(shortcuts.valid({ code: 'Escape', ctrlKey: true }), false);
console.log(`Verified ${shortcuts.definitions.length} configurable actions, both presets, custom bindings, IME and disabled shortcuts.`);
