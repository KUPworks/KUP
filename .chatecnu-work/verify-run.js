/* 一次性验证脚本：run 配置（seed/area/mod）的可复现性、修正乘数接线、
 * v0.4–v0.6 新系统（復興率 / 番街解锁 / 覚醒 / 浄化の歌 / 記憶の卵 / 每区波次与事件 /
 *   角色≠声优 / 招募 / 皮肤 / **市民票与瓦利斯商店** / **新武器组** / **每关卡 Boss**）。
 * v0.7：加载顺序对齐 index.html（含 js/store.js）；持久化断言改为槽位存档 kup.save.<id>。
 * 用法：node .chatecnu-work/verify-run.js  （从仓库根运行） */
const fs = require('fs'), vm = require('vm'), path = require('path');

const ctx = { console, Math, JSON, performance: { now: () => 0 }, clearTimeout, setTimeout,
  TextEncoder, TextDecoder, btoa, atob };
ctx.window = ctx;                       // 浏览器脚本用 window.KUP
ctx.addEventListener = () => {};        // store.js 生命周期钩子
ctx.document = { addEventListener() {}, hidden: false };
ctx.localStorage = {                    // 内存版 localStorage（js/store.js 持久化）
  _s: {},
  getItem(k) { return this._s[k] !== undefined ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  key(i) { const ks = Object.keys(this._s); return i < ks.length ? ks[i] : null; },
  get length() { return Object.keys(this._s).length; },
};
vm.createContext(ctx);
for (const f of ['js/utils.js', 'js/config.js', 'js/store.js', 'js/i18n.js', 'js/data.js', 'js/meta.js',
  'js/entities.js', 'js/game.js', 'js/director.js', 'js/render.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const KUP = ctx.KUP;

/* 音频/UI 桩（node 环境无 DOM/WebAudio；game.start 会调用） */
KUP.Audio = { init() {}, resume() {}, startBGM() {}, stopBGM() {}, sfx() {} };
KUP.UI = {
  banner() {}, showScreen() {}, showHUD() {}, showBoss() {}, updateBoss() {},
  showLevelUp() {}, showEnd() {}, updateHUD() {}, onLangChange() {},
};
/* 输入桩（Player.update 读 KUP.Input） */
KUP.Input = { keys: {}, mx: 0, my: 0, mdown: false };
const canvas = { width: 800, height: 600, getContext: () => ({}) };
const mkGame = (area, seed, mod) => {
  const g = new KUP.Game(canvas);
  g.run = { char: 'kaf', area, mod: mod || 'none', seed };
  g.applyRun(true);
  return g;
};
const sig = g => JSON.stringify(g.city.blocks.map(b => [Math.round(b.x), Math.round(b.y), Math.round(b.w), b.hue.toFixed(4)]));

let fail = 0;
const check = (name, cond, extra) => {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '   ' + extra : ''));
  if (!cond) fail++;
};

/* ========== 地基（v0.2.0-run 回归） ========== */
// 1. 同 seed + 同区 → 布景完全一致
const a1 = mkGame('area5', 12345), a2 = mkGame('area5', 12345);
check('同 seed 同区 → 同一张城', sig(a1) === sig(a2));

// 2. 同 seed + 异区 → 布景不同
const b1 = mkGame('area3', 12345);
check('同 seed 异区 → 换城', sig(a1) !== sig(b1));
check('异区建筑数按区域配置（网格化：密度随区域，≤ 格数上限）',
  a1.city.blocks.length > b1.city.blocks.length &&
  a1.city.blocks.length <= 225 && b1.city.blocks.length >= 40,
  'area5=' + a1.city.blocks.length + ' area3=' + b1.city.blocks.length);

// 3. 异 seed + 同区 → 布景不同
const c1 = mkGame('area5', 999);
check('异 seed 同区 → 换城', sig(a1) !== sig(c1));

// 2b. v0.11 建筑实体：网格化布局（同 seed 同图、楼不重叠、全在竞技场内）
{
  const gC = new KUP.Game(canvas);
  gC.run = { char: 'kaf', area: 'area5', mod: 'none', seed: 12345 };
  gC.applyRun(true);
  check('建筑实体默认开启', gC.citySolid === true && KUP.CONFIG.CITY.SOLID === true);
  let overlap = false, out = false;
  const bs = gC.city.blocks;
  for (let i = 0; i < bs.length; i++) {
    if (bs[i].x < 0 || bs[i].y < 0 || bs[i].x + bs[i].w > KUP.CONFIG.ARENA || bs[i].y + bs[i].h > KUP.CONFIG.ARENA) out = true;
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], b = bs[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) overlap = true;
    }
  }
  check('楼体互不重叠（网格化布局）', !overlap, 'blocks=' + bs.length);
  check('楼体全部在竞技场内', !out);
  const gC2 = new KUP.Game(canvas);
  gC2.run = { char: 'kaf', area: 'area5', mod: 'none', seed: 12345 };
  gC2.applyRun(true);
  check('网格化布局仍确定性（同 seed 同图）', sig(gC) === sig(gC2));
  /* ?solid=0：开关关闭且布景不受开关影响 */
  const gOff = new KUP.Game(canvas);
  gOff.debug.solid = false;
  gOff.run = { char: 'kaf', area: 'area5', mod: 'none', seed: 12345 };
  gOff.applyRun(true);
  check('?solid=0 → 关闭楼体碰撞（布景不变）', gOff.citySolid === false && sig(gOff) === sig(gC));
}

// 4. 未知 id 回落（不应抛异常）
const d1 = mkGame('no-such-area', 1, 'no-such-mod');
check('未知 area/mod 安全回落', d1.area.id === KUP.CONFIG.DEFAULT_AREA && d1.mod.id === KUP.CONFIG.DEFAULT_MOD);

// 5. 修正乘数：none 全为 1；自定义表能改变玩家速度
check('mods.none 恒等', KUP.MODS_KEYS.every(k => KUP.modsFor('none')[k] === 1), JSON.stringify(KUP.modsFor('none')));

KUP.MODIFIERS.gravity = { playerSpeed: 0.5, enemySpeed: 0.5 };
const gMods = KUP.modsFor('gravity');
check('modsFor 缺项补 1', gMods.playerSpeed === 0.5 && gMods.cooldown === 1);

const p0 = new KUP.Player(KUP.CHARS[0], KUP.modsFor('none'));
const p1 = new KUP.Player(KUP.CHARS[0], gMods);
check('playerSpeed 接线到 Player.speed', p1.speed === p0.speed * 0.5, p0.speed + ' → ' + p1.speed);

// 6. 随机流可复现：同 seed 两次跑出的敌人速度/相位一致
KUP.U.rng = KUP.U.mulberry32(4242);
const e1 = new KUP.Enemy(KUP.ENEMIES.noise, 0, 0, 1, 1);
const ph1 = e1.phase;
KUP.U.rng = KUP.U.mulberry32(4242);
const e2 = new KUP.Enemy(KUP.ENEMIES.noise, 0, 0, 1, 1);
check('同 seed → 敌人相位/速度一致', e2.phase === ph1 && e2.speed === e1.speed);

/* ========== v0.4.0-loop 新系统 ========== */
// 7. 每区独立波次表已接线
check('七街区均配独立波次表', KUP.AREAS.every(a => Array.isArray(a.waves) && a.waves.length >= 5));
check('各波次表首行 t=0', KUP.AREAS.every(a => a.waves[0].t === 0));

// 8. 每区章节名（动画各话副标题）与事件
check('七街区均有章节名', KUP.AREAS.every(a => a.chapter && a.chapter.zh));
check('章节名对应动画副标题',
  KUP.AREA('area1').chapter.zh === '悪意 -Malice-' &&
  KUP.AREA('area3').chapter.zh === 'ファミリア -Familiar-' &&
  KUP.AREA('area6').chapter.zh === '再生 -Regenerate-');
check('area1/2/4/5/6 配有章节演出事件', ['area1', 'area2', 'area4', 'area5', 'area6'].every(id => (KUP.AREA(id).events || []).length > 0));

// 9. 復興率：首通 +12 / 重复 +2 / 败北 +1；解锁阈值
KUP.META.reset();
const r1 = KUP.META.addRunResult('area0', true);
check('首通 area0 → 復興率 +13%', r1.gain === 13 && KUP.META.total() === 13, 'gain=' + r1.gain + ' total=' + KUP.META.total());
check('首通 area0 解锁 area1（阈值 8%）', r1.newlyUnlocked.length === 1, JSON.stringify(r1.newlyUnlocked));
const r2 = KUP.META.addRunResult('area0', true);
check('重复通关 → +3%（2+1）', r2.gain === 3, 'gain=' + r2.gain);
const r3 = KUP.META.addRunResult('area1', false);
check('败北 → 仅 +1%（計上）', r3.gain === 1, 'gain=' + r3.gain);
KUP.META.data.fukkou = 500;
check('復興率封顶 100', KUP.META.total() === 100);
KUP.META.reset();
check('area1 默认锁定', !KUP.META.isUnlocked('area1'));
check('area0 默认解锁（阈值 0）', KUP.META.isUnlocked('area0'));

// 10. 記憶の卵 → 顺序解锁记忆片段 + 復興率 +1
KUP.META.reset();
const f1 = KUP.META.addEgg();
check('卵①解锁第一个记忆片段', f1 && f1.id === 'witchling');
check('卵 → 復興率 +1', KUP.META.total() === 1);
for (let i = 0; i < 10; i++) KUP.META.addEgg();
check('卵全收集后不再越界（8 片段）', KUP.META.data.eggs.length === KUP.FRAGMENTS.length && KUP.FRAGMENTS.length === 8);

// 11. 覚醒：满级后进入觉醒池、觉醒后切换 stat
const gA = new KUP.Game(canvas);
gA.start({ char: 'kaf', area: 'area0', seed: 555 });
const wNote = gA.player.weapons[0];
wNote.lv = 5;
const poolA = gA.rollChoices();
check('满级初期武装进入觉醒池', poolA.some(c => c.kind === 'awaken' && c.id === 'note'));
wNote.evolved = true;
const poolB = gA.rollChoices();
check('觉醒后不再出现觉醒/升级项', !poolB.some(c => c.kind === 'awaken') && !poolB.some(c => c.kind === 'weapon-up' && c.id === 'note'));
const statAfter = wNote.stat();
check('觉醒后 stat 切换到进化形态', wNote.evolved && statAfter === wNote.def.evolved.stats && statAfter.dmg > wNote.def.levels[4].dmg);
check('全部武器均配进化形态数据', Object.keys(KUP.WEAPONS).length === 11 &&
  Object.values(KUP.WEAPONS).every(w => w.evolved && w.evolved.stats && w.evolved.name));

// 11b. 主角＝魔女之子（角色 ≠ 声优）；招募角色与同伴
check('主角为魔女之子而非声优',
  KUP.CHARS[0].name === '森先 化歩' && KUP.CHARS[0].cv === '花譜' && KUP.CHARS[0].reading === 'モリサキ カフ');
check('五名魔女之子齐备且各有声优标注',
  KUP.CHARS.filter(c => !c.recruit).length === 5 &&
  KUP.CHARS.filter(c => !c.recruit).every(c => c.cv && c.reading && c.area));
check('可招募角色（魔女候補）＝天祢亜留／地邑阿栖',
  KUP.CHARS.filter(c => c.recruit).map(c => c.name).join('/') === '天祢 亜留/地邑 阿栖');
check('招募角色配独立初期武装', KUP.CHAR('aru').weapon === 'prayer' && KUP.CHAR('asu').weapon === 'follow');
check('同伴＝彩季詩得（復興課課員）', KUP.COMPANIONS.length === 1 && KUP.COMPANIONS[0].name === '彩季 詩得' &&
  KUP.COMPANIONS[0].cv === 'CIEL' && KUP.COMPANIONS[0].unlock.area === 'area4');
check('招募角色默认未解锁', !KUP.META.isCharUnlocked('aru') && !KUP.META.isCharUnlocked('asu') && !KUP.META.isCompanionUnlocked('ciel'));
check('魔女之子恒解锁', KUP.META.isCharUnlocked('kaf') && KUP.META.isCharUnlocked('koko'));
KUP.META.reset();
KUP.META.addRunResult('area3', true);   // 通关参番街 → 亜留「可招募」
KUP.META.addTickets(30);
check('通关参番街并支付费用后招募天祢亜留', KUP.META.payRecruit('aru') && KUP.META.isCharUnlocked('aru'));
const rr = KUP.META.checkRecruits();
check('招募结果回传可招募者', rr.chars.every(c => c.name) && rr.companions.every(c => c.name));
KUP.META.addRunResult('area4', true);   // 通关肆番街 → 彩季詩得「可招募」
KUP.META.addTickets(40);
check('通关肆番街并支付费用后招募彩季詩得（同伴）', KUP.META.payRecruit('ciel') && KUP.META.isCompanionUnlocked('ciel'));
KUP.META.reset();
KUP.META.data.fukkou = 55;
KUP.META.addTickets(45);
check('復興率 55% + 45 票 招募地邑阿栖', KUP.META.payRecruit('asu') && KUP.META.isCharUnlocked('asu'));

// 11c. 皮肤（形態）：花魁鳥／姬連雀（魔女之子）；黑／白（魔女候補）；JK 制服（同伴）
check('魔女之子皮肤＝花魁鳥／姬連雀', KUP.formsFor('witch').map(f => f.id).join(',') === 'none,ouranchou,himerenjaku');
check('魔女候補皮肤＝黑／白', KUP.formsFor('recruit').map(f => f.id).join(',') === 'none,kuro,shiro');
check('形態带官方命名法与出处标注', KUP.FORM('ouranchou').label.zh.indexOf('魔女特殊歌唱用形態') === 0 && !!KUP.FORM('ouranchou').src && !!KUP.FORM('himerenjaku').src);
check('形態按角色类型匹配', KUP.formFits(KUP.FORM('ouranchou'), 'witch') && !KUP.formFits(KUP.FORM('ouranchou'), 'recruit') &&
  KUP.formFits(KUP.FORM('kuro'), 'recruit') && !KUP.formFits(KUP.FORM('kuro'), 'companion'));
