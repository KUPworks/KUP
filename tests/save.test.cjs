/* ================= 存档层回归测试（Node，无需浏览器） =================
 *
 * 运行：node tests/save.test.cjs
 *
 * 思路：用 node:vm 把 config.js / data.js / store.js / meta.js 按 index.html 的顺序
 * 装进一个假浏览器上下文（window = 全局自身、可注入的假 localStorage），
 * 然后逐项验证存档层的关键不变量：
 *   1. 首次启动建立默认槽位与默认进度
 *   2. 復興率/市民票结算正确，且**同一局只结算一次**（runId 幂等）
 *   3. 槽位隔离：切槽后进度互不干扰
 *   4. 新建/改名/复制/删除槽位（含「至少保留一个」）
 *   5. 坏档隔离：损坏 JSON 不炸、被隔离、重置为默认值
 *   6. 写入失败（配额爆）时**盘上旧值不被破坏**
 *   7. 导出/导入往返一致，且导入为**新槽位**而非覆盖
 *   8. 旧键（kup_meta/kup_best）一次性升级进槽位
 *   9. 结构校验：非法字段被过滤/钳制（防手改存档与版本漂移）
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

/* ---------- 假 localStorage：可注入配额失败，统计读写次数 ---------- */
function fakeStorage(opts) {
  const o = opts || {};
  const map = new Map();
  return {
    map,
    failOn: o.failOn || null,          // 命中该键的 setItem 抛配额错误
    setItem(k, v) {
      if (this.failOn && k === this.failOn) {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      }
      map.set(k, String(v));
    },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    removeItem(k) { map.delete(k); },
    key(i) { const ks = Array.from(map.keys()); return i < ks.length ? ks[i] : null; },
    get length() { return map.size; },
  };
}

