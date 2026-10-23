const DATA_FILES = ['js/data/manifest.js'].concat(require(require('path').join(__dirname, '..', 'js', 'data', 'manifest.js')));
/* 现状盘点：内容量与可拓展点 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, JSON, performance: { now: () => 0 }, clearTimeout, setTimeout,
  TextEncoder, TextDecoder, btoa, atob };
ctx.window = ctx; ctx.addEventListener = () => {};
ctx.document = { addEventListener() {}, hidden: false };
ctx.localStorage = { _s: {}, getItem(k) { return this._s[k] !== undefined ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; },
  key(i) { const ks = Object.keys(this._s); return i < ks.length ? ks[i] : null; },
  get length() { return Object.keys(this._s).length; } };
vm.createContext(ctx);
for (const f of ['js/utils.js', 'js/config.js', 'js/store.js', 'js/i18n.js', ...DATA_FILES, 'js/meta.js',
  'js/entities.js', 'js/game.js', 'js/director.js', 'js/render.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const KUP = ctx.KUP;
console.log('AREAS      ' + KUP.AREAS.length);
console.log('CHARS      ' + KUP.CHARS.length + '（招募 ' + KUP.CHARS.filter(c => c.recruit).length + '）');
console.log('COMPANIONS ' + KUP.COMPANIONS.length + '（登场 ' + KUP.companionsActive().length + '）');
console.log('SUPPORTS   ' + KUP.SUPPORTS.length + ' ' + KUP.SUPPORTS.map(s => s.id).join(','));
console.log('WEAPONS    ' + Object.keys(KUP.WEAPONS).length + ' 行为: ' + [...new Set(Object.values(KUP.WEAPONS).map(w => w.behavior))].join('/'));
console.log('PASSIVES   ' + Object.keys(KUP.PASSIVES).length);
console.log('ITEMS      ' + Object.keys(KUP.ITEMS).length);
console.log('SHOP       ' + KUP.SHOP.length);
console.log('FORMS      ' + KUP.FORMS.length + '（' + KUP.FORMS.map(f => f.id).join(',') + '）');
console.log('ENEMIES    ' + Object.keys(KUP.ENEMIES).filter(k => !k.startsWith('boss')).join(','));
console.log('BOSSES     ' + Object.keys(KUP.BOSSES).length + ' 模式: ' + [...new Set(Object.values(KUP.BOSSES).map(b => b.pattern))].join('/'));
console.log('MODIFIERS  ' + Object.keys(KUP.MODIFIERS).length + '（' + Object.keys(KUP.MODIFIERS).join(',') + '）');
console.log('MODS_KEYS  ' + KUP.MODS_KEYS.length);
console.log('bossTime 默认 ' + KUP.CONFIG.BOSS_TIME + 's / 暴走 ' + KUP.CONFIG.ENRAGE_TIME + 's；XP_NEXT(1..5)=' + [1,2,3,4,5].map(l => KUP.XP_NEXT(l)).join(','));