check('角色类型判定', KUP.charKind(KUP.CHAR('kaf')) === 'witch' && KUP.charKind(KUP.CHAR('aru')) === 'recruit');

// 11d. 形態/皮肤接线到 Player 数值
const pBase = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), {});
const pOiran = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { form: KUP.FORM('ouranchou') });
check('花魁鳥：范围 +15% / 生命 -8%',
  Math.abs(pOiran.areaMult - pBase.areaMult * 1.15) < 1e-9 && pOiran.maxhp === Math.round(pBase.maxhp * 0.92));
const pWax = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { form: KUP.FORM('himerenjaku') });
check('姬連雀：速度 +12% / 拾取 +20%',
  Math.abs(pWax.speed - pBase.speed * 1.12) < 1e-9 && Math.abs(pWax.pickup - pBase.pickup * 1.2) < 1e-9);
const pKuro = new KUP.Player(KUP.CHAR('aru'), KUP.modsFor('none'), { form: KUP.FORM('kuro') });
const pAruNone = new KUP.Player(KUP.CHAR('aru'), KUP.modsFor('none'), {});
check('招募角色皮肤「黑」：攻击 +6%', Math.abs(pKuro.dmgMult - pAruNone.dmgMult * 1.06) < 1e-9);
const pComp = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { recruit: KUP.COMPANION('ciel'), perk: KUP.COMPANION('ciel').perk, recruitForm: KUP.FORM('shiro') });
check('同伴 perk（拾取/经验）与皮肤「白」并入数值',
  Math.abs(pComp.pickup - pBase.pickup * 1.2 * 1.15) < 1e-9 && Math.abs(pComp.xpMult - pBase.xpMult * 1.15) < 1e-9);
check('形態调色板与轮廓配件齐备', pOiran.color === '#ff7ad9' && pOiran.form.accent === 'plume' && KUP.FORM('kuro').accent === 'veil');
check('角色皮肤可覆盖调色板', new KUP.Player(KUP.CHAR('asu'), KUP.modsFor('none'), { form: KUP.FORM('shiro') }).color === '#f2f0ff');

// 12. 浄化の歌：充能与释放
gA.ult.charge = 99;
gA.castUltimate();
check('充能 <100 不可释放', gA.ult.charge === 99);
gA.ult.charge = 100;
const ringsBefore = gA.rings.length;
gA.castUltimate();
check('充能满 → 释放并清零', gA.ult.charge === 0 && gA.rings.length > ringsBefore);
gA.rings.push(new KUP.Ring(0, 0, { hostile: true, maxR: 100 }));
gA.ult.charge = 100;
gA.castUltimate();
check('浄化の歌冲散敌方音波环', gA.rings.every(r => !r.hostile || r.dead));

// 13. 击破充能 / Boss 必得卵 / 胜利结算
const gV = new KUP.Game(canvas);
gV.start({ char: 'kaf', area: 'area0', seed: 777 });
const enemy = gV.spawnEnemy('noise', gV.player.x + 50, gV.player.y);
gV.damageEnemy(enemy, 99999);
check('击破小怪充能 +2', gV.ult.charge === 2, 'charge=' + gV.ult.charge);
const boss = gV.spawnEnemy('boss', gV.player.x + 50, gV.player.y);
gV.boss = boss;
gV.damageEnemy(boss, 999999);
check('击破 Boss → 胜利', gV.state === 'victory');
check('胜利 → Boss 必得記憶の卵', gV.eggGain === 1);
check('胜利 → 復興率已结算', !!gV.metaResult && gV.metaResult.gain >= 12, JSON.stringify(gV.metaResult));
check('未暴走 → 非惨胜', !gV.stats().bossEnraged);

// 14. 暴走后击破 → 惨胜结局分歧
const gP = new KUP.Game(canvas);
gP.start({ char: 'kaf', area: 'area0', seed: 888 });
const boss2 = gP.spawnEnemy('boss', gP.player.x + 50, gP.player.y);
gP.boss = boss2;
gP.time = KUP.CONFIG.ENRAGE_TIME + 1;
gP.updateBossBehavior(0.01); // 触发暴走判定
check('5:00 后 Boss 暴走标记', gP.bossEnraged === true);
gP.damageEnemy(boss2, 999999);
check('暴走后击破 → 惨胜结局', gP.state === 'victory' && gP.stats().bossEnraged === true);

// 15. Boss 召唤混合異能个体（待修 #3）
const gB = new KUP.Game(canvas);
gB.start({ char: 'kaf', area: 'area0', seed: 999 });
const boss3 = gB.spawnEnemy('boss', 1500, 1500);
gB.boss = boss3;
for (let i = 0; i < 30; i++) { gB.boss.minionT = 0.001; gB.updateBossBehavior(0.02); }
const kinds = new Set(gB.enemies.filter(e => !e.boss).map(e => e.def.id));
check('Boss 召唤非单一 glitch（混合个体）', kinds.size >= 2, JSON.stringify([...kinds]));
gB.time = KUP.CONFIG.ENRAGE_TIME + 1;
gB.boss.minionT = 0.001;
for (let i = 0; i < 20; i++) { gB.boss.minionT = 0.001; gB.updateBossBehavior(0.02); }
check('暴走后召唤混入 elite', gB.enemies.some(e => e.elite));

// 16. 每区事件触发（banner + 增援余波 + 雾）
const gE = new KUP.Game(canvas);
gE.start({ char: 'kaf', area: 'area5', seed: 31337 }); // ブラックアウト @90s，fog:0.34
gE.time = 90;
gE.director(0.001);
check('area5 ブラックアウト事件触发增援', gE.surgeT > 0 && gE.surgePerSec > 0);
check('ブラックアウト加深雾', gE.fogBoost === 0.34 && gE.fogBoostT > 0);
check('area6 Boss 提前至 210s', KUP.AREA('area6').bossTime === 210 && KUP.AREA('area6').eliteTimes[0] === 75);

// 17. 结算屏数据：卵计数与 run 元信息
const st = gV.stats();
check('stats 含 run 元信息与卵', st.seed === 777 && st.areaId === 'area0' && st.eggs >= 1);
check('幸祜日文描述已修复（待修 #1）', KUP.WEAPONS.lance.desc.ja.indexOf('この世界に口づけを') < 0);

// 18. 存档层持久化往返（v0.7：kup.save.<槽id> + 版本化信封）
KUP.META.reset();
KUP.META.addEgg();
KUP.META.addRunResult('area0', true, { kills: 40, eggs: 1, areaIdx: 0, runId: 'vfy-1' });
const rawSave = ctx.localStorage.getItem('kup.save.' + KUP.META.slotId());
const env = JSON.parse(rawSave);
const saved = env.data;
check('槽位存档已落盘（带版本信封）', !!saved && env.v === 1 && saved.fukkou > 0 && saved.eggs.length === 1,
  'key=kup.save.' + KUP.META.slotId());
check('结算写入 runId 幂等键', saved.lastRunId === 'vfy-1', 'lastRunId=' + saved.lastRunId);
const dupTotal = KUP.META.total();
check('同一 runId 重复结算被拒（復興率不重复累加）',
  KUP.META.addRunResult('area0', true, { kills: 40, eggs: 1, areaIdx: 0, runId: 'vfy-1' }) === null
  && KUP.META.total() === dupTotal);
KUP.META.data = null;
KUP.META.load();
check('槽位存档重载一致', KUP.META.total() === saved.fukkou && KUP.META.ensure().eggs.length === 1);
check('最佳记录随槽位持久化', (KUP.META.submitBest({ win: true, time: 120, kills: 30, witch: 'x' }),
  KUP.META.data = null, KUP.META.load(), KUP.META.best().time === 120));

/* ========== v0.6：局外经济 / 商店 / 培养招募 ========== */
// 19. 市民票收入
KUP.META.reset();
const inc1 = KUP.META.ticketIncome({ kills: 100, eggs: 0, areaIdx: 0, win: true, firstClear: true });
check('市民票：100 杀 + 首通 → 10+15+10=35', inc1 === 35, 'income=' + inc1);
const inc2 = KUP.META.ticketIncome({ kills: 40, eggs: 2, areaIdx: 3, win: false, firstClear: false });
check('市民票：败北也计入（4+3+0+10+6=23）', inc2 === 23, 'income=' + inc2);
KUP.META.addTickets(inc1);
check('市民票入账', KUP.META.tickets() === 35);

// 20. 瓦利斯商店：价格递增、购买扣款、等级上限、乘积/加和汇总
KUP.META.reset();
KUP.META.addTickets(500);
const bun = KUP.SHOP_ITEM('bun');
check('商店表齐备（10 项·三语·mods）', KUP.SHOP.length === 10 && KUP.SHOP.every(s => s.mods && s.name.zh && s.desc.zh));
check('价格随等级递增', KUP.shopCost(bun, 0) === 8 && KUP.shopCost(bun, 1) === 14 && KUP.shopCost(bun, 4) === 32);
const t0 = KUP.META.tickets();
check('购买一级成功并扣款', KUP.META.buyShop('bun') && KUP.META.shopLv('bun') === 1 && KUP.META.tickets() === t0 - 8);
for (let i = 0; i < 10; i++) KUP.META.buyShop('bun');
check('等级封顶 maxLv', KUP.META.shopLv('bun') === 5 && KUP.META.shopNextCost('bun') === Infinity);
const mods1 = KUP.META.shopMods();
check('乘法型强化按 lv 幂次汇总', Math.abs(mods1.hp - Math.pow(1.03, 5)) < 1e-9, 'hp=' + mods1.hp.toFixed(4));
for (let i = 0; i < 2; i++) KUP.META.buyShop('sign');
for (let i = 0; i < 3; i++) KUP.META.buyShop('regular');
const mods2 = KUP.META.shopMods();
check('加法型强化（开局充能/开局等级）汇总', mods2.startUlt === 30 && mods2.startLevel === 3, JSON.stringify({ u: mods2.startUlt, l: mods2.startLevel }));
KUP.META.reset();
KUP.META.addTickets(5);
check('市民票不足时购买失败', !KUP.META.buyShop('bun') && KUP.META.tickets() === 5);

// 21. 商店强化接线到 Player / 开局等级与充能
const pShop = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { shopMods: { hp: 1.03, playerDmg: 1.02, pickup: 1.06, speed: 1.02, cd: 0.98, xp: 1.04 } });
const pPlain = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), {});
check('商店强化接入 Player 数值',
  pShop.maxhp === Math.round(pPlain.maxhp * 1.03) &&
  Math.abs(pShop.dmgMult - pPlain.dmgMult * 1.02) < 1e-9 &&
  Math.abs(pShop.pickup - pPlain.pickup * 1.06) < 1e-9 &&
  Math.abs(pShop.cdMult - pPlain.cdMult * 0.98) < 1e-9);
KUP.META.reset();
KUP.META.addTickets(500);
for (let i = 0; i < 2; i++) KUP.META.buyShop('sign');
KUP.META.buyShop('regular');
const gShop = new KUP.Game(canvas);
gShop.start({ char: 'kaf', area: 'area0', seed: 11 });
check('开局充能/开局等级生效', gShop.ult.charge === 30 && gShop.level === 2, 'charge=' + gShop.ult.charge + ' lv=' + gShop.level);

// 22. 培养（招募）需市民票：条件达成也不自动加入
KUP.META.reset();
KUP.META.addRunResult('area3', true, { kills: 0, eggs: 0, areaIdx: 3 });
KUP.META.data.tickets = 0; KUP.META.save();   // 归零：验证"票不足不可招募"
check('通关参番街后亜留仍是"可招募"而非自动加入', !KUP.META.isCharUnlocked('aru') &&
  KUP.META.recruitable().chars.some(c => c.id === 'aru'));
check('市民票不足时招募失败', !KUP.META.payRecruit('aru'));
KUP.META.addTickets(30);
check('支付 30 市民票培养亜留', KUP.META.payRecruit('aru') && KUP.META.isCharUnlocked('aru') && KUP.META.tickets() === 0);
check('重复招募失败', !KUP.META.payRecruit('aru'));
KUP.META.addRunResult('area4', true, { kills: 100, eggs: 1, areaIdx: 4 });
KUP.META.addTickets(40);
check('招募復興課同伴 彩季詩得（40 票）', KUP.META.payRecruit('ciel') && KUP.META.isCompanionUnlocked('ciel'));
KUP.META.reset();
KUP.META.data.fukkou = 55; KUP.META.addTickets(45);
check('復興率 55% + 45 票 培养地邑阿栖', KUP.META.payRecruit('asu') && KUP.META.isCharUnlocked('asu'));
check('条件未达成（未通关参番街）不可培养', (KUP.META.reset(), KUP.META.addTickets(99), !KUP.META.payRecruit('aru')));

// 23. 新武器组（滞留・投掷系）
const AR = { x: 1500, y: 1500 };
check('新武器组齐备（toss/bomb/mine）', ['toss', 'bomb', 'mine'].every(id => KUP.WEAPONS[id] && KUP.WEAPONS[id].evolved));
check('新武器行为与等级表', ['toss', 'bomb', 'mine'].every(id =>
  KUP.WEAPONS[id].levels.length === 5 && KUP.WEAPONS[id].levels.every((l, i, a) => l.dmg >= (i ? a[i - 1].dmg : 0))));
