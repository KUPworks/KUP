const DATA_FILES = ['js/data/manifest.js'].concat(require(require('path').join(__dirname, '..', 'js', 'data', 'manifest.js')));
/* 对比脚本（tools/，入库）：建筑实体 solid on/off 确定性模拟对比
 * 同 seed + 同区 + 站桩（玩家不动，升级自动选）90 秒：
 *   kills / hpEnd / deathTime / penEvents（敌人嵌入楼体的采样数，每 0.5s 一次）
 *   simMs（性能粗测）
 * 用法：node tools/solid-cmp.cjs（可在任意目录运行，可用 KUP_ROOT 覆盖仓库根）
 * 结论见 DESIGN.md「建筑实体（楼体＝障碍物）」一行。 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = process.env.KUP_ROOT || path.join(__dirname, '..');
function boot() {
  const ctx = { console, Math, JSON, performance: { now: () => 0 }, clearTimeout, setTimeout, TextEncoder, TextDecoder, btoa, atob };
  ctx.window = ctx; ctx.addEventListener = () => {};
  ctx.document = { addEventListener() {}, hidden: false };
  ctx.localStorage = { _s: {}, getItem(k) { return this._s[k] !== undefined ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; }, key(i) { return Object.keys(this._s)[i] || null; }, get length() { return Object.keys(this._s).length; } };
  vm.createContext(ctx);
  for (const f of ['js/utils.js', 'js/config.js', 'js/store.js', 'js/i18n.js', ...DATA_FILES, 'js/meta.js', 'js/entities.js', 'js/game.js', 'js/director.js', 'js/render.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const K = ctx.KUP;
  K.Audio = { init() {}, resume() {}, startBGM() {}, stopBGM() {}, sfx() {} };
  K.UI = { banner() {}, showScreen() {}, showHUD() {}, showBoss() {}, updateBoss() {}, showLevelUp() {}, showEnd() {}, updateHUD() {}, onLangChange() {} };
  K.Input = { keys: {}, mx: 0, my: 0, mdown: false };
  return K;
}
function sim(solid, seed) {
  const K = boot();
  const g = new K.Game({ width: 800, height: 600, getContext: () => ({}) });
  g.debug.solid = solid;
  g.start({ char: 'kaf', area: 'area0', seed });
  let pen = 0, deathTime = null;
  const dt = 1 / 60, steps = 90 * 60;
  const t0 = Date.now();
  for (let i = 0; i < steps; i++) {
    if (g.state !== 'playing') break;
    if (g.state === 'levelup') { g.pendingLevels = 0; g.state = 'playing'; g.choices = null; }
    g.update(dt);
    if (i % 30 === 0) {
      /* 直接几何检查（不依赖 citySolid 开关，两种模式同一把尺） */
      for (const e of g.enemies) {
        if (e.boss || e.dead) continue;
        for (const b of g.city.blocks) {
          const cx = Math.max(b.x, Math.min(e.x, b.x + b.w)), cy = Math.max(b.y, Math.min(e.y, b.y + b.h));
          const dx = e.x - cx, dy = e.y - cy;
          if (dx * dx + dy * dy < (e.r * 0.6) * (e.r * 0.6)) { pen++; break; }
        }
      }
    }
    if (g.player.hp <= 0 && deathTime === null) deathTime = g.time;
  }
  return {
    solid, seed, kills: g.kills, level: g.level,
    hpEnd: Math.max(0, Math.round(g.player.hp)),
    deathTime: deathTime === null ? null : Math.round(deathTime),
    penEvents: pen, enemiesEnd: g.enemies.length,
    simMs: Date.now() - t0, bossSpawned: !!g.bossSpawned,
  };
}
for (const s of [20250314, 777, 424242]) {
  const off = sim(false, s), on = sim(true, s);
  console.log(`seed=${s}`);
  console.log(`  OFF kills=${String(off.kills).padStart(4)} lv=${off.level} hp=${String(off.hpEnd).padStart(4)} death=${off.deathTime} pen=${String(off.penEvents).padStart(4)} enemies=${off.enemiesEnd} ms=${off.simMs}`);
  console.log(`  ON  kills=${String(on.kills).padStart(4)} lv=${on.level} hp=${String(on.hpEnd).padStart(4)} death=${on.deathTime} pen=${String(on.penEvents).padStart(4)} enemies=${on.enemiesEnd} ms=${on.simMs}`);
}