/* ---------- 装机：按 index.html 的顺序加载脚本 ---------- */
function boot(opts) {
  const o = opts || {};
  const ls = o.storage || fakeStorage({ failOn: o.failOn });
  const ctx = {
    console: console,
    localStorage: ls,
    document: { addEventListener() {}, hidden: false },
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    TextEncoder: TextEncoder, TextDecoder: TextDecoder,
    btoa: btoa, atob: atob,
  };
  ctx.window = ctx;                     // 脚本里 window.KUP / 裸 KUP 指向同一对象
  ctx.addEventListener = function () {}; // window.addEventListener 生命周期钩子
  if (o.preload) o.preload(ls);
  vm.createContext(ctx);
  for (const f of ['js/config.js', 'js/data.js', 'js/store.js', 'js/meta.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return { ctx, KUP: ctx.KUP, ls };
}

/* ---------- 极简断言 ---------- */
let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label); }
}
function eq(a, b, label) { ok(Object.is(a, b), label + '  (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function section(t) { console.log('\n' + t); }

/* ================= 用例 ================= */

section('1. 首次启动：默认槽位与默认进度');
{
  const { KUP } = boot();
  const META = KUP.META;
  eq(KUP.STORE.available, true, 'localStorage 可用');
  eq(META.slots.list().length, 1, '自动建立一个默认槽位');
  eq(META.slotId(), 's1', '当前槽为 s1');
  eq(META.total(), 0, '初始復興率 0');
  eq(META.tickets(), 0, '初始市民票 0');
  eq(META.best(), null, '初始无最佳记录');
  eq(META.ensure().stats.runs, 0, '初始出击局数 0');
}

section('2. 结算：復興率/现金 + runId 幂等');
{
  const { KUP } = boot();
  const META = KUP.META;
  const r1 = META.addRunResult('area0', true, { runId: 'r1', kills: 30, eggs: 1, areaIdx: 0, time: 120 });
  ok(r1 && r1.gain === 13, '首通 = 計上1 + 首通12 = 13（卵的 +1% 在拾取时单独结算）');
  eq(META.total(), 13, '復興率累计 13');
  ok(r1.cash > 0, '现金有收入 (' + r1.cash + ')');
  eq(META.tickets(), 0, 'v0.16：结算不再直接发市民票（改用现金兑换）');
  eq(META.clearedCount('area0'), 1, 'area0 通关 1 次');
  eq(META.ensure().stats.runs, 1, 'stats.runs = 1');
  eq(META.ensure().stats.wins, 1, 'stats.wins = 1');

  const again = META.addRunResult('area0', true, { runId: 'r1', kills: 30, eggs: 1, areaIdx: 0, time: 120 });
  eq(again, null, '同一 runId 重复结算被拒绝（返回 null）');
  eq(META.total(), 13, '復興率未被重复累加');
  eq(META.clearedCount('area0'), 1, '通关次数未被重复累加');

  const r2 = META.addRunResult('area0', true, { runId: 'r2', kills: 5, eggs: 0, areaIdx: 0, time: 60 });
  ok(r2 && r2.gain === 1 + 2, '重复通关 = 計上1 + 重复2 = 3');
  eq(META.clearedCount('area0'), 2, 'area0 通关 2 次');

  const r3 = META.addRunResult('area1', false, { runId: 'r3', kills: 0, eggs: 0, areaIdx: 1, time: 10 });
  ok(r3 && r3.gain === 1, '败北仍计 計上1');
  eq(META.clearedCount('area1'), 0, '败北不计通关');

  /* 槽位索引统计（列表展示） */
  const sum = META.slots.summary('s1');
  eq(sum.runs, 3, '槽位摘要 runs = 3');
  eq(sum.wins, 2, '槽位摘要 wins = 2');
  eq(META.slots.active().playtime, 190, '累计游玩时长 120+60+10=190');
  eq(META.slots.active().playedAt > 0, true, '最后出击时间已记录');
}

section('3. 槽位隔离与切换');
{
  const { KUP } = boot();
  const META = KUP.META;
  META.addRunResult('area0', true, { runId: 'a', kills: 0, eggs: 0, areaIdx: 0, time: 5 });
  const s1Total = META.total();
  const s2 = META.slots.create('');
  eq(META.slots.list().length, 2, '新建后共 2 个槽位');
  eq(s2, 's2', '新槽 id 为 s2');
  eq(META.slots.activeId(), 's1', '新建不会自动切换当前槽');
  eq(META.total(), s1Total, '仍在 s1：復興率不变');

  ok(META.slots.switchTo('s2'), '切到 s2');
  eq(META.slotId(), 's2', '当前槽 = s2');
  eq(META.total(), 0, 's2 是全新档（復興率 0）');
  META.addRunResult('area0', true, { runId: 'b', kills: 0, eggs: 0, areaIdx: 0, time: 5 });
  eq(META.total() > 0, true, 's2 独立累计');

  META.slots.switchTo('s1');
  eq(META.total(), s1Total, '切回 s1：復興率原样恢复');
  eq(META.slots.summary('s2').fukkou > 0, true, 's2 的进度确实写在自己那份档里');
}

section('4. 槽位改名 / 复制 / 删除');
{
  const { KUP } = boot();
  const META = KUP.META;
  META.slots.rename('s1', '第一周目');
  eq(META.slots.active().name, '第一周目', '改名生效');
  eq(META.slots.rename('s1', 'x'.repeat(60)), true, '超长名可提交');
  eq(META.slots.active().name.length, 24, '名称被截断到 24 字');

  eq(META.slots.remove('s1').ok, false, '只有一个槽位时拒绝删除');
  eq(META.slots.list().length, 1, '拒绝删除后槽位数不变');

  META.addRunResult('area0', true, { runId: 'c', kills: 20, eggs: 0, areaIdx: 0, time: 30 });
  const copied = META.slots.duplicate('s1');
  eq(META.slots.list().length, 2, '复制后 2 个槽位');
  eq(META.slots.summary(copied).fukkou, META.slots.summary('s1').fukkou, '副本復興率与源相同');
  eq(META.slots.summary(copied).runs, META.slots.summary('s1').runs, '副本出击局数与源相同');

  const r = META.slots.remove(copied);
  eq(r.ok, true, '删除非当前槽成功');
  eq(r.switched, false, '删除非当前槽不切换');
  eq(META.slots.list().length, 1, '删除副本后回到 1 个槽位');

  const s2 = META.slots.create('');
  const r2 = META.slots.remove('s1');       // 删的是当前槽
  eq(r2.ok, true, '删除当前槽成功');
  eq(r2.switched, true, '删除当前槽触发切换');
  eq(r2.active, s2, '切到剩余槽');
  eq(META.slotId(), s2, 'META 内存态同步切到剩余槽');
  eq(META.total(), 0, '切换后读的是新槽进度');
}

section('5. 坏档隔离');
{
  const { KUP, ls } = boot({
    preload(storage) {
      /* 一个结构性损坏的槽位索引 + 一个语法损坏的进度档 */
      storage.setItem('kup.slots', '{"v":1,"data":{"active":"s1","seq":1,"list":[{"id":"s1"}]}}');
    },
  });
  const META = KUP.META;
  eq(META.slots.list().length, 1, '缺字段的槽位索引被 normalize 补全');
  eq(META.total(), 0, '进度档缺失 → 默认值');

  /* 直接往盘上塞坏 JSON，再强制重读 */
  ls.setItem('kup.save.s1', '{oops');
  META.load(true);
  eq(META.total(), 0, '坏档 → 回落默认值而不抛异常');
  const quarantined = KUP.STORE.keys('kup.corrupt.');
  ok(quarantined.length === 1, '坏档被隔离为 kup.corrupt.*（' + quarantined.length + ' 份）');
  eq(ls.getItem(quarantined[0]), '{oops', '隔离副本保留了原始内容，便于事后排查');
}

section('6. 写入失败不破坏旧值（配额爆）');
{
  const { KUP, ls } = boot();
  const META = KUP.META;
  META.addRunResult('area0', true, { runId: 'q1', kills: 0, eggs: 0, areaIdx: 0, time: 5 });
  const before = ls.getItem('kup.save.s1');
  ok(before && JSON.parse(before).data.fukkou === 13, '旧值已落盘（13%）');

  ls.failOn = 'kup.save.s1';               // 让后续所有写入该键的操作失败
  META.ensure().fukkou = 999;              // 内存里改坏，然后尝试落盘
  eq(META.save(), false, 'save() 在写入失败时返回 false');
  eq(ls.getItem('kup.save.s1'), before, '盘上旧值**未被破坏**（两阶段写入生效）');
  eq(KUP.STORE.lastError.kind, 'write', '失败被记录为 lastError.kind = write');
  ok(KUP.STORE.health().error.message.length > 0, 'health() 暴露可读的错误信息');
  eq(KUP.STORE.keys('kup.save.s1.tmp').length, 0, '无 .tmp 残留');
}

section('7. 导出 / 导入');
{
  const a = boot();
  a.KUP.META.slots.rename('s1', '观测者A');
  a.KUP.META.addRunResult('area0', true, { runId: 'e1', kills: 0, eggs: 0, areaIdx: 0, time: 42 });
  a.KUP.META.ensure().chars.push(a.KUP.CHARS.filter(c => c.recruit)[0].id);
  a.KUP.META.save();
  const text = a.KUP.META.exportSlot('s1');

  const b = boot();
  const r = b.KUP.META.importSlot(text);
  eq(r.ok, true, '导入成功');
  eq(b.KUP.META.slots.list().length, 2, '导入产生**新槽位**（原 s1 保留）');
  eq(b.KUP.META.slots.summary(r.id).fukkou, 13, '导入后復興率一致');
  eq(b.KUP.META.slots.entry(r.id).name, '观测者A', '导入后名称保留');
  eq(b.KUP.META.slots.summary('s1').fukkou, 0, '原槽位未被覆盖');
  eq(b.KUP.META.slotId(), 's1', '导入不会自动切换当前槽');

  eq(b.KUP.META.importSlot('not-base64!!').ok, false, '非法文本被拒绝');
  const future = btoa(JSON.stringify({ kind: 'kup-slot', envelope: 99, data: {} }));
  eq(b.KUP.META.importSlot(future).error, 'version', '来自更高版本的存档被拒绝');
}

section('8. 旧键一次性升级');
{
  const { KUP, ls } = boot({
    preload(storage) {
      storage.setItem('kup_meta', JSON.stringify({
        fukkou: 33, tickets: 250, cleared: { area0: 2 }, eggs: ['frag1'], eggCount: 4,
        chars: [], companions: [], shop: { bun: 2 }, form: 'none', companion: null, companionForm: 'none',
      }));
      storage.setItem('kup_best', JSON.stringify({ win: true, time: 300, kills: 120, level: 12, witch: '森先化歩' }));
      storage.setItem('kup_vol', '0.42');
      storage.setItem('kup_lang', 'ja');
    },
  });
  const META = KUP.META;
  eq(META.total(), 33, '旧復興率被搬进新槽位');
  eq(META.tickets(), 250, '旧市民票搬入');
  eq(META.cash(), 0, 'v0.16 旧档没有现金字段 → 默认 0（不影响旧进度）');
  eq(META.clearedCount('area0'), 2, '旧通关次数搬入');
  eq(META.shopLv('bun'), 2, '旧商店等级搬入');
  eq(META.best().kills, 120, '旧 kup_best 并入进度档');
  eq(META.ensure().stats.runs, 0, '新字段有默认值（stats.runs = 0）');
  eq(KUP.STORE.settings.get('vol'), 0.42, '旧 kup_vol 升级为全局设置');
  eq(KUP.STORE.settings.get('lang'), 'ja', '旧 kup_lang 升级为全局设置');
  for (const k of ['kup_meta', 'kup_best', 'kup_vol', 'kup_lang']) {
    eq(ls.getItem(k), null, '旧键 ' + k + ' 已清理');
  }
}

section('9. 结构校验：手改存档被过滤/钳制');
{
  const { KUP, ls } = boot();
  const frag0 = KUP.FRAGMENTS[0].id;
  const evil = {
    fukkou: 'NaN', tickets: -50, cash: -50, cleared: { area0: 3, notAnArea: 9 },
    eggs: [frag0, 'ghost-frag'], eggCount: -5,
    chars: [KUP.CHARS.filter(c => c.recruit).map(c => c.id)[0] || 'x', 'not-a-char'],
    companions: ['not-a-companion'], shop: { bun: 999, nope: 3 },
    form: 'not-a-form', companion: 'not-a-companion', companionForm: 'none',
    /* v0.13.3 支援物品：非法 id 必须被丢弃；选择必须是「已知且已解锁」 */
    supports: ['not-a-support', KUP.SUPPORTS[0].id],
    support: 'not-a-support',
    best: { win: 'yes', time: '120', kills: '30', level: 5, witch: 12345 },
    stats: { runs: -3, wins: 1e9, playtime: 'x' },
  };
  ls.setItem('kup.save.s1', JSON.stringify({ v: 1, savedAt: Date.now(), data: evil }));
  const d = KUP.META.load(true);
  eq(d.fukkou, 0, 'fukkou "NaN" → 0');
  eq(d.tickets, 0, 'tickets 负数 → 0');
  eq(d.cash, 0, 'v0.16 现金：负数 → 0');
  eq(typeof d.cash, 'number', 'v0.16 现金：归一化为数字');
  eq(Object.keys(d.cleared).length, 1, '未知番街被丢弃');
  eq(d.cleared.area0, 3, '合法番街保留');
  eq(d.eggs.length, 1, '不存在的碎片 id 被丢弃');
  eq(d.eggCount, 1, 'eggCount 不得小于已解锁碎片数');
  eq(d.chars.length, 1, '非法角色 id 被丢弃');
  eq(d.companions.length, 0, '非法同伴 id 被丢弃');
  eq(d.supports.length, 1, '非法支援物品 id 被丢弃，合法者保留');
  eq(d.supports[0], KUP.SUPPORTS[0].id, '合法支援物品 id 保留');
  eq(d.support, null, '未解锁/未知的支援物品选择回落 null');
  eq(d.shop.bun, d.shop.bun, '商店等级存在');
  const bunMax = KUP.SHOP_ITEM('bun').maxLv;
  eq(d.shop.bun, bunMax, '商店等级被钳制到 maxLv(' + bunMax + ')');
  eq(d.shop.nope, undefined, '未知商店项被丢弃');
  eq(d.form, 'none', '非法皮肤回落 none');
  eq(d.companion, null, '非法同伴回落 null');
  eq(d.best.time, 120, '字符串时间被归一化为数字');
  eq(d.best.kills, 30, '字符串击杀数被归一化为数字');
  eq(d.best.win, true, 'truthy win 归一化为布尔');
  eq(d.stats.runs, 0, '负数局数 → 0');
  eq(d.stats.playtime, 0, '非法时长 → 0');
}

section('10. 设置跨槽共享，进度按槽隔离');
{
  const { KUP } = boot();
  KUP.STORE.settings.set({ vol: 0.25, bgm: false }, { now: true });
  KUP.META.slots.create('');
  KUP.META.slots.switchTo('s2');
  eq(KUP.STORE.settings.get('vol'), 0.25, '音量在新槽位下保持（全局设置）');
  eq(KUP.STORE.settings.get('bgm'), false, 'BGM 开关在新槽位下保持');
  eq(KUP.META.total(), 0, '新槽进度独立');
}

section('11. 清档：wipe 后只剩一个空槽');
{
  const { KUP } = boot();
  KUP.META.addRunResult('area0', true, { runId: 'w', kills: 0, eggs: 0, areaIdx: 0, time: 5 });
  KUP.META.slots.create('第二档');
  KUP.META.wipe();
  eq(KUP.META.slots.list().length, 1, 'wipe 后只剩一个槽位');
  eq(KUP.META.total(), 0, 'wipe 后復興率归零');
  eq(KUP.META.best(), null, 'wipe 后无最佳记录');
  eq(KUP.STORE.settings.get('vol'), 0.7, '设置保留（wipe 只清存档）');
}

section('12. localStorage 完全不可用 → 内存档降级且不崩');
{
  const { KUP } = boot({
    storage: {
      getItem() { return null; },
      setItem() { const e = new Error('SecurityError'); e.name = 'SecurityError'; throw e; },
      removeItem() {}, key() { return null; }, get length() { return 0; },
    },
  });
  const META = KUP.META;
  eq(KUP.STORE.available, false, '探测失败 → available = false');
  eq(KUP.STORE.backendName, 'memory', '后端降级为内存');
  eq(KUP.STORE.health().error.kind, 'unavailable', 'health() 暴露 unavailable');
  eq(META.slots.list().length, 1, '仍然提供一个可用槽位');
  const r = META.addRunResult('area0', true, { runId: 'm1', kills: 0, eggs: 0, areaIdx: 0, time: 5 });
  eq(r.gain, 13, '内存档内结算照常工作');
  eq(META.total(), 13, '内存态可见');
  eq(META.best() === null, true, '初始无记录');
  eq(META.submitBest({ win: true, time: 60, kills: 10 }), true, '内存档内也能刷新记录');
  ok(META.health().error.message.indexOf('内存') >= 0, '错误信息可读（供 UI 提示玩家）');
}

console.log('\n=== ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail ? 1 : 0);