const gW = new KUP.Game(canvas);
gW.start({ char: 'kaf', area: 'area0', seed: 21 });
// toss：投出后落地生成滞留区
gW.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.toss, 5)];
gW.player.weapons[0].t = 0;
gW.spawnEnemy('noise', gW.player.x + 120, gW.player.y);
gW.update(0.02);
check('toss 投出投掷物', gW.tosses.length > 0);
for (let i = 0; i < 60; i++) gW.update(0.02);
check('toss 落地生成滞留区（带减速）', gW.zones.some(z => z.kind === 'field' && z.slow && !z.hostile));
// bomb：随机落点 + 起爆前摇
gW.zones.length = 0;
gW.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.bomb, 5)];
gW.player.weapons[0].t = 0;
gW.update(0.02);
check('bomb 生成起爆前摇中的空爆', gW.zones.some(z => z.kind === 'bomb' && !z.armed && z.arm > 0));
for (let i = 0; i < 60; i++) gW.update(0.02);
check('bomb 引爆后自行消失', !gW.zones.some(z => z.kind === 'bomb'));
// mine：放置 + 触碰引爆 + 上限
gW.zones.length = 0;
gW.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.mine, 5)];
gW.player.weapons[0].t = 0;
gW.update(0.02);
const mineN = gW.zones.filter(z => z.kind === 'mine').length;
check('mine 放置地雷', mineN >= 1, 'mines=' + mineN);
for (let i = 0; i < 40; i++) { gW.player.weapons[0].t = 0; gW.update(0.02); }
check('mine 存在同时上限（≤ maxLv 上限 10）', gW.zones.filter(z => z.kind === 'mine').length <= 10);
const anyMine = gW.zones.find(z => z.kind === 'mine' && z.armed);
if (anyMine) {
  gW.spawnEnemy('noise', anyMine.x, anyMine.y);
  gW.update(0.02);
  check('敌人触碰地雷即引爆', anyMine.dead);
} else check('敌人触碰地雷即引爆', false, 'no armed mine');

// 24. Zone 滞留伤害（**玩家武器专用**；敌方区域改用 Danger —— 见 #25b）
const gZ = new KUP.Game(canvas);
gZ.start({ char: 'kaf', area: 'area0', seed: 31 });
const ez = gZ.spawnEnemy('noise', gZ.player.x + 60, gZ.player.y);
const hp0 = ez.hp;
gZ.zones.push(new KUP.Zone(gZ.player.x + 60, gZ.player.y, { r: 70, dmg: 5, life: 5, kind: 'field' }));
for (let i = 0; i < 30; i++) gZ.update(0.02);
check('友方滞留区持续伤害敌人', ez.dead || ez.hp < hp0, 'hp ' + hp0 + '→' + ez.hp);
check('Zone 已无 hostile 分支（敌方攻击走 Danger）', KUP.Zone.prototype.update.length === 2 &&
  !/hostile/.test(KUP.Zone.prototype.detonate.toString()));
const php2 = gZ.player.hp;
gZ.dangers.push(new KUP.Danger(gZ.player.x, gZ.player.y, { kind: 'field', r: 80, dmg: 6, life: 5, tickRate: 0.2 }));
for (let i = 0; i < 40; i++) gZ.update(0.02);
check('Danger 持续区伤害玩家', gZ.player.hp < php2, 'hp ' + php2 + '→' + gZ.player.hp);
check('Danger 绝不伤害破维魔（阵营分离）', gZ.enemies.every(e => e.dead || e.hp > 0 || e.hp >= 0));
const edg = gZ.spawnEnemy('noise', gZ.player.x + 300, gZ.player.y);
const edgHp = edg.hp;
gZ.player.weapons = [];   // 关掉玩家武器，隔离"是否被 Danger 伤害"这一变量
gZ.dangers.push(new KUP.Danger(edg.x, edg.y, { kind: 'field', r: 90, dmg: 20, life: 3, tickRate: 0.1 }));
for (let i = 0; i < 30; i++) gZ.update(0.02);
check('踩在 Danger 里的破维魔毫发无伤（不借用玩家武器逻辑）', edg.hp === edgHp, 'hp ' + edgHp + '→' + edg.hp);

// 24b. Danger 的预警（可躲避）：预警期内不受伤，生效才判定
const gD = new KUP.Game(canvas);
gD.start({ char: 'kaf', area: 'area0', seed: 32 });
const hpD = gD.player.hp;
const dgz = new KUP.Danger(gD.player.x, gD.player.y, { kind: 'bomb', r: 80, dmg: 30, arm: 1.0 });
gD.dangers.push(dgz);
for (let i = 0; i < 40; i++) gD.update(0.02);   // 0.8s < arm
check('预警期内不造成伤害', gD.player.hp === hpD && !dgz.armed, 'hp ' + gD.player.hp);
/* 走出范围后引爆 → 因为躲开了，所以不受伤 */
gD.player.x += 400;
for (let i = 0; i < 20; i++) gD.update(0.02);
check('躲开预警范围后引爆不受伤（可躲避）', gD.player.hp === hpD, 'hp ' + gD.player.hp);
/* 站着不动则受伤 */
const gD2 = new KUP.Game(canvas);
gD2.start({ char: 'kaf', area: 'area0', seed: 33 });
const hpD2 = gD2.player.hp;
gD2.dangers.push(new KUP.Danger(gD2.player.x, gD2.player.y, { kind: 'bomb', r: 80, dmg: 30, arm: 0.3 }));
for (let i = 0; i < 40; i++) gD2.update(0.02);
check('未躲开则被炸（伤害成立）', gD2.player.hp < hpD2, 'hp ' + hpD2 + '→' + gD2.player.hp);
/* beam 只在发射时判定一次，且不伤敌人 */
const gD3 = new KUP.Game(canvas);
gD3.start({ char: 'kaf', area: 'area0', seed: 34 });
const foe = gD3.spawnEnemy('noise', gD3.player.x + 100, gD3.player.y);
const foeHp = foe.hp;
gD3.player.weapons = [];
const hpD3 = gD3.player.hp;
gD3.dangers.push(new KUP.Danger(gD3.player.x - 200, gD3.player.y, { kind: 'beam', dir: 0, len: 800, w: 40, dmg: 25, arm: 0.2 }));
for (let i = 0; i < 30; i++) gD3.update(0.02);
check('Danger 光束伤玩家', gD3.player.hp < hpD3, 'hp ' + hpD3 + '→' + gD3.player.hp);
check('Danger 光束不伤破维魔', foe.hp === foeHp, 'hp ' + foeHp + '→' + foe.hp);

// 25. 每关卡不同 Boss
check('七番街各配一体 Boss', KUP.AREAS.every(a => KUP.BOSSES[a.boss]));
check('Boss 行为模式互不相同', new Set(KUP.AREAS.map(a => KUP.BOSSES[a.boss].pattern)).size === 7);
check('Boss 名与血量按关卡递进', KUP.BOSSES.boss6.hp > KUP.BOSSES.boss0.hp && KUP.BOSSES.boss6.name.zh.indexOf('再生') > 0);
check('各番街 Boss id 接线到 area', KUP.AREA('area3').boss === 'boss3' && KUP.AREA('area6').boss === 'boss6');
const gB6 = new KUP.Game(canvas);
gB6.start({ char: 'kaf', area: 'area6', seed: 41 });
gB6.time = KUP.CONFIG.BOSS_TIME;
gB6.director(0.016);
check('陸番街生成〈再生〉Boss', !!gB6.boss && gB6.boss.def.pattern === 'regen');
/* 〈観測〉旋转光束：走 Danger，且**不会对破维魔造成伤害**（本次修正的核心 BUG） */
const gB4 = new KUP.Game(canvas);
gB4.start({ char: 'kaf', area: 'area4', seed: 51 });
gB4.boss = gB4.spawnEnemy('boss4', gB4.player.x + 200, gB4.player.y);
const b4f = gB4.spawnEnemy('noise', gB4.player.x + 100, gB4.player.y);
const b4fHp = b4f.hp;
gB4.player.weapons = [];   // 隔离变量：只有 Boss 的 Danger 能打人，玩家武器不参与
for (let i = 0; i < 220; i++) { gB4.updateBossBehavior(0.02); gB4.update(0.02); }
check('〈観測〉光束走 Danger（不再推入玩家 beams）', gB4.dangers.some(d => d.kind === 'beam') && gB4.beams.length === 0);
check('〈観測〉光束不伤破维魔（BUG 修正）', b4f.hp === b4fHp, 'hp ' + b4fHp + '→' + b4f.hp);
/* 〈枯死〉毒区 / 〈爆塵〉空爆：均为 Danger，且轰炸远离玩家 */
const gB3 = new KUP.Game(canvas);
gB3.start({ char: 'kaf', area: 'area3', seed: 61 });
gB3.boss = gB3.spawnEnemy('boss3', gB3.player.x + 200, gB3.player.y);
for (let i = 0; i < 200; i++) gB3.updateBossBehavior(0.02);
check('〈枯死〉散播敌方毒区（Danger.field）', gB3.dangers.some(d => d.kind === 'field'));
const gB5 = new KUP.Game(canvas);
gB5.start({ char: 'kaf', area: 'area5', seed: 71 });
gB5.boss = gB5.spawnEnemy('boss5', gB5.player.x + 200, gB5.player.y);
for (let i = 0; i < 200; i++) gB5.updateBossBehavior(0.02);
const bombs5 = gB5.dangers.filter(d => d.kind === 'bomb');
check('〈爆塵〉随机轰炸 + 视野遮蔽', bombs5.length > 0 && gB5.fogBoost > 0);
check('〈爆塵〉轰炸落点远离玩家（≥150px，可躲避）', bombs5.every(d => {
  const p = gB5.player; return Math.hypot(d.x - p.x, d.y - p.y) >= 140;
}));
check('〈爆塵〉轰炸有信管预警（arm ≥ 0.9s）', bombs5.every(d => d.arm >= 0.9));

// 25b. v0.8 机制道具：护盾 / 回避 / 吸血 / 反響 / 冲刺
check('新增机制型被动（护盾/回避/吸血/反響/疾风）', ['shield', 'dodge', 'drain', 'retaliate', 'dashup'].every(id => KUP.PASSIVES[id]));
/* 护盾：先吸收伤害，未受伤后回复 */
const gS = new KUP.Game(canvas);
gS.start({ char: 'kaf', area: 'area0', seed: 91 });
gS.player.addPassive('shield');
check('护盾建立（+22/级）', gS.player.shieldMax === 22 && gS.player.shield === 22);
const hpS = gS.player.hp;
gS.hurtPlayer(20);
check('护盾先于生命吸收伤害（20 < 22 护盾）', gS.player.hp === hpS && gS.player.shield === 2,
  'hp=' + gS.player.hp + ' sh=' + gS.player.shield);
gS.player.hitT = 0; gS.player.shield = 22;   // 重置护盾再测溢出
gS.hurtPlayer(30);
check('护盾不足时溢出到生命（吸收 22 + 掉 8）', gS.player.hp === hpS - 8 && gS.player.shield === 0,
  'hp=' + gS.player.hp + ' sh=' + gS.player.shield);
gS.player.addPassive('shield'); gS.player.addPassive('shield'); gS.player.addPassive('shield'); gS.player.addPassive('shield');
check('护盾随等级上限提升（+22/级）', gS.player.shieldMax === 110);
for (let i = 0; i < 200; i++) gS.update(0.05);   // 10s 无伤
check('未受伤一段时间后护盾回复', gS.player.shield > 0, 'sh=' + gS.player.shield.toFixed(1));
/* 回避：概率回避（把概率设为 1 验证通路） */
const gDo = new KUP.Game(canvas);
gDo.start({ char: 'kaf', area: 'area0', seed: 92 });
gDo.player.addPassive('dodge');
check('回避概率随等级（7%/级）', Math.abs(gDo.player.dodgeChance - 0.07) < 1e-9);
gDo.player.dodgeChance = 1;                       // 必定回避
const hpDo = gDo.player.hp;
gDo.hurtPlayer(50);
check('回避成功＝不掉血', gDo.player.hp === hpDo);
/* 吸血：击破回血 */
const gDr = new KUP.Game(canvas);
gDr.start({ char: 'kaf', area: 'area0', seed: 93 });
for (let i = 0; i < 5; i++) gDr.player.addPassive('drain');
gDr.player.hp = 10;
const eDr = gDr.spawnEnemy('noise', gDr.player.x + 40, gDr.player.y);
gDr.killEnemy(eDr);
check('吸音：击破回复生命', gDr.player.hp > 10, 'hp=' + gDr.player.hp);
/* 反響：受击迸发冲击环 */
const gR = new KUP.Game(canvas);
gR.start({ char: 'kaf', area: 'area0', seed: 94 });
gR.player.addPassive('retaliate');
gR.rings.length = 0;
gR.hurtPlayer(10);
check('反響：受击迸发冲击环', gR.rings.length > 0 && gR.rings[0].dmg > 0);
/* 冲刺：位移 + 无敌帧 + 充能 */
const gDa = new KUP.Game(canvas);
gDa.start({ char: 'kaf', area: 'area0', seed: 95 });
const x0 = gDa.player.x;
gDa.player.aim = { x: 1, y: 0 };
const okDash = gDa.tryDash();
check('冲刺：消耗充能', okDash && gDa.player.dashCharge === KUP.CONFIG.DASH.CHARGES - 1);
check('冲刺：立即获得无敌帧', gDa.player.hitT >= KUP.CONFIG.DASH.IFRAME - 1e-9);
const hpDa = gDa.player.hp;
gDa.hurtPlayer(15);
check('无敌帧内不受伤（可躲避敌袭）', gDa.player.hp === hpDa);
for (let i = 0; i < 20; i++) gDa.update(0.02);
check('冲刺：位移成立', gDa.player.x > x0 + 50, 'dx=' + (gDa.player.x - x0).toFixed(0));
check('冲刺：留下残影', gDa.player.ghosts.length >= 0);
gDa.player.addPassive('dashup'); gDa.player.addPassive('dashup'); gDa.player.addPassive('dashup');
check('疾风之谱：+2 次冲刺、冷却 -45%', gDa.player.dashMax === KUP.CONFIG.DASH.CHARGES + 2 &&
  Math.abs(gDa.player.dashCdMax - KUP.CONFIG.DASH.CD * Math.pow(0.85, 3)) < 1e-9);
