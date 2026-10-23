const DATA_FILES = ['js/data/manifest.js'].concat(require(require('path').join(__dirname, '..', 'js', 'data', 'manifest.js')));
/* 对比脚本（tools/，入库）：敌人「绕建筑寻路」质量与开销对比。
 * 场景：玩家定在竞技场中心（不移动、不受伤、不开火），40 体敌人在确定性落点生成，
 *       无人干预跑 30 秒 —— 只考察「能不能绕到玩家身边」。
 * 指标：
 *   reached  ：60 秒内曾进入「接触距离」的敌人数
 *   delay    ：首次接触时间 − 直线理想时间（Σ里程/速度）；「绕路浪费」的直接度量
 *   stall    ：每体平均的「停滞秒数」（离玩家 >120px 且速度 <15% 额定，即被楼挡住）
 *   stuck    ：末尾仍在 150px 外、且最近 3 秒净位移 < 6px 的敌人数（卡墙）
 *   touch    ：全队「贴墙」采样占比（每 0.5s 一次采样，几何检查，与开关无关）
 *   ms/frame ：120 体敌人空跑 1200 帧的模拟耗时（不含渲染）
 * 用法：node tools/path-cmp.cjs（可在任意目录运行，可用 KUP_ROOT 覆盖仓库根）
 */
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
  if (process.env.KUP_LOOK) K.CONFIG.NAV.LOOK = +process.env.KUP_LOOK;   // 临时调参用
  if (process.env.KUP_TURN) K.CONFIG.NAV.TURN = +process.env.KUP_TURN;
  K.Audio = { init() {}, resume() {}, startBGM() {}, stopBGM() {}, sfx() {} };
  K.UI = { banner() {}, showScreen() {}, showHUD() {}, updateBoss() {}, showLevelUp() {}, showEnd() {}, updateHUD() {}, onLangChange() {} };
  K.Input = { keys: {}, mx: 0, my: 0, mdown: false };
  return K;
}
const DT = 1 / 60;
function arena(K, seed, solid) {
  const g = new K.Game({ width: 800, height: 600, getContext: () => ({}) });
  g.debug.solid = solid;
  g.start({ char: 'kaf', area: 'area0', seed });
  g.director = () => {};             // 不刷怪（只考察初始 40 体）
  g.collide = () => {};              // 无伤害（双方都不掉血）
  g.updateBossBehavior = () => {};
  g.player.update = () => {};        // 玩家站桩
  const C = K.CONFIG;
  /* 玩家落到中心最近可站立点 */
  const spot = { x: C.ARENA / 2, y: C.ARENA / 2, r: C.PLAYER_R, dead: false };
  if (!g.walkable(spot.x, spot.y, spot.r)) g.walkableNearest(spot);
  g.player.x = spot.x; g.player.y = spot.y;
  return g;
}
/* 固定敌对落点：环形分布（半径 500/750/1000），均匀角度，全部推到可站立点 */
function populate(K, g, n) {
  const C = K.CONFIG, types = [['noise', 3], ['glitch', 2], ['tank', 1]];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const ring = 500 + (i % 3) * 250;
    const a = (i / n) * K.U.TAU + (i % 7) * 0.11;
    const x = K.U.clamp(g.player.x + Math.cos(a) * ring, 40, C.ARENA - 40);
    const y = K.U.clamp(g.player.y + Math.sin(a) * ring, 40, C.ARENA - 40);
    const spot = { x, y, r: 14, dead: false };
    if (g.citySolid && !g.walkable(x, y, 14)) { g.walkableNearest(spot); if (spot.dead) continue; }
    const entry = types[k++ % types.length];
    const def = K.ENEMIES[entry[0]];
    const e = new K.Enemy(def, spot.x, spot.y, 1, 0);
    e.speed = def.speed;              // 固定速度（避开 U.rand 抖动）
    g.enemies.push(e);
  }
}
const TOUCH = K => K.CONFIG.PLAYER_R + 34;
function run(seed, solid, seconds) {
  const K = boot(), g = arena(K, seed, solid);
  populate(K, g, 40);
  const steps = Math.round(seconds / DT);
  const first = new Map(), hist = new Map(), stall = new Map(), ideal = new Map();
  for (const e of g.enemies) ideal.set(e, Math.hypot(e.x - g.player.x, e.y - g.player.y) / e.speed);
  let touchSamples = 0, enemySamples = 0;
  for (let i = 0; i < steps; i++) {
    const prev = new Map();
    for (const e of g.enemies) prev.set(e, { x: e.x, y: e.y });
    g.update(DT);
    for (const e of g.enemies) {
      const d = Math.hypot(e.x - g.player.x, e.y - g.player.y);
      if (d < TOUCH(K) && !first.has(e)) first.set(e, g.time);
      const q = prev.get(e);
      const moved = q ? Math.hypot(e.x - q.x, e.y - q.y) : 0;
      if (d > 120 && moved < 0.15 * e.speed * DT) stall.set(e, (stall.get(e) || 0) + DT);
    }
    if (i % 30 === 0) {
      for (const e of g.enemies) {
        enemySamples++;
        /* 贴墙＝与楼体几何相交（同一把尺，不依赖开关） */
        for (const b of g.city.blocks) {
          const cx = Math.max(b.x, Math.min(e.x, b.x + b.w)), cy = Math.max(b.y, Math.min(e.y, b.y + b.h));
          if ((e.x - cx) ** 2 + (e.y - cy) ** 2 < (e.r * 0.9) ** 2) { touchSamples++; break; }
        }
        const h = hist.get(e) || []; h.push({ t: g.time, x: e.x, y: e.y }); hist.set(e, h);
      }
    }
  }
  /* 末尾 3 秒净位移 */
  let stuck = 0, sumStall = 0, sumDist = 0;
  for (const e of g.enemies) {
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y);
    sumDist += d; sumStall += stall.get(e) || 0;
    const h = hist.get(e) || [];
    const past = h.find(p => p.t >= g.time - 3);
    if (d > 150 && past && Math.hypot(e.x - past.x, e.y - past.y) < 6) stuck++;
  }
  const times = [...first.values()].sort((a, b) => a - b);
  const delays = [...first.keys()].map(e => first.get(e) - ideal.get(e)).sort((a, b) => a - b);
  const mean = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
  const med = delays.length ? delays[(delays.length / 2) | 0] : null;
  return {
    seed, solid,
    reached: first.size, of: g.enemies.length,
    dMean: mean === null ? null : +mean.toFixed(1),
    dMed: med === null ? null : +med.toFixed(1),
    stall: +(sumStall / Math.max(1, g.enemies.length)).toFixed(2),
    stuck, meanDist: Math.round(sumDist / Math.max(1, g.enemies.length)),
    touchPct: +(100 * touchSamples / Math.max(1, enemySamples)).toFixed(2),
  };
}
/* 纯模拟开销（120 体，无渲染）；分别测「只开空间索引」与「索引＋绕行转向」 */
function perf(seed, solid) {
  const K = boot(), g = arena(K, seed, solid);
  populate(K, g, 120);
  const run1200 = () => {
    for (let i = 0; i < 120; i++) g.update(DT);   // 预热
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 1200; i++) g.update(DT);
    return +(Number(process.hrtime.bigint() - t0) / 1e6 / 1200).toFixed(3);
  };
  const withNav = run1200();
  const real = g.steerCity;
  g.steerCity = () => false;                      // 关掉绕行转向，只留空间索引
  const indexOnly = run1200();
  g.steerCity = real;
  const bkt = g.city.buckets;
  g.city.buckets = null;                          // 退回「全表扫描」的旧查询，用于说明索引的贡献
  const noIndex = run1200();
  g.city.buckets = bkt;
  return { withNav, indexOnly, noIndex };
}
/* ---- 场景 B：逐楼「正后方」放置——最考验绕楼的几何（墙上垂直逼近） ---- */
function behind(K, g) {
  const C = K.CONFIG, out = [];
  const px = g.player.x, py = g.player.y;
  for (const b of g.city.blocks) {
    /* 玩家 → 楼心 的射线，与楼体 AABB 求出口（slab 法），落点取出口外 45px：
     * 敌人正好坐在「楼的阴影」里，直线被整栋楼挡住 —— 最坏几何。 */
    let dx = (b.x + b.w / 2) - px, dy = (b.y + b.h / 2) - py;
    const d = Math.hypot(dx, dy);
    if (d < 60) continue;
    dx /= d; dy /= d;
    const tx = (dx > 0 ? b.x + b.w - px : b.x - px) / (dx || 1e-9);
    const ty = (dy > 0 ? b.y + b.h - py : b.y - py) / (dy || 1e-9);
    const base = Math.min(tx, ty);
    let spot = null;
    for (const gap of [45, 60, 80, 100]) {                    // 楼后 45px 起，沿射线找第一个空位
      const k = base + gap;
      const x = K.U.clamp(px + dx * k, 30, C.ARENA - 30), y = K.U.clamp(py + dy * k, 30, C.ARENA - 30);
      if (g.freeAt(x, y, 14)) { spot = { x, y, r: 13 }; break; }
    }
    if (!spot) continue;
    /* 复核：玩家 ↔ 敌人 的直线确实穿过这栋楼（否则不算「正后方」样本） */
    if (!segBlocked(px, py, spot.x, spot.y, b)) continue;
    const def = K.ENEMIES.noise;
    const e = new K.Enemy(def, spot.x, spot.y, 1, 0);
    e.speed = def.speed;
    g.enemies.push(e);
    out.push(e);
  }
  return out;
}
/* 线段是否与楼体矩形相交（slab 法） */
function segBlocked(x0, y0, x1, y1, b) {
  const dx = x1 - x0, dy = y1 - y0;
  let t0 = 0, t1 = 1;
  for (const [p, q, lo, hi] of [[-dx, x0 - b.x, 0, 0], [dx, b.x + b.w - x0, 0, 0], [-dy, y0 - b.y, 0, 0], [dy, b.y + b.h - y0, 0, 0]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t1 > t0 + 1e-6;
}
function runBehind(seed, slack) {
  const K = boot(), g = arena(K, seed, true);
  const list = behind(K, g);
  /* 每个样本的窗口 = 自己的直线理想时间 + slack 秒：远方样本不会因为「腿程」被判失败 */
  const ideal = new Map(), due = new Map();
  let total = 0;
  for (const e of list) {
    const i0 = Math.hypot(e.x - g.player.x, e.y - g.player.y) / e.speed;
    ideal.set(e, i0); due.set(e, i0 + slack); total = Math.max(total, i0 + slack);
  }
  const steps = Math.round((total + 1) / DT);
  const first = new Map(), stall = new Map();
  for (let i = 0; i < steps; i++) {
    const prev = new Map();
    for (const e of list) prev.set(e, { x: e.x, y: e.y });
    g.update(DT);
    for (const e of list) {
      const d = Math.hypot(e.x - g.player.x, e.y - g.player.y);
      if (d < TOUCH(K) && !first.has(e)) first.set(e, g.time);
      const q = prev.get(e);
      if (q && d > 120 && Math.hypot(e.x - q.x, e.y - q.y) < 0.15 * e.speed * DT) stall.set(e, (stall.get(e) || 0) + DT);
    }
  }
  let sumDelay = 0, failed = 0, stalled = 0, maxStall = 0;
  for (const e of list) {
    /* 延迟 = 实际到达 − 直线理想 − 「到达即接触距离」的节省；超时未达按窗口罚满 */
    const end = first.has(e) ? first.get(e) : due.get(e);
    if (!first.has(e) || first.get(e) > due.get(e)) failed++;
    sumDelay += (end - ideal.get(e)) - TOUCH(K) / e.speed;
    const s = stall.get(e) || 0;
    if (s > 0.5) stalled++;
    maxStall = Math.max(maxStall, s);
  }
  const n = Math.max(1, list.length);
  return { seed, n: list.length, reached: first.size - failed, failed, delay: +(sumDelay / n).toFixed(2), stalled, maxStall: +maxStall.toFixed(1) };
}
const label = process.argv[2] || 'current';
const onlyB = process.argv[3] === 'onlyB';
console.log('=== ' + label + ' (LOOK=' + (process.env.KUP_LOOK || 'default') + ') ===');
if (!onlyB) {
  console.log('-- 场景 A：环形成群（40 体，60 秒，含无楼对照组）--');
  for (const seed of [20250314, 777, 424242]) {
    for (const solid of [false, true]) {
      const r = run(seed, solid, 60);
      console.log(`seed=${String(seed).padStart(8)} solid=${solid ? 'ON ' : 'OFF'}  到达 ${String(r.reached).padStart(2)}/${r.of}  绕路延迟 平均${String(r.dMean).padStart(5)}s/中位${String(r.dMed).padStart(5)}s  停滞 ${String(r.stall).padStart(5)}s  卡墙 ${r.stuck}  末均距 ${String(r.meanDist).padStart(4)}  贴墙采样 ${String(r.touchPct).padStart(5)}%`);
    }
  }
}
console.log('-- 场景 B：逐楼正后方（最坏几何；每样本窗口 = 直线理想 + 12 秒）--');
for (const seed of [20250314, 777, 424242]) {
  const r = runBehind(seed, 12);
  console.log(`seed=${String(seed).padStart(8)}  样本 ${String(r.n).padStart(3)}  按时到达 ${String(r.reached).padStart(3)}/${r.n}（超时 ${r.failed}）  绕路延迟 平均${String(r.delay).padStart(6)}s  停滞样本 ${r.stalled}  最长停滞 ${r.maxStall}s`);
}
console.log('120 体 ms/frame（最坏密度：全员贴脸）：', JSON.stringify(perf(20250314, true)));