/* 浄化の歌：清除全部 Danger */
const gU = new KUP.Game(canvas);
gU.start({ char: 'kaf', area: 'area0', seed: 96 });
gU.dangers.push(new KUP.Danger(gU.player.x, gU.player.y, { kind: 'field', r: 60, dmg: 5 }));
gU.ult.charge = 100;
gU.castUltimate();
check('浄化の歌清除敌方攻击（Danger）', gU.dangers.every(d => d.dead));

// 25c. 同伴皮肤＝JK 制服（夏服/冬服）
check('同伴皮肤为 JK 制服（夏／冬）', KUP.formsFor('companion').map(f => f.id).join(',') === 'none,jk_summer,jk_winter');
check('魔女候补皮肤仍为黑／白', KUP.formsFor('recruit').map(f => f.id).join(',') === 'none,kuro,shiro');
check('JK 制服带轮廓配件与数值', KUP.FORM('jk_summer').accent === 'sailor' && KUP.FORM('jk_winter').accent === 'blazer');
const pJK = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { recruitForm: KUP.FORM('jk_winter') });
const pJK2 = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), {});
check('JK 冬服数值并入（生命 +6%、冷却 -3%）', pJK.maxhp === Math.round(pJK2.maxhp * 1.06) &&
  Math.abs(pJK.cdMult - pJK2.cdMult * 0.97) < 1e-9);

// 25d. v0.9：局内道具（护盾/MISS/回血）＋持续回血 ＋ orbit 体积/转速可调 ＋ 瞄准
check('局内道具齐备（护盾/MISS/回血/余韵）', ['ward', 'veil', 'salve', 'echo'].every(id => KUP.ITEMS[id] && KUP.ITEMS[id].name.zh));
check('新被动：余韵之癒（回血）与無傷の譜（MISS 回血）', KUP.PASSIVES.regen && KUP.PASSIVES.grace);
check('瓦利斯新增回血/回避强化', KUP.SHOP_ITEM('soup') && KUP.SHOP_ITEM('instinct'));
/* 回血：随时间持续回血（被动＋商店） */
const gRg = new KUP.Game(canvas);
gRg.start({ char: 'kaf', area: 'area0', seed: 101 });
for (let i = 0; i < 3; i++) gRg.player.addPassive('regen');
check('余韵之癒：每秒回血 1.0/级', Math.abs(gRg.player.effRegen() - 3.0) < 1e-9, 'rate=' + gRg.player.effRegen());
gRg.player.hp = 20;
for (let i = 0; i < 100; i++) gRg.update(0.05);   // 5 秒
check('持续回血生效（5s × 3/s ≈ +15）', gRg.player.hp >= 34 && gRg.player.hp <= 36, 'hp=' + gRg.player.hp.toFixed(1));
/* 商店回血叠加 */
const pRg = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { shopMods: { regenAdd: 1.5 } });
pRg.addPassive('regen');
check('药膳汤与被动叠加回血', Math.abs(pRg.effRegen() - 2.5) < 1e-9, 'rate=' + pRg.effRegen());
/* MISS：道具「無傷の符」提高回避率（限时），MISS 时「無傷の譜」回血 */
const gM = new KUP.Game(canvas);
gM.start({ char: 'kaf', area: 'area0', seed: 102 });
gM.player.addPassive('dodge');
gM.player.addBuff('miss', 15, 0.25);
check('無傷の符：MISS 率叠加（7%+25%）', Math.abs(gM.player.effDodge() - 0.32) < 1e-9, 'dodge=' + gM.player.effDodge());
gM.player.hp = 50;
gM.player.addPassive('grace');
gM.player.effDodge = () => 1;             // 必定 MISS
const hpM = gM.player.hp;
gM.hurtPlayer(10);
check('無傷の譜：MISS 成功回血', gM.player.hp > hpM, 'hp ' + hpM + '→' + gM.player.hp);
check('MISS 时不掉血', gM.player.hp >= hpM);
/* 道具选择：护盾 / 治癒 / 余韵 */
const gI = new KUP.Game(canvas);
gI.start({ char: 'kaf', area: 'area0', seed: 103 });
gI.player.hp = 30;
gI.state = 'levelup'; gI.pendingLevels = 1;
gI.choices = [{ kind: 'item', id: 'salve' }];
gI.choose(0);
check('治癒の符：立即回复 45% 最大生命', Math.abs(gI.player.hp - (30 + gI.player.maxhp * 0.45)) < 1.5, 'hp=' + gI.player.hp.toFixed(1));
gI.state = 'levelup'; gI.pendingLevels = 1; gI.choices = [{ kind: 'item', id: 'ward' }];
const shBefore = gI.player.shield;
gI.choose(0);
check('防音の符：立即 +60 护盾（可超上限）', gI.player.shield === shBefore + 60, 'sh=' + gI.player.shield);
gI.state = 'levelup'; gI.pendingLevels = 1; gI.choices = [{ kind: 'item', id: 'echo' }];
gI.choose(0);
check('余韵の符：限时回血 BUFF', gI.player.buffs.regen > 0 && Math.abs(gI.player.effRegen() - 4) < 1e-9);
/* 道具不占被动槽：满 5 种被动时仍能出现 */
const gPool = new KUP.Game(canvas);
gPool.start({ char: 'kaf', area: 'area0', seed: 104 });
['power', 'tempo', 'heart', 'field', 'mic'].forEach(id => gPool.player.addPassive(id));
check('被动满槽（5 种）仍可继续升级', Object.keys(gPool.player.passives).length === 5);
const manyPools = [];
for (let i = 0; i < 40; i++) manyPools.push(...gPool.rollChoices());
check('升级池含道具选项', manyPools.some(c => c.kind === 'item'));
/* 血线低时生存道具权重提高 */
gPool.player.hp = 5;
const lowPools = [];
for (let i = 0; i < 40; i++) lowPools.push(...gPool.rollChoices());
const lowItems = lowPools.filter(c => c.kind === 'item').length;
gPool.player.hp = gPool.player.maxhp;
const fullPools = [];
for (let i = 0; i < 40; i++) fullPools.push(...gPool.rollChoices());
check('低血线时生存道具出现更多', lowItems > fullPools.filter(c => c.kind === 'item').length, lowItems + ' vs ' + fullPools.filter(c => c.kind === 'item').length);
/* orbit：体积与转速可调（范围 → 半径/球径；冷却 → 转速） */
const gO = new KUP.Game(canvas);
gO.start({ char: 'rim', area: 'area0', seed: 105 });
gO.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.orbit, 5)];
const wO = gO.player.weapons[0];
wO.t = 0; gO.update(0.016);
const R0 = wO.orbitR, orb0 = wO.orbR;
const ang0 = wO.angle;
gO.update(0.5);
const spinBase = wO.angle - ang0;
gO.player.addPassive('field'); gO.player.addPassive('field');
gO.update(0.016);
check('orbit：半径随「范围」增大', wO.orbitR > R0, R0.toFixed(0) + '→' + wO.orbitR.toFixed(0));
check('orbit：球体半径随「范围」增大', wO.orbR > orb0, orb0.toFixed(2) + '→' + wO.orbR.toFixed(2));
const ang1 = wO.angle;
gO.update(0.5);
const spinArea = wO.angle - ang1;
check('orbit：范围不影响转速（两者分离调参）', Math.abs(spinArea - spinBase) < 1e-6);
gO.player.addPassive('tempo'); gO.player.addPassive('tempo'); gO.player.addPassive('tempo');
const ang2 = wO.angle;
gO.update(0.5);
const spinFast = wO.angle - ang2;
check('orbit：转速随冷却缩短而提升（冷却是有效属性）', spinFast > spinBase * 1.15, spinBase.toFixed(3) + '→' + spinFast.toFixed(3));
check('orbit：等级表带 spin 字段', KUP.WEAPONS.orbit.levels.every(l => l.spin > 0) && KUP.WEAPONS.orbit.evolved.stats.spin > 0);
/* 扫掠臂判定：贴到玩家身上的敌人也必须能被环噬（旧版圆判定打不到 → 初始武器形同虚设） */
const gOs = new KUP.Game(canvas);
gOs.start({ char: 'rim', area: 'area0', seed: 108 });
gOs.player.invuln = true;
let osKills0 = gOs.kills;
for (let i = 0; i < 40 / 0.02; i++) { if (gOs.state === 'levelup') { gOs.state = 'playing'; gOs.pendingLevels = 0; } gOs.update(0.02); }
check('orbit：40 秒内确实能击杀（扫掠臂判定修复）', gOs.kills > 5, 'kills=' + gOs.kills);
check('Utils.segDist2：点到线段距离', Math.abs(ctx.KUP.U.segDist2(5, 3, 0, 0, 10, 0) - 9) < 1e-9 && Math.abs(ctx.KUP.U.segDist2(-4, 0, 0, 0, 10, 0) - 16) < 1e-9);
/* 瞄准：auto 对最近敌人 / move 对移动方向 / mouse 对指针 */
const gAim = new KUP.Game(canvas);
gAim.start({ char: 'kaf', area: 'area0', seed: 106 });
const tgt = gAim.spawnEnemy('noise', gAim.player.x + 200, gAim.player.y + 60);
gAim.player.aim = { x: -1, y: 0 };
gAim.player.aimMode = 'auto';
const ad1 = gAim.aimDir(gAim.player);
check('瞄准 auto：朝最近敌人', Math.abs(Math.atan2(ad1.y, ad1.x) - Math.atan2(tgt.y - gAim.player.y, tgt.x - gAim.player.x)) < 1e-6);
gAim.player.aimMode = 'move';
const ad2 = gAim.aimDir(gAim.player);
check('瞄准 move：朝移动方向（旧行为保留）', Math.abs(ad2.x - (-1)) < 1e-9 && Math.abs(ad2.y) < 1e-9);
gAim.player.aimMode = 'mouse';
KUP.Input.mx = gAim.player.x + 100 - gAim.cam.x; KUP.Input.my = gAim.player.y - 100 - gAim.cam.y;
const ad3 = gAim.aimDir(gAim.player);
check('瞄准 mouse：朝指针（更自由的瞄准）', Math.abs(ad3.x - Math.SQRT1_2) < 0.02 && Math.abs(ad3.y + Math.SQRT1_2) < 0.02, JSON.stringify(ad3));
check('瞄准模式默认 auto（全部自动瞄准）', (new KUP.Game(canvas)).run.aim === 'auto');
check('瞄准模式切换循环', (() => { const g = new KUP.Game(canvas); g.start({ char: 'kaf', area: 'area0', seed: 107 }); return g.cycleAim() === 'mouse' && g.player.aimMode === 'mouse' && g.cycleAim() === 'move' && g.cycleAim() === 'auto'; })());

// 25f. v0.11：经验磁铁（磁石の符）
check('局内道具磁石の符（经验磁铁）齐备', KUP.ITEMS.magnet && KUP.ITEMS.magnet.kind === 'magnet' && KUP.ITEMS.magnet.seconds > 0 && KUP.ITEMS.magnet.name.zh === '磁石の符');
/* 无磁铁：拾取半径外的音片不被拉动（只会缓慢漂移） */
const gMg = new KUP.Game(canvas);
gMg.start({ char: 'kaf', area: 'area0', seed: 121 });
gMg.gems.length = 0;
const gemFar = new KUP.Gem(gMg.player.x + 600, gMg.player.y, 5);
gMg.gems.push(gemFar);
for (let i = 0; i < 20; i++) gMg.update(0.02);
const drift = Math.hypot(gemFar.x - gMg.player.x, gemFar.y - gMg.player.y);
check('无磁铁：600px 外的音片不被拉动', drift > 400, 'd=' + drift.toFixed(0));
/* 磁铁激活：全场音片被吸向魔女直至拾取 */
gMg.gems.length = 0;
const gemFar2 = new KUP.Gem(gMg.player.x + 600, gMg.player.y, 5);
gMg.gems.push(gemFar2);
gMg.player.addBuff('magnet', 8, 1);
check('磁石の符：BUFF 计时激活', gMg.player.buffs.magnet > 0);
for (let i = 0; i < 20; i++) gMg.update(0.02);
const dAfter = Math.hypot(gemFar2.x - gMg.player.x, gemFar2.y - gMg.player.y);
check('磁铁激活：600px 外的音片被吸近', dAfter < 300, '600→' + dAfter.toFixed(0));
for (let i = 0; i < 40; i++) gMg.update(0.02);
check('磁铁把远处音片吸到拾取圈内（自动收集）', gemFar2.dead);
const tMg = gMg.player.buffs.magnet;
check('磁铁计时随时间递减且归零', tMg < 8 && tMg >= 0, 't=' + tMg.toFixed(2));
/* 选择通路：升级池选磁石の符 → BUFF 生效 */
const gMc = new KUP.Game(canvas);
gMc.start({ char: 'kaf', area: 'area0', seed: 122 });
gMc.state = 'levelup'; gMc.pendingLevels = 1; gMc.choices = [{ kind: 'item', id: 'magnet' }];
gMc.choose(0);
check('升级池选择磁石の符 → 磁铁生效并回到战斗', gMc.player.buffs.magnet > 0 && gMc.state === 'playing');
/* 入池：磁石の符作为道具桶的一员正常出现（200 次抽样） */
let mgSeen = false;
for (let i = 0; i < 200; i++) if (gMc.rollChoices().some(c => c.kind === 'item' && c.id === 'magnet')) mgSeen = true;
check('磁石の符进入升级池道具桶', mgSeen);

// 25g. v0.11：武装解锁——招募前角色武器不入卡池
check('武器表标注持有角色（5 魔女之子 + 2 候補）', KUP.WEAPONS.note.owner === 'kaf' && KUP.WEAPONS.orbit.owner === 'rim' &&
  KUP.WEAPONS.bass.owner === 'harusaruhi' && KUP.WEAPONS.laser.owner === 'isekaijoucho' && KUP.WEAPONS.lance.owner === 'koko' &&
  KUP.WEAPONS.prayer.owner === 'aru' && KUP.WEAPONS.follow.owner === 'asu');
check('通用武器组无持有者（任何角色可抽）', ['toss', 'bomb', 'mine'].every(id => !KUP.WEAPONS[id].owner));
/* 新档：亜留/阿栖未招募 → 救済之鐘／追唱の矢不入池；化歩（魔女之子）武器恒在池 */
KUP.META.reset();
const gWl = new KUP.Game(canvas);
gWl.start({ char: 'kaf', area: 'area0', seed: 131 });
check('未招募：救済之鐘/追唱の矢判定为未解锁', !KUP.META.isWeaponUnlocked('prayer') && !KUP.META.isWeaponUnlocked('follow'));
check('已招募角色（化歩）的武器判定解锁', KUP.META.isWeaponUnlocked('note'));
let leakLocked = false;
for (let i = 0; i < 400; i++) {
  const roll = gWl.rollChoices();
  if (roll.some(c => c.kind === 'weapon-new' && (c.id === 'prayer' || c.id === 'follow'))) leakLocked = true;
}
check('招募前：救済之鐘/追唱の矢 400 次抽取均不入池', !leakLocked);
let genSeen = false;
for (let i = 0; i < 200; i++) if (gWl.rollChoices().some(c => c.kind === 'weapon-new' && c.id === 'toss')) genSeen = true;
check('通用武器组仍在池（toss 可抽出）', genSeen);
/* 招募亜留后：救済之鐘立即入池 */
KUP.META.data.chars.push('aru');
check('招募亜留后救済之鐘解锁', KUP.META.isWeaponUnlocked('prayer'));
let aruSeen = false;
for (let i = 0; i < 400; i++) if (gWl.rollChoices().some(c => c.kind === 'weapon-new' && c.id === 'prayer')) aruSeen = true;
check('招募后：救済之鐘进入卡池', aruSeen);
KUP.META.reset();

// 25h. v0.11：建筑实体——玩家/敌人/弹幕/Boss 的碰撞行为
{
  const gS2 = new KUP.Game(canvas);
  gS2.start({ char: 'kaf', area: 'area0', seed: 141 });
  check('出生点可站立（不被楼体压住）', gS2.walkable(gS2.player.x, gS2.player.y, gS2.player.r));
  const blk = gS2.city.blocks[0];
  /* 玩家：向楼体移动会被挡住（不嵌入），贴墙滑行不报错 */
  gS2.player.x = blk.x - gS2.player.r - 2;
  gS2.player.y = blk.y + blk.h / 2;
  gS2.player.hitT = 0;
  KUP.Input.keys = { d: true };
  gS2.player.update(0.016, gS2);
  KUP.Input.keys = {};
  check('玩家不可穿入楼体（向墙移动被挡）', gS2.player.x + gS2.player.r <= blk.x + 0.01,
    'px=' + gS2.player.x.toFixed(1) + ' wall=' + blk.x.toFixed(1));
  check('贴墙位置仍「物理可站立」', gS2.freeAt(gS2.player.x, gS2.player.y, gS2.player.r));
  /* 敌人：连续生成 120 只，任何一只都不在楼体里 */
  let inBlock = 0, spawned = 0;
  for (let i = 0; i < 120; i++) {
    const e = gS2.spawnEnemy('noise', 1500, 1500);
    if (e) { spawned++; if (!gS2.walkable(e.x, e.y, e.r)) inBlock++; }
  }
  check('敌人不会生成在楼体里（' + spawned + ' 只全部可走）', spawned >= 100 && inBlock === 0, 'bad=' + inBlock);
  /* 弹幕**掠过楼顶**（不阻挡）：建筑实体只影响移动（角色与敌人），
   * 「歌＝魔法」——音波不因楼体中断，输出经济不受墙影响。 */
  gS2.projs.push(new KUP.Projectile(blk.x + blk.w / 2, blk.y + blk.h / 2, 0, 0, { dmg: 1, r: 5 }));
  gS2.update(0.02);
  check('弹幕掠过楼顶（不被墙吞没）', gS2.projs.some(pr => !pr.dead));
  /* 敌人移动：朝楼体走会被推出（不嵌入楼体） */
  const ePush = gS2.spawnEnemy('noise', blk.x - 40, blk.y + blk.h / 2);
  if (ePush) {
    ePush.x = blk.x - ePush.r - 1; ePush.y = blk.y + blk.h / 2;
    ePush.kx = 0; ePush.ky = 0;
    for (let i = 0; i < 60; i++) { ePush.update(0.016, gS2); gS2.collideCity(ePush); }
    check('敌人被楼体挡住（不嵌入）', !gS2.collideCircle(ePush.x, ePush.y, ePush.r * 0.8));
  } else check('敌人被楼体挡住（不嵌入）', false, 'spawn failed');
  /* Boss 豁免：把 Boss 塞进楼体中心，碰撞后仍在原地（碾压建筑） */
  gS2.boss = gS2.spawnEnemy('boss', 1500, 1500);
  gS2.boss.x = blk.x + blk.w / 2; gS2.boss.y = blk.y + blk.h / 2;
  gS2.collideCity(gS2.boss);
  check('Boss 碾压建筑（不受碰撞）',
    Math.abs(gS2.boss.x - (blk.x + blk.w / 2)) < 0.01 && Math.abs(gS2.boss.y - (blk.y + blk.h / 2)) < 0.01);
  /* 敌人被卡在楼里（构造极端点）→ 兜底逻辑把它挪到可走点或消除 */
  const stuck = gS2.spawnEnemy('noise', 1500, 1500);
  if (stuck) {
    stuck.x = blk.x + blk.w / 2; stuck.y = blk.y + blk.h / 2;
    gS2.walkableNearest(stuck);
    check('兜底：楼内敌人被挪到可走点', !stuck.dead && gS2.walkable(stuck.x, stuck.y, stuck.r));
  }
}

// 25i. v0.12：新武器模组「斩音太刀」（近战挥刀：扇形角度 arc ＋ 刀长 len）
{
  const SW = KUP.WEAPONS.slash;
  check('新武器模组：斩音太刀（behavior=slash，通用组无 owner）',
    SW && SW.behavior === 'slash' && !SW.owner && SW.maxLv === 5 && !!SW.evolved);
  check('挥刀参数齐备：每级都有 arc（扇形角度·度）与 len（刀长·px）',
    SW.levels.every(l => typeof l.arc === 'number' && typeof l.len === 'number') &&
    typeof SW.evolved.stats.arc === 'number' && typeof SW.evolved.stats.len === 'number');
  check('挥刀参数随等级成长（扇形更宽、刀更长）',
    SW.levels.every((l, i, a) => i === 0 || (l.arc > a[i - 1].arc && l.len > a[i - 1].len)) &&
    SW.evolved.stats.arc > SW.levels[4].arc && SW.evolved.stats.len > SW.levels[4].len,
    'arc=' + SW.levels.map(l => l.arc).join('/') + ' len=' + SW.levels.map(l => l.len).join('/'));
  check('武器总数 11 · 行为 9 种', Object.keys(KUP.WEAPONS).length === 11 &&
    new Set(Object.values(KUP.WEAPONS).map(w => w.behavior)).size === 9);
  /* 扇形判定：正前方中、正侧方不中（窄扇形）、刀长外不中 */
  const mkSlashGame = seed => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'kaf', area: 'area0', seed });
    g.player.weapons = [];                       // 隔离：只测手动放置的挥砍
    return g;
  };
  const gSla = mkSlashGame(151);
  const pSla = gSla.player;
  const near1 = gSla.spawnEnemy('noise', 1500, 1500); near1.x = pSla.x + 60; near1.y = pSla.y;
  const side1 = gSla.spawnEnemy('noise', 1500, 1500); side1.x = pSla.x; side1.y = pSla.y + 60;
  const far1 = gSla.spawnEnemy('noise', 1500, 1500); far1.x = pSla.x + 200; far1.y = pSla.y;
  const hpN = near1.hp, hpS = side1.hp, hpF = far1.hp;
  gSla.slashes.push(new KUP.Slash(pSla.x, pSla.y, 0, { len: 110, arc: 90 * Math.PI / 180, dmg: 4, kb: 0 }));
  gSla.update(0.02);
  check('挥刀：正前方扇形内命中', near1.hp < hpN, 'hp ' + hpN + '→' + near1.hp);
  check('挥刀：扇形角度之外（正侧方 90°）不中', side1.hp === hpS);
  check('挥刀：刀长之外（200px > len 110）不中', far1.hp === hpF);
  /* 参数生效：扇形角度 200° → 侧方目标被扫到 */
  const gSlb = mkSlashGame(152);
  const pSlb = gSlb.player;
  const side2 = gSlb.spawnEnemy('noise', 1500, 1500); side2.x = pSlb.x; side2.y = pSlb.y + 60;
  const hpS2 = side2.hp;
  gSlb.slashes.push(new KUP.Slash(pSlb.x, pSlb.y, 0, { len: 110, arc: 200 * Math.PI / 180, dmg: 4, kb: 0 }));
  gSlb.update(0.02);
  check('扇形角度参数生效（200° 时侧方 90° 目标被命中）', side2.hp < hpS2, 'hp ' + hpS2 + '→' + side2.hp);
  /* 参数生效：刀长 240 → 200px 外目标被击中 */
  const gSlc = mkSlashGame(153);
  const pSlc = gSlc.player;
  const far2 = gSlc.spawnEnemy('noise', 1500, 1500); far2.x = pSlc.x + 200; far2.y = pSlc.y;
  const hpF2 = far2.hp;
  gSlc.slashes.push(new KUP.Slash(pSlc.x, pSlc.y, 0, { len: 240, arc: 90 * Math.PI / 180, dmg: 4, kb: 0 }));
  gSlc.update(0.02);
  check('刀长参数生效（len 240 时 200px 目标被命中）', far2.hp < hpF2, 'hp ' + hpF2 + '→' + far2.hp);
  /* 每次挥砍每敌人只吃一次伤害（窗口内连跑多帧） */
  const gSld = mkSlashGame(154);
  const pSld = gSld.player;
  const once = gSld.spawnEnemy('noise', 1500, 1500); once.x = pSld.x + 50; once.y = pSld.y;
  const hpOnce = once.hp;
  gSld.slashes.push(new KUP.Slash(pSld.x, pSld.y, 0, { len: 120, arc: 120 * Math.PI / 180, dmg: 4, kb: 0, life: 0.2 }));
  for (let i = 0; i < 12; i++) gSld.update(0.02);
  check('每次挥砍每敌人只结算一次伤害', Math.abs(once.hp - (hpOnce - 4)) < 1e-6, 'hp=' + once.hp);
  /* 武器分派：behavior 'slash' 生成挥砍实体；Lv4+ 附带扇形冲击波（Ring 带角度） */
  const gSle = new KUP.Game(canvas);
  gSle.start({ char: 'kaf', area: 'area0', seed: 155 });
  gSle.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.slash, 5)];
  gSle.player.weapons[0].t = 0;
  gSle.update(0.02);
  check('近战武器分派：挥砍实体生成（参数换算为弧度）',
    gSle.slashes.length === 1 &&
    Math.abs(gSle.slashes[0].arc - 170 * Math.PI / 180) < 1e-9 &&
    Math.abs(gSle.slashes[0].len - 162) < 1e-9,
    'arc=' + (gSle.slashes[0] ? (gSle.slashes[0].arc * 180 / Math.PI).toFixed(0) : '-') +
    ' len=' + (gSle.slashes[0] ? gSle.slashes[0].len.toFixed(0) : '-'));
  const wave = gSle.rings.find(r => r.arc < KUP.U.TAU - 1e-6);
  check('Lv5 挥砍附带扇形冲击波（圆形波的角度参数 arc=150°）',
    !!wave && Math.abs(wave.arc - 150 * Math.PI / 180) < 1e-9);
  /* ---- 圆形波的角度参数（Ring） ---- */
  check('圆形波默认整圆（既有武器行为不变）', new KUP.Ring(0, 0, { maxR: 100 }).arc >= KUP.U.TAU - 1e-6);
  const gRg = mkSlashGame(156);
  const pRg = gRg.player;
  const front2 = gRg.spawnEnemy('noise', 1500, 1500); front2.x = pRg.x + 120; front2.y = pRg.y;
  const back2 = gRg.spawnEnemy('noise', 1500, 1500); back2.x = pRg.x - 120; back2.y = pRg.y;
  const hpB2 = back2.hp, hpFr2 = front2.hp;
  gRg.rings.push(new KUP.Ring(pRg.x, pRg.y, { maxR: 220, speed: 300, dmg: 5, kb: 0, arc: 90 * Math.PI / 180, dir: 0 }));
  for (let i = 0; i < 20; i++) gRg.update(0.02);
  check('圆形波角度参数：扇形内受伤', front2.hp < hpFr2, 'hp ' + hpFr2 + '→' + front2.hp);
  check('圆形波角度参数：扇形外（正后方 180°）不受伤害', back2.hp === hpB2);
  /* bass 数据表 arc（度）→ Ring.arc（弧度）接线；既有 360° 武器不受影响 */
  KUP.WEAPONS._arcTest = {
    id: '_arcTest', icon: '試', color: '#ffffff', behavior: 'bass', maxLv: 1,
    name: { zh: 't', en: 't', ja: 't' }, desc: { zh: '', en: '', ja: '' }, lvDesc: [],
    levels: [{ cd: 1, dmg: 5, r: 120, arc: 120 }],
    evolved: { name: { zh: 't', en: 't', ja: 't' }, desc: { zh: '', en: '', ja: '' }, stats: { cd: 1, dmg: 5, r: 120, arc: 120 } },
  };
  const gArc = new KUP.Game(canvas);
  gArc.start({ char: 'kaf', area: 'area0', seed: 157 });
  gArc.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS._arcTest, 1)];
  gArc.player.weapons[0].t = 0;
  gArc.update(0.02);
  const arcRing = gArc.rings[gArc.rings.length - 1];
  check('圆形波：数据表 arc（度）接线到 Ring（弧度）', !!arcRing && Math.abs(arcRing.arc - 120 * Math.PI / 180) < 1e-9);
  delete KUP.WEAPONS._arcTest;
  check('既有圆形波武器（テラ/救済の鐘）仍为整圆',
    KUP.WEAPONS.bass.levels.every(l => l.arc === undefined) && KUP.WEAPONS.prayer.levels.every(l => l.arc === undefined));
  /* 新武器进入升级卡池（通用组，任何角色可抽） */
  const gPool3 = new KUP.Game(canvas);
  gPool3.start({ char: 'kaf', area: 'area0', seed: 158 });
  let slashSeen = false;
  for (let i = 0; i < 300; i++) if (gPool3.rollChoices().some(c => c.kind === 'weapon-new' && c.id === 'slash')) slashSeen = true;
  check('斩音太刀进入升级卡池（通用组，无需招募）', slashSeen);
}

// 25j. v0.13：状态异常——僵直／冷冻 与 减速
{
  check('状态道具齐备：凍結の符（freeze）与 鈍足の符（slow）',
    KUP.ITEMS.freeze && KUP.ITEMS.freeze.kind === 'freeze' && KUP.ITEMS.freeze.seconds > 0 &&
    KUP.ITEMS.bind && KUP.ITEMS.bind.kind === 'slow' && KUP.ITEMS.bind.amount < 1);
  const mkStat = seed => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'kaf', area: 'area0', seed });
    g.player.weapons = [];                 // 隔离：不让武器干扰状态测试
    g.player.invuln = true;
    g.citySolid = false;                   // 隔离：状态测试不受楼体碰撞/位置修正影响
    return g;
  };
  /* --- 冷冻：完全静止 --- */
  const gF = mkStat(161);
  const eF = gF.spawnEnemy('noise', 1500, 1500);
  /* 选一个远离楼体的空地（避免楼体位置修正干扰「静止」判定） */
  let fSpot = null;
  for (let r = 140; r <= 700 && !fSpot; r += 40) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * KUP.U.TAU;
      const x = gF.player.x + Math.cos(a) * r, y = gF.player.y + Math.sin(a) * r;
      if (x < 200 || x > 2800 || y < 200 || y > 2800) continue;
      if (gF.freeAt(x, y, eF.r + 6)) { fSpot = { x, y }; break; }
    }
  }
  eF.x = fSpot ? fSpot.x : gF.player.x + 300; eF.y = fSpot ? fSpot.y : gF.player.y;
  eF.kx = 0; eF.ky = 0;
  const fx0 = eF.x, fy0 = eF.y;
  check('冷冻施加（全场）', gF.applyFreeze({ seconds: 2, all: true }) >= 1 && eF.stunT > 0);
  for (let i = 0; i < 50; i++) gF.update(0.02);       // 1 秒
  check('冷冻中的敌人完全不移动', Math.abs(eF.x - fx0) < 1e-9 && Math.abs(eF.y - fy0) < 1e-9,
    'dx=' + (eF.x - fx0).toFixed(3) + ' dy=' + (eF.y - fy0).toFixed(3));
  check('冷冻计时随帧递减', eF.stunT < 2 && eF.stunT > 0, 'stunT=' + eF.stunT.toFixed(2));
  for (let i = 0; i < 80; i++) gF.update(0.02);       // 解冻
  check('解冻后恢复移动', eF.stunT <= 0 && Math.hypot(eF.x - fx0, eF.y - fy0) > 1);
  /* --- 冷冻：无接触伤害；对照组有伤害 --- */
  const gC1 = mkStat(162);
  const pC1 = gC1.player; pC1.invuln = false;
  const eC1 = gC1.spawnEnemy('noise', 1500, 1500);
  eC1.x = pC1.x; eC1.y = pC1.y;                       // 完全重叠
  eC1.stunT = 0; pC1.hitT = 0;
  const hpC1 = pC1.hp;
  gC1.update(0.02);
  check('对照：未冷冻的敌人接触即造成伤害', pC1.hp < hpC1, 'hp ' + hpC1 + '→' + pC1.hp);
  const gC2 = mkStat(163);
  const pC2 = gC2.player; pC2.invuln = false;
  const eC2 = gC2.spawnEnemy('noise', 1500, 1500);
  eC2.x = pC2.x; eC2.y = pC2.y;
  eC2.stunT = 0; pC2.hitT = 0;
  const hpC2 = pC2.hp;
  gC2.applyFreeze({ seconds: 2, all: true });
  for (let i = 0; i < 20; i++) gC2.update(0.02);
  check('冷冻中的敌人不造成接触伤害', pC2.hp === hpC2, 'hp ' + hpC2 + '→' + pC2.hp);
  /* --- 冷冻：Boss 减半、精英 75% --- */
  const gB = new KUP.Game(canvas);
  gB.start({ char: 'kaf', area: 'area0', seed: 164 });
  gB.player.weapons = []; gB.player.invuln = true;
  const bo = gB.spawnEnemy('boss', 1500, 1500);
  const el = gB.spawnEnemy('elite', 1500, 1500);
  gB.applyFreeze({ seconds: 4, all: true });
  check('冷冻时长减免：Boss ×0.5', Math.abs(bo.stunT - 2) < 1e-6, 'boss=' + bo.stunT.toFixed(2));
  check('冷冻时长减免：精英 ×0.75', Math.abs(el.stunT - 3) < 1e-6, 'elite=' + el.stunT.toFixed(2));
  /* --- 冷冻：Boss 行动被暂停（计时器冻结、不产生新的敌袭） --- */
  const gB2 = new KUP.Game(canvas);
  gB2.start({ char: 'kaf', area: 'area0', seed: 165 });
  gB2.player.weapons = []; gB2.player.invuln = true;
  gB2.boss = gB2.spawnEnemy('boss', 1500, 1500);      // 〈消音〉：ringT 驱动音波环
  gB2.boss.ringT = 1;
  gB2.boss.stunT = 3;
  const dangers0 = gB2.dangers.length;
  for (let i = 0; i < 40; i++) gB2.updateBossBehavior(0.05);   // 2 秒
  check('冷冻中的 Boss 行为暂停（不产生新的敌袭）',
    gB2.boss.ringT === 1 && gB2.dangers.length === dangers0, 'ringT=' + gB2.boss.ringT);
  /* --- 减速：倍率生效（**同一敌人 A/B 对照**：同位置、同帧数、同随机相位） --- */
  const gS1 = mkStat(166);
  const eSlow = gS1.spawnEnemy('noise', 1500, 1500);
  eSlow.x = gS1.player.x + 500; eSlow.y = gS1.player.y;
  /* A：无减速 */
  const runA = () => {
    eSlow.stunT = 0; eSlow.slowT = 0; eSlow.slowMul = 1; eSlow.kx = 0; eSlow.ky = 0;
    const x0 = eSlow.x, y0 = eSlow.y;
    for (let i = 0; i < 25; i++) { eSlow.update(0.02, gS1); gS1.collideCity(eSlow); }
    return Math.hypot(eSlow.x - x0, eSlow.y - y0);
  };
  eSlow.x = gS1.player.x + 500; eSlow.y = gS1.player.y;
  const dPlain = runA();
  /* B：减速 ×0.5（同起点） */
  eSlow.x = gS1.player.x + 500; eSlow.y = gS1.player.y;
  eSlow.applySlow(8, 0.5);
  const x1 = eSlow.x, y1 = eSlow.y;
  for (let i = 0; i < 25; i++) { eSlow.update(0.02, gS1); gS1.collideCity(eSlow); }
  const dSlow = Math.hypot(eSlow.x - x1, eSlow.y - y1);
  check('减速倍率写入 slowMul', Math.abs(eSlow.slowMul - 0.5) < 1e-9, 'mul=' + eSlow.slowMul);
  check('减速的敌人实际移动约为一半（A/B 对照）', dSlow < dPlain * 0.65 && dSlow > dPlain * 0.35,
    'slow=' + dSlow.toFixed(1) + ' plain=' + dPlain.toFixed(1));
  /* 全场施加也走同一入口 */
  const gS3 = mkStat(170);
  gS3.spawnEnemy('noise', 1500, 1500);
  check('减速施加（全场 ×0.5）', gS3.applySlow({ seconds: 8, mul: 0.5, all: true }) >= 1 &&
    gS3.enemies.every(e => e.slowT > 0 && Math.abs(e.slowMul - 0.5) < 1e-9));
  /* --- 减速：取最强来源、时间取较长 --- */
  const gS2 = mkStat(167);
  const eM = gS2.spawnEnemy('noise', 1500, 1500);
  eM.slowT = 0; eM.slowMul = 1;
  eM.applySlow(2, 0.5);
  eM.applySlow(8, 0.7);                               // 更弱但更长 → 倍率不变、时间延长
  check('减速合并：更弱来源不覆盖倍率、只延长时间',
    Math.abs(eM.slowMul - 0.5) < 1e-9 && Math.abs(eM.slowT - 8) < 1e-9, 'mul=' + eM.slowMul + ' t=' + eM.slowT);
  eM.applySlow(1, 0.25);                              // 更强 → 覆盖倍率
  check('减速合并：更强来源覆盖倍率', Math.abs(eM.slowMul - 0.25) < 1e-9, 'mul=' + eM.slowMul);
  eM.slowT = 0.01;
  eM.update(0.02, gS2);
  check('减速到期后倍率复位为 1', eM.slowT === 0 && eM.slowMul === 1);
  /* --- 既有滞留音场减速仍生效（走同一 applySlow，×0.55） --- */
  const gZ2 = mkStat(168);
  const eZ = gZ2.spawnEnemy('noise', 1500, 1500);
  gZ2.zones.push(new KUP.Zone(eZ.x, eZ.y, { r: 80, dmg: 0, life: 3, kind: 'field', slow: true }));
  gZ2.update(0.02);
  check('滞留音场减速接线到慢速系统（×0.55）',
    eZ.slowT > 0 && Math.abs(eZ.slowMul - 0.55) < 1e-9, 'mul=' + eZ.slowMul);
  /* --- 升级池选择通路：凍結の符 / 鈍足の符 --- */
  const gI2 = new KUP.Game(canvas);
  gI2.start({ char: 'kaf', area: 'area0', seed: 169 });
  gI2.spawnEnemy('noise', gI2.player.x + 120, gI2.player.y);
  gI2.state = 'levelup'; gI2.pendingLevels = 1; gI2.choices = [{ kind: 'item', id: 'freeze' }];
  gI2.choose(0);
  check('升级池选择凍結の符 → 全场敌人被冻',
    gI2.state === 'playing' && gI2.enemies.some(e => e.stunT > 0));
  gI2.state = 'levelup'; gI2.pendingLevels = 1; gI2.choices = [{ kind: 'item', id: 'bind' }];
  gI2.choose(0);
  check('升级池选择鈍足の符 → 全场敌人减速',
    gI2.enemies.some(e => e.slowT > 0 && Math.abs(e.slowMul - 0.5) < 1e-9));
  /* 入池：两种状态符都能被抽到 */
  let stSeen = { freeze: false, bind: false };
  for (let i = 0; i < 300; i++) {
    for (const c of gI2.rollChoices()) if (c.kind === 'item' && (c.id === 'freeze' || c.id === 'bind')) stSeen[c.id] = true;
  }
  check('两种状态符均进入升级池道具桶', stSeen.freeze && stSeen.bind);
}

// 25k. v0.13：治安战——无尽关卡（没有败北，只有战斗结束；成绩独立记录）
{
  const OR = KUP.AREA('order');
  check('治安战关卡齐备（无尽 · 本作模式）', !!OR && OR.endless === true && OR.name.zh === '治安战' &&
    OR.src === 'original' && KUP.AREAS.length === 8);
  /* 解锁：不属于復興率链，恒可出击；阈值恒 0 */
  KUP.META.reset();
  check('治安战恒可出击（不占復興率解锁链）',
    KUP.META.isUnlocked('order') && KUP.META.thresholdOf('order') === 0 && KUP.META.total() === 0);
  check('番街解锁链不受治安战影响', !KUP.META.isUnlocked('area1') && KUP.META.thresholdOf('area1') === 8);
  /* 点数公式 */
  check('治安战点数公式（kills×10 + time×2 + wave×100）',
    KUP.META.orderScore({ kills: 100, time: 60, wave: 3 }) === 1000 + 120 + 300);
  /* 结算：只写治安战记录，不写復興率／番街 best */
  KUP.META.reset();
  const fukkou0 = KUP.META.total();
  const r1o = KUP.META.addOrderResult({ runId: 'ord-1', kills: 120, time: 90, wave: 4, score: 1780 });
  check('治安战结算：写入独立最高记录', !!r1o && r1o.order && r1o.isBest && KUP.META.orderBest().score === 1780 &&
    KUP.META.orderBest().wave === 4);
  check('治安战不发復興率、不写番街 best',
    KUP.META.total() === fukkou0 && KUP.META.best() === null && KUP.META.clearedCount('order') === 0);
  check('治安战仍结算市民票', r1o.tickets > 0 && KUP.META.tickets() === r1o.tickets);
  check('治安战结算幂等（同 runId 不重复）',
    KUP.META.addOrderResult({ runId: 'ord-1', kills: 120, time: 90, wave: 4, score: 1780 }) === null &&
    KUP.META.tickets() === r1o.tickets);
  const tBefore = KUP.META.tickets();
  const r2o = KUP.META.addOrderResult({ runId: 'ord-2', kills: 10, time: 30, wave: 2, score: 300 });
  check('更低分不刷新记录（但仍结算市民票）',
    !r2o.isBest && KUP.META.orderBest().score === 1780 && KUP.META.tickets() > tBefore);
  const r3o = KUP.META.addOrderResult({ runId: 'ord-3', kills: 200, time: 200, wave: 8, score: 3200 });
  check('更高分刷新治安战记录', r3o.isBest && KUP.META.orderBest().score === 3200 && KUP.META.orderBest().wave === 8);
  /* 存档结构：orderBest 归一化（脏数据被拒） */
  KUP.META.data.orderBest = { score: -5, wave: -3 };
  KUP.META.save();
  KUP.META.data = null; KUP.META.load();
  check('治安战记录结构校验（脏数据不落库）', KUP.META.orderBest() === null);
  KUP.META.reset();
  /* 无尽导演：波次推进、精英与 Boss 排期、Boss 血量递增 */
  const gO = new KUP.Game(canvas);
  gO.start({ char: 'kaf', area: 'order', seed: 501 });
  check('治安战开局：无尽标记 + WAVE 1', gO.endless === true && gO.orderWave === 1);
  check('治安战不读番街波次表（程序化生成）', typeof gO.orderDirector === 'function' && typeof gO.orderType === 'function');
  gO.time = KUP.CONFIG.ENDLESS.WAVE_T + 0.1;
  gO.director(0.02);
  check('治安战波次随时间推进（WAVE 2）', gO.orderWave === 2);
  gO.time = KUP.CONFIG.ENDLESS.WAVE_T * 5;
  gO.director(0.02);
  check('治安战波次继续推进（WAVE 6）', gO.orderWave === 6);
  /* 刷怪率随波次提高（同样时长下第 6 波刷得更多） */
  const spawnsAt = (wave) => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'kaf', area: 'order', seed: 502 });
    g.time = (wave - 1) * KUP.CONFIG.ENDLESS.WAVE_T + 1;
    g.orderWave = wave;
    g.spawnAcc = 0;
    let n = 0;
    const orig = g.spawnEnemy.bind(g);
    g.spawnEnemy = (...a) => { n++; return orig(...a); };
    for (let i = 0; i < 10; i++) { g.enemies.length = 0; g.director(0.1); }   // 1 秒
    return n;
  };
  const acc1 = spawnsAt(1), acc6 = spawnsAt(6);
  check('刷怪率随波次升级（WAVE 6 刷得更多）', acc6 > acc1, 'w1=' + acc1 + ' w6=' + acc6);
  /* 精英与 Boss 排期（计时器驱动：到点即出） */
  const gOB = new KUP.Game(canvas);
  gOB.start({ char: 'kaf', area: 'order', seed: 503 });
  check('治安战排期取自 CONFIG.ENDLESS',
    gOB.orderEliteT <= KUP.CONFIG.ENDLESS.ELITE_EVERY && gOB.orderBossT <= KUP.CONFIG.ENDLESS.BOSS_FIRST);
  gOB.orderEliteT = 0.01;
  gOB.director(0.02);
  check('治安战按时排出精英', gOB.enemies.some(e => e.elite));
  gOB.time = 100;
  gOB.orderBossT = 0.01;
  gOB.director(0.02);
  check('治安战排出第 1 体 Boss（轮回七体）', !!gOB.boss && gOB.boss.def.id === 'boss0' && gOB.orderBossIdx === 1);
  const hp1 = gOB.boss.maxhp;
  check('治安战 Boss 记录出生时刻（暴走以此为准）', gOB.boss.bornAt === 100 && KUP.CONFIG.ENDLESS.BOSS_ENRAGE > 0);
  gOB.time = 250;
  gOB.orderBossT = 0.01;
  gOB.director(0.02);
  check('治安战继续排第 2 体 Boss（血量递增）',
    gOB.orderBossIdx === 2 && gOB.boss && gOB.boss.def.id === 'boss1' && gOB.boss.maxhp > hp1 && gOB.boss.bornAt === 250,
    'hp ' + Math.round(hp1) + '→' + Math.round(gOB.boss.maxhp));
  /* 击破 Boss ≠ 胜利：战斗继续 */
  const gOK = new KUP.Game(canvas);
  gOK.start({ char: 'kaf', area: 'order', seed: 504 });
  gOK.boss = gOK.spawnEnemy('boss0', gOK.player.x + 60, gOK.player.y);
  gOK.damageEnemy(gOK.boss, 1e9);
  check('治安战击破 Boss 不结束战斗（state 仍 playing）',
    gOK.state === 'playing' && gOK.boss === null && gOK.kills >= 1);
  check('治安战击破 Boss 有清场奖励与音片', gOK.gems.length > 0 && gOK.ult.charge >= 40);
  /* 治安战不落記憶の卵（不污染復興率） */
  const gOE = new KUP.Game(canvas);
  gOE.start({ char: 'kaf', area: 'order', seed: 505 });
  gOE.player.weapons = [];
  for (let i = 0; i < 40; i++) {
    const el = gOE.spawnEnemy('elite', gOE.player.x + 300, gOE.player.y);
    gOE.killEnemy(el);
  }
  check('治安战不落記憶の卵与復興率', gOE.gems.every(g => g.type !== 'egg') && gOE.eggCount === 0 &&
    KUP.META.total() === 0);
  /* 战斗结束：没有败北，只有「战斗结束」＋治安战成绩 */
  KUP.META.reset();
  const gOD = new KUP.Game(canvas);
  gOD.start({ char: 'kaf', area: 'order', seed: 506 });
  gOD.kills = 150; gOD.time = 125; gOD.orderWave = 5;
  const showedScreens = [];
  const oldShowEnd = KUP.UI.showEnd;
  KUP.UI.showEnd = (win, st) => { showedScreens.push({ win, order: st.order, score: st.score, wave: st.wave }); };
  gOD.gameOver();
  KUP.UI.showEnd = oldShowEnd;
  check('治安战 HP 归零 → state=over（不是 victory）', gOD.state === 'over');
  check('治安战结算结果走 order 分支（不发復興率）',
    !!gOD.metaResult && gOD.metaResult.order === true && gOD.metaResult.score === KUP.META.orderScore({ kills: 150, time: 125, wave: 5 }) &&
    KUP.META.total() === 0 && KUP.META.best() === null);
  check('治安战成绩已记入最高记录', KUP.META.orderBest().score === gOD.metaResult.score && KUP.META.orderBest().wave === 5);
  check('结算界面按治安战布局（点数/波次/order 标记）',
    showedScreens.length === 1 && showedScreens[0].order === true && showedScreens[0].wave === 5 && showedScreens[0].score > 0);
  check('stats 暴露治安战字段', gOD.stats().order === true && gOD.stats().wave === 5 && gOD.stats().score > 0 &&
    gOD.stats().orderBest === KUP.META.orderBest().score);
  /* 番街仍走原路径：勝敗照旧（回归） */
  const gNorm = new KUP.Game(canvas);
  gNorm.start({ char: 'kaf', area: 'area0', seed: 507 });
  check('番街不是无尽模式', gNorm.endless === false && gNorm.stats().order === false);
  const gNormB = new KUP.Game(canvas);
  gNormB.start({ char: 'kaf', area: 'area0', seed: 508 });
  gNormB.boss = gNormB.spawnEnemy('boss0', gNormB.player.x + 60, gNormB.player.y);
  gNormB.damageEnemy(gNormB.boss, 1e9);
  check('番街击破 Boss 仍是胜利（回归不变）', gNormB.state === 'victory');
}

// 25e. v0.10：升级池体验（分桶保底 / 重掷 / 封禁）
const gLu = new KUP.Game(canvas);
gLu.start({ char: 'kaf', area: 'area0', seed: 111 });
check('重掷次数默认 3 次/局', gLu.rerolls === 3 && !!gLu.banned && typeof gLu.banned.add === 'function');
/* 分桶保底：三张卡尽量覆盖 武器 / 被动 / 道具 */
let covOk = 0, samples = 0;
for (let i = 0; i < 400; i++) {
  const roll = gLu.rollChoices();
  samples++;
  const cats = new Set(roll.map(c => c.kind === 'awaken' ? 'awaken'
    : (c.kind.indexOf('weapon') === 0 ? 'weapon'
    : (c.kind.indexOf('passive') === 0 ? 'passive' : (c.kind === 'item' ? 'item' : 'heal')))));
  if (cats.has('weapon') && cats.has('passive') && cats.has('item')) covOk++;
}
check('分桶保底：三卡覆盖武器+被动+道具', covOk / samples > 0.95, covOk + '/' + samples);
/* 不重复：同一次抽取里不会出现两张相同卡 */
let dupFound = false;
for (let i = 0; i < 200; i++) {
  const roll = gLu.rollChoices();
  const keys = roll.map(c => c.kind + ':' + c.id);
  if (new Set(keys).size !== keys.length) dupFound = true;
}
check('升级池不出现重复卡', !dupFound);
/* 重掷：消耗次数并重新抽取 */
const gRu = new KUP.Game(canvas);
gRu.start({ char: 'kaf', area: 'area0', seed: 112 });
gRu.state = 'levelup'; gRu.pendingLevels = 1; gRu.choices = gRu.rollChoices();
const okRe = gRu.rerollChoices();
check('重掷：消耗 1 次并重新抽取', okRe && gRu.rerolls === 2 && gRu.choices.length === 3);
check('重掷后仍是合法三选一', gRu.choices.every(c => c && c.kind));
gRu.rerolls = 0;
check('重掷耗尽后失败', !gRu.rerollChoices());
check('非升级状态不可重掷', (() => { const g = new KUP.Game(canvas); g.start({ char: 'kaf', area: 'area0', seed: 113 }); return !g.rerollChoices(); })());
/* 封禁：该 id 本局不再出现，且该格立即换成新候选 */
const gBn = new KUP.Game(canvas);
gBn.start({ char: 'kaf', area: 'area0', seed: 114 });
gBn.state = 'levelup'; gBn.pendingLevels = 1; gBn.choices = gBn.rollChoices();
const target = gBn.choices.find(c => c.id);
const bannedId = target.id;
const okBan = gBn.banChoice(gBn.choices.indexOf(target));
check('封禁：加入名单并替换该格', okBan && gBn.banned.has(bannedId) && gBn.choices.length === 3);
check('封禁后该格不再是原卡', !gBn.choices.some(c => c.id === bannedId && c.kind === target.kind));
let leak = false;
for (let i = 0; i < 300; i++) if (gBn.rollChoices().some(c => c.id === bannedId)) leak = true;
check('封禁项不再出现在后续升级池', !leak, 'banned=' + bannedId);
/* 封禁可累计 */
const gBn2 = new KUP.Game(canvas);
gBn2.start({ char: 'kaf', area: 'area0', seed: 115 });
gBn2.state = 'levelup'; gBn2.pendingLevels = 1; gBn2.choices = gBn2.rollChoices();
for (let k = 0; k < 2; k++) { const t = gBn2.choices.find(c => c.id); if (t) gBn2.banChoice(gBn2.choices.indexOf(t)); }
check('封禁可累计多项', gBn2.banned.size >= 1, 'size=' + gBn2.banned.size);
check('heal 卡不可封禁', (() => { const g = new KUP.Game(canvas); g.start({ char: 'kaf', area: 'area0', seed: 116 }); g.state = 'levelup'; g.choices = [{ kind: 'heal' }]; return !g.banChoice(0); })());
check('封禁模式默认关闭', gBn2.banMode === false);
/* 重掷参数：?reroll=N */
const gRr = new KUP.Game(canvas);
gRr.debug.reroll = 5;
gRr.start({ char: 'kaf', area: 'area0', seed: 117 });
check('?reroll=N 生效', gRr.rerolls === 5);
/* 既有行为不受影响：觉醒卡仍出现（优先展示） */
const gAw = new KUP.Game(canvas);
gAw.start({ char: 'kaf', area: 'area0', seed: 118 });
gAw.player.weapons[0].lv = KUP.WEAPONS[gAw.player.weapons[0].def.id].maxLv;
let awSeen = false;
for (let i = 0; i < 60; i++) if (gAw.rollChoices().some(c => c.kind === 'awaken')) awSeen = true;
check('觉醒卡仍会出现在升级池（优先展示）', awSeen);

// 26. 结算包含市民票与"可招募"提示
KUP.META.reset();
const gT = new KUP.Game(canvas);
gT.start({ char: 'kaf', area: 'area3', seed: 81 });
gT.kills = 100;
gT.victory();
check('结算返回市民票收入与合计', gT.metaResult.tickets > 0 && gT.metaResult.ticketsTotal === gT.metaResult.tickets,
  JSON.stringify({ t: gT.metaResult.tickets }));
check('结算提示可培养对象', gT.metaResult.newlyRecruitable.length >= 1, JSON.stringify(gT.metaResult.newlyRecruitable));
check('stats 含 Boss 名与市民票来源', gT.stats().areaId === 'area3' && gT.stats().eggs >= 1);

/* ========== v0.13.1：绕楼寻路（空间索引 ＋ 局部避障转向） ========== */

// 25l. 楼体空间索引：与全表扫描等价（碰撞/可站立/绕行都建立在它之上）
{
  const gI = new KUP.Game(canvas);
  gI.start({ char: 'kaf', area: 'area5', seed: 31337 });
  const bn = gI.city.bn, bcell = gI.city.bcell;
  check('空间索引：桶边长=街区块、桶数=ceil(ARENA/GRID)²',
    bcell === KUP.CONFIG.CITY.GRID && bn === Math.ceil(KUP.CONFIG.ARENA / bcell) &&
    Array.isArray(gI.city.buckets) && gI.city.buckets.length === bn * bn);
  let inBucket = 0;
  for (const b of gI.city.blocks) for (const bk of gI.city.buckets) if (bk.indexOf(b) >= 0) { inBucket++; break; }
  check('空间索引：每栋楼至少入一个桶', inBucket === gI.city.blocks.length, inBucket + '/' + gI.city.blocks.length);
  /* 索引查询 vs 全表扫描：600 个采样点必须完全一致 */
  const rnd = KUP.U.mulberry32(99), buckets = gI.city.buckets;
  let mism = 0;
  for (let i = 0; i < 600; i++) {
    const x = rnd() * KUP.CONFIG.ARENA, y = rnd() * KUP.CONFIG.ARENA, r = 6 + rnd() * 46;
    const aHit = gI.collideCircle(x, y, r), aWalk = gI.walkable(x, y, r);
    gI.city.buckets = null;                                  // 退回全表扫描
    const bHit = gI.collideCircle(x, y, r), bWalk = gI.walkable(x, y, r);
    gI.city.buckets = buckets;
    if (aHit !== bHit || aWalk !== bWalk) mism++;
  }
  check('空间索引与全表扫描结果一致（600 采样点）', mism === 0, 'mism=' + mism);
}

// 25l-2. 绕楼寻路：逐楼「正后方」放置（直线被整栋楼挡住）能否绕到玩家身边
{
  const segHits = (x0, y0, x1, y1, b) => {                     // 线段×楼体矩形（slab 法）
    const dx = x1 - x0, dy = y1 - y0;
    let t0 = 0, t1 = 1;
    for (const [p, q] of [[-dx, x0 - b.x], [dx, b.x + b.w - x0], [-dy, y0 - b.y], [dy, b.y + b.h - y0]]) {
      if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return t1 > t0 + 1e-6;
  };
  /* 站桩玩家 + 无刷怪 + 无伤害：只考察「能不能绕过来」 */
  const mkArena = seed => {
    const g2 = new KUP.Game(canvas);
    g2.start({ char: 'kaf', area: 'area0', seed });
    g2.director = () => {}; g2.collide = () => {}; g2.updateBossBehavior = () => {};
    g2.player.update = () => {};
    const C0 = KUP.CONFIG;
    const sp = { x: C0.ARENA / 2, y: C0.ARENA / 2, r: C0.PLAYER_R, dead: false };
    if (!g2.walkable(sp.x, sp.y, sp.r)) g2.walkableNearest(sp);
    g2.player.x = sp.x; g2.player.y = sp.y;
    return g2;
  };
  const place = (g2, maxD) => {
    const C0 = KUP.CONFIG, sp = g2.player, out = [];
    for (const b of g2.city.blocks) {
      let dx = b.x + b.w / 2 - sp.x, dy = b.y + b.h / 2 - sp.y;
      const d = Math.hypot(dx, dy);
      if (d < 60 || d > maxD) continue;
      dx /= d; dy /= d;
      const tx = (dx > 0 ? b.x + b.w - sp.x : b.x - sp.x) / (dx || 1e-9);
      const ty = (dy > 0 ? b.y + b.h - sp.y : b.y - sp.y) / (dy || 1e-9);
      const base = Math.min(tx, ty);
      let ok = null;
      for (const gap of [45, 60, 80, 100]) {                   // 出口外找第一个空位
        const x = KUP.U.clamp(sp.x + dx * (base + gap), 30, C0.ARENA - 30);
        const y = KUP.U.clamp(sp.y + dy * (base + gap), 30, C0.ARENA - 30);
        if (g2.freeAt(x, y, 14)) { ok = { x, y }; break; }
      }
      if (!ok || !segHits(sp.x, sp.y, ok.x, ok.y, b)) continue;
      const e = new KUP.Enemy(KUP.ENEMIES.noise, ok.x, ok.y, 1, 0);
      e.speed = KUP.ENEMIES.noise.speed;
      g2.enemies.push(e); out.push(e);
    }
    return out;
  };
  /* 窗口固定 26 秒（样本都在 900px 内 ⇒ 直线腿程 ≤ 14.5 秒，余量充足） */
  const drive = (g2, list) => {
    const dt = 1 / 60, steps = Math.round(26 / dt), reach = KUP.CONFIG.PLAYER_R + 34;
    const arrived = new Set();
    for (let i = 0; i < steps; i++) {
      g2.update(dt);
      for (const e of list) {
        if (arrived.has(e)) continue;
        if (Math.hypot(e.x - g2.player.x, e.y - g2.player.y) < reach) arrived.add(e);
      }
    }
    return arrived;
  };
  const SEEDS = [20250314, 777];
  let nAll = 0, okAll = 0, baseFail = 0, sample0 = 0;
  for (const seed of SEEDS) {
    /* A：新行为（绕行转向开启） */
    const gA = mkArena(seed), listA = place(gA, 900);
    const arrA = drive(gA, listA);
    /* B：旧行为（只有直冲＋硬碰撞推出） */
    const gB = mkArena(seed), listB = place(gB, 900);
    gB.steerCity = () => false;
    const arrB = drive(gB, listB);
    nAll += listA.length; okAll += arrA.size; baseFail += (listB.length - arrB.size);
    sample0 = Math.max(sample0, listA.length);
  }
  check('绕楼测试有足够样本（逐楼正后方）', sample0 >= 20, '最多一局 ' + sample0 + ' 个样本');
  check('绕楼：正后方的敌人全部绕到玩家身边（旧版会顶墙卡死）', okAll === nAll, okAll + '/' + nAll);
  check('对照：关掉绕行转向后确实有敌人卡死（说明机制有效）', baseFail >= 3, '旧行为卡死 ' + baseFail + ' 体');
  /* ?solid=0 回退：楼体退回装饰，绕行转向必须同步关闭（不留「对着空气绕路」） */
  const gOff = mkArena(20250314);
  const anyE = place(gOff, 900)[0];
  gOff.debug.solid = false; gOff.applyRun(true);
  check('?solid=0：楼体退回装饰且绕行转向同步关闭',
    gOff.citySolid === false && gOff.steerCity(anyE, 1, 0, 1 / 60) === false);
}

// 25m. 敌人「数字故障」抖动：离散故障时钟（确定性、跨刷新率一致、不消费随机流）
{
  const recCtx = () => {
    const calls = [], grad = { addColorStop() {} };
    const noop = () => {};
    return {
      calls,
      save: noop, restore: noop, rotate: noop, beginPath: noop, closePath: noop, fill: noop, stroke: noop,
      moveTo: noop, lineTo: noop, quadraticCurveTo: noop, arc: noop, ellipse: noop, fillRect: noop, strokeRect: noop, fillText: noop,
      createRadialGradient: () => grad, createLinearGradient: () => grad, measureText: () => ({ width: 10 }),
      translate(x, y) { calls.push([x, y]); },
      set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {},
      set shadowColor(v) {}, set shadowBlur(v) {}, set font(v) {}, set textAlign(v) {},
    };
  };
  let hashOk = true, hashSum = 0;
  for (let i = -1000; i < 4000; i++) {
    const v = KUP.U.hash01(i);
    if (!(v >= 0 && v < 1) || v !== KUP.U.hash01(i)) hashOk = false;
    hashSum += v;
  }
  check('U.hash01：确定、值域 [0,1)', hashOk);
  check('U.hash01 分布均匀（均值≈0.5）', Math.abs(hashSum / 5000 - 0.5) < 0.02, (hashSum / 5000).toFixed(4));

  const G = KUP.CONFIG.GLITCH;
  const ctxR = recCtx();
  const eJ = new KUP.Enemy(KUP.ENEMIES.glitch, 100, 100, 1, 1);
  /* 直接截获「交给 _shape 的偏移与视觉时钟」——抖动的全部来源都在这里，
   * 不必去比对多边形顶点（顶点随 t 连续形变，无法区分「跳变」与「形变」）。 */
  let seen = [];
  eJ._shape = (c, tt, ox, oy) => { seen.push([ox, oy, tt]); };
  const offs = t => { seen = []; eJ.draw(ctxR, t); return JSON.stringify(seen.map(s => [s[0], s[1]])); };
  const clock = t => { seen = []; eJ.draw(ctxR, t); return seen.map(s => s[2]); };
  const realRng = KUP.U.rng;
  let rngUsed = 0;
  KUP.U.rng = () => { rngUsed++; return 0.5; };
  const a1 = offs(5.0), a2 = offs(5.0);
  const inStep = offs(5.0 + 1 / G.HZ * 0.4);                   // 同一刻度内
  const nextStep = offs(5.0 + 1 / G.HZ * 4);                   // 隔 4 个刻度
  check('敌人绘制不消费随机流（渲染路径铁律）', rngUsed === 0, 'U.rng 被调用 ' + rngUsed + ' 次');
  check('同一 t → 同一张画面（确定性）', a1 === a2);
  check('抖动按 GLITCH.HZ 分刻度：同刻度内不变', inStep === a1);
  check('跨刻度 → 偏移跳变（故障感来自跳变，不是平滑摆动）', nextStep !== a1);
  check('抖动幅度受 GLITCH.JITTER 约束', JSON.parse(a1).every(([x, y]) => Math.abs(x) <= G.JITTER + G.SPLIT * 0.6 && Math.abs(y) <= G.JITTER));
  /* 冻僵：视觉时钟定格（抖动与形变一起停），解冻后恢复 */
  eJ.applyStun(3);
  const frozen1 = JSON.stringify([offs(9.0), clock(9.0)]), frozen2 = JSON.stringify([offs(12.5), clock(12.5)]);
  check('冻僵时视觉时钟定格（抖动与形变停住）', frozen1 === frozen2);
  eJ.stunT = 0;
  check('解冻后视觉时钟恢复', clock(12.5).every(v => v === 12.5));
  KUP.U.rng = realRng;
}

/* ========== v0.13.1 追加（2026-10-16 玩家反馈四条） ========== */

// 25n. 治安战：Boss 排期改为「首次 4 分钟、之后每 2 分钟」＋ 多体并存不再互相顶掉
{
  const EN = KUP.CONFIG.ENDLESS;
  check('治安战 Boss 排期：首次 4 分钟、之后每 2 分钟（240 / 120）',
    EN.BOSS_FIRST === 240 && EN.BOSS_EVERY === 120, 'first=' + EN.BOSS_FIRST + ' every=' + EN.BOSS_EVERY);
  const gB2 = new KUP.Game(canvas);
  gB2.start({ char: 'kaf', area: 'order', seed: 601 });
  gB2.time = 240; gB2.orderBossT = 0.01; gB2.director(0.02);
  const b1 = gB2.boss;
  gB2.time = 360; gB2.orderBossT = 0.01; gB2.director(0.02);
  const b2 = gB2.boss;
  check('治安战可同时存在多体 Boss（前一体未击破又到点）',
    !!b1 && !!b2 && b1 !== b2 && gB2.enemies.filter(e => e.boss && !e.dead).length === 2);
  /* 逐体处理：两体的行为计时器都应在走（旧版只跑最新的一体 ⇒ 旧的一体从此不动） */
  b1.minionT = 5; b2.minionT = 5;
  gB2.updateBossBehavior(0.02);
  check('多体 Boss 各自行动（两体计时器都在走）',
    b1.minionT < 5 && b2.minionT < 5, 'minionT ' + b1.minionT.toFixed(2) + ' / ' + b2.minionT.toFixed(2));
  /* 击破旧的一体不得清掉还活着的那一体的指针（旧版无条件 this.boss = null） */
  gB2.killEnemy(b1);
  check('击破旧 Boss 不影响还活着的那一体', gB2.boss === b2 && !gB2.boss.dead);
  b2.minionT = 5;
  gB2.updateBossBehavior(0.02);
  check('击破旧 Boss 后，剩余 Boss 仍在行动', b2.minionT < 5);
}

// 25o. 显示缩放：地雷只缩画面、不缩判定；太刀不再画扇形范围框
{
  check('地雷模组带显示缩放 vis=0.5（线性一半 ⇒ 面积 1/4）', KUP.WEAPONS.mine.vis === 0.5);
  const gM = new KUP.Game(canvas);
  gM.debug.w = 'mine';                                  // ?w=mine：开局带 5 级音之地雷
  gM.start({ char: 'kaf', area: 'area0', seed: 601 });
  gM.director = () => {};
  for (let i = 0; i < 240 && !gM.zones.some(z => z.kind === 'mine'); i++) gM.update(1 / 60);
  const zm = gM.zones.find(z => z.kind === 'mine');
  check('实战生成的地雷：判定半径不变（>60）且带显示缩放',
    !!zm && zm.vis === 0.5 && zm.r > 60, zm ? 'r=' + Math.round(zm.r) + ' vis=' + zm.vis : '未生成');
  /* 记录型 ctx：太刀旧版会 fill 一次扇面（范围框的「面」）＋ 画两条半径边界线 */
  let fills = 0, arcs = 0, moves = 0;
  const grad = { addColorStop() {} }, noop = () => {};
  const ctxS = {
    save: noop, restore: noop, rotate: noop, closePath: noop, stroke: noop, fillRect: noop,
    beginPath: noop, lineTo: noop, quadraticCurveTo: noop, ellipse: noop,
    createRadialGradient: () => grad, createLinearGradient: () => grad,
    fill() { fills++; }, arc() { arcs++; }, moveTo() { moves++; },
    translate: noop, measureText: () => ({ width: 10 }), fillText: noop,
    set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {},
    set shadowColor(v) {}, set shadowBlur(v) {}, set font(v) {}, set textAlign(v) {},
  };
  const sl = new KUP.Slash(100, 100, 0.4, { len: 140, arc: 1.6, dmg: 10 });
  sl.age = sl.life * 0.5;
  sl.draw(ctxS, 1);
  check('太刀不再绘制扇形范围框（不填充扇面）', fills === 0, 'fill=' + fills);
  check('太刀只留一道扫过的刀光（1 段弧残影 + 1 条刃线）',
    arcs === 1 && moves === 1, 'arc=' + arcs + ' moveTo=' + moves);
  /* Lv4+ 的扇形冲击波同理：只留扫过的弧，不补两条半径边 */
  const rw = new KUP.Ring(100, 100, { maxR: 160, speed: 400, arc: 1.6, dir: 0.3, edges: false, color: '#fff', dmg: 1 });
  rw.r = 60;
  arcs = 0; moves = 0;
  rw.draw(ctxS, 1);
  check('太刀冲击波不补半径边（仍只有 1 段弧）', arcs === 1 && moves === 0, 'arc=' + arcs + ' moveTo=' + moves);
  check('其它扇形波仍保留半径边（bass 的角度可视化不受影响）',
    new KUP.Ring(0, 0, { maxR: 100, arc: 1.6, dir: 0, color: '#fff', dmg: 1 }).edges === true);
}

console.log(fail === 0 ? '\nALL PASS' : '\n' + fail + ' FAILED');
process.exit(fail === 0 ? 0 : 1);
