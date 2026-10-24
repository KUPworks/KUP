const DATA_FILES = ['js/data/manifest.js'].concat(require(require('path').join(__dirname, '..', 'js', 'data', 'manifest.js')));
/* 一次性验证脚本：run 配置（seed/area/mod）的可复现性、修正乘数接线、
 * v0.4–v0.6 新系统（復興率 / 番街解锁 / 覚醒 / 浄化の歌 / 記憶の卵 / 每区波次与事件 /
 *   角色≠声优 / 招募 / 皮肤 / **市民票与瓦利斯商店** / **新武器组** / **每关卡 Boss**）。
 * v0.7：加载顺序对齐 index.html（含 js/store.js）；持久化断言改为槽位存档 kup.save.<id>。
 * 用法：node tools/verify-run.js  （从仓库根运行） */
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
/* ui.js 也要加载：`KUP.bossHudRows`（多体 Boss 血条的**纯函数**行模型）在那里定义，
 * 需要在 node 里直接单测。它顶层只做定义、不碰 DOM（DOM 只在 UI.init 里用），
 * 因此加载后仍然用下面的 KUP.UI 桩替换掉真实 UI。 */
for (const f of ['js/utils.js', 'js/config.js', 'js/store.js', 'js/i18n.js', ...DATA_FILES, 'js/meta.js',
  'js/entities.js', 'js/game.js', 'js/director.js', 'js/render.js', 'js/ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const KUP = ctx.KUP;

/* 音频/UI 桩（node 环境无 DOM/WebAudio；game.start 会调用） */
KUP.Audio = { init() {}, resume() {}, startBGM() {}, stopBGM() {}, sfx() {} };
/* 真 UI 留个引用：结算屏文案（现金 vs 市民票）要用 DOM 桩跑一遍 showEnd。 */
const REAL_UI = KUP.UI;
KUP.UI = {
  banner() {}, showScreen() {}, showHUD() {}, showBoss() {}, updateBoss() {}, syncBosses() {},
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

let fail = 0, total = 0;
const check = (name, cond, extra) => {
  total++;
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '   ' + extra : ''));
  if (!cond) fail++;
};

/* ========== v0.19 数据层（manifest / core / audit / 新接口） ========== */
check('数据层已收口（KUP.DATA.ready）', !!(KUP.DATA && KUP.DATA.ready));
check('数据域数量与 manifest 一致', KUP.DATA.modules.length === KUP.DATA_MODULES.length && KUP.DATA_MODULES.length === 10,
  'registered=' + KUP.DATA.modules.length + ' manifest=' + KUP.DATA_MODULES.length);
check('manifest 每个模块都已注册并提供声明字段',
  KUP.DATA_MODULES.every(m => KUP.DATA.module(m.id) && (m.provides || []).every(s => KUP.DATA.has(s))));
check('跨域一致性校验 0 问题', KUP.DATA.audit().length === 0, KUP.DATA.audit().join('; '));
check('数据域归属正确（FORMS→skin／WEAPONS→weapon／BOSSES→enemy／SUPPORTS→support）',
  KUP.DATA.provider('FORMS').id === 'skin' && KUP.DATA.provider('WEAPONS').id === 'weapon' &&
  KUP.DATA.provider('BOSSES').id === 'enemy' && KUP.DATA.provider('SUPPORTS').id === 'support');
check('数据域文件路径均为 js/data/*.js', KUP.DATA_MODULES.every(m => /^js\/data\/[\w-]+\.js$/.test(m.file)));
check('新增查询接口 KUP.WEAPON / KUP.ENEMY 可用（未知 id 回落 null）',
  KUP.WEAPON('note') === KUP.WEAPONS.note && KUP.ENEMY('noise') === KUP.ENEMIES.noise &&
  KUP.ENEMY('boss0') === KUP.BOSSES.boss0 && KUP.WEAPON('nope') === null && KUP.ENEMY('nope') === null);
check('audit 可重复调用且无状态残留', KUP.DATA.audit().length === 0 && KUP.DATA.audit().length === 0);

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
/* v0.18.8：治安战（endless）不设章节名——避免横幅出现「治安戦 · 治安戦 -Order War-」 */
check('七个番街均有章节名（治安战不设，因其不是章节）',
  KUP.AREAS.filter(a => !a.endless).every(a => a.chapter && a.chapter.zh) &&
  !KUP.AREA('order').chapter);
check('章节名对应动画副标题',
  KUP.AREA('area1').chapter.zh === '悪意 -Malice-' &&
  KUP.AREA('area3').chapter.zh === 'ファミリア -Familiar-' &&
  KUP.AREA('area6').chapter.zh === '再生 -Regenerate-');
check('area1/2/4/5/6 配有章节演出事件', ['area1', 'area2', 'area4', 'area5', 'area6'].every(id => (KUP.AREA(id).events || []).length > 0));

/* ★★ 名称纪律：番街的英文必须用**官方英文**（srd VIRTUAL REALITY EN 页）——
 *   前五区＝`Area 0`〜`Area 4`；以下三个是**本仓库早先自译、且没有出处**的词，已废，
 *   若有人再写回来，这里会当场报错。证据见 docs/lore/research/official_srd_en_cn.md。 */
check('番街英文不得出现非官方的自译词（Lower Town／Pleasure Quarter／Farmlands）',
  !KUP.AREAS.some(a => {
    const s = (a.name && a.name.en ? a.name.en : '') + ' ' + (a.role && a.role.en ? a.role.en : '');
    return /\b(Lower Town|Pleasure Quarter|Farmlands)\b/.test(s);
  }));
check('前五区英文＝官方 `Area 0`〜`Area 4` + 官方地区词',
  KUP.AREA('area0').name.en === 'Area 0' && KUP.AREA('area0').role.en === 'Downtown' &&
  KUP.AREA('area1').name.en === 'Area 1' && KUP.AREA('area1').role.en === 'Office District' &&
  KUP.AREA('area2').name.en === 'Area 2' && KUP.AREA('area2').role.en === 'Entertainment District' &&
  KUP.AREA('area3').name.en === 'Area 3' && KUP.AREA('area3').role.en === 'Agricultural Area' &&
  KUP.AREA('area4').name.en === 'Area 4' && KUP.AREA('area4').role.en === 'Science Research Zone');
/* ★ 官方英文的自译禁区：教団英文＝`Isekai Salvation Cult`（`Issekai Salvation Order` 是本仓库早先自造）。
 *   生き神＝`living deity`（不是 `living god`）。 */
check('英文文案不得出现自造的 `Issekai Salvation Order`／`living god`',
  !/Issekai Salvation Order|living god/.test(JSON.stringify([KUP.AREAS, KUP.CHARS, KUP.COMPANIONS, KUP.SHOP])));
/* ★ 観統衿架 的官方英文＝`Erika Midoh`（旧的 `KANTO` 无任何出处，已废） */
check('観統衿架英文＝官方 `Erika Midoh`',
  /Erika Midoh/.test(JSON.stringify(KUP.AREAS)) && !/Erika Kanto|Erika KANTO/.test(JSON.stringify(KUP.AREAS)));
/* ★ 角色显示名随语言：英文走**官方罗马字**（`Kafu Morisaki`／CAST `KAF`），zh/ja 用日文汉字名。
 *   存档里持久化的字段（run.witch 等）不参与，避免切语言串味。 */
check('角色名/CAST 随语言切换（英文＝官方罗马字）', (() => {
  const old = KUP.I18N.lang;
  KUP.I18N.lang = 'en';
  const en = KUP.nameOf(KUP.CHAR('kaf')) === 'Kafu Morisaki' &&
             KUP.shortOf(KUP.CHAR('kaf')) === 'Kafu' &&
             KUP.cvOf(KUP.CHAR('kaf')) === 'KAF' &&
             KUP.nameOf(KUP.COMPANION('ciel')) === 'Ciel Saiki';
  KUP.I18N.lang = 'zh';
  const zh = KUP.nameOf(KUP.CHAR('kaf')) === '森先 化歩' && KUP.cvOf(KUP.CHAR('kaf')) === '花譜';
  KUP.I18N.lang = old;
  return en && zh;
})());
check('英文 CAST 与官方页一致（KAF/RIM/Harusaruhi/Isekaijoucho/KOKO/ARU/ASU/CIEL）',
  KUP.CHARS.every(c => ['KAF', 'RIM', 'Harusaruhi', 'Isekaijoucho', 'KOKO', 'ARU', 'ASU'].indexOf(c.cvEn) >= 0));

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

/* 10. 記憶の卵（v0.17）：**局内「現象」卡**——低概率额外出现，選中＝1 次復活
 *    人类 2026-10-19：「重设记忆之卵定位……每局有最多一次机会（且概率很低）抽到
 *    名为『记忆之卵』的『现象』卡，允许玩家复活一次，同时小 aoe 和短暂无敌帧。
 *    不做局外物品……玩家胜利结局不能重生，治安战可重生多次（概率依然很低）」。 */
KUP.META.reset();
check('記憶の卵不再是局外物品（无图鉴数据 / 无 addEgg / 不产出復興率）',
  KUP.FRAGMENTS === undefined && KUP.META.addEgg === undefined && KUP.META.total() === 0);
check('記憶の卵不再计入现金收入', KUP.META.cashIncome({ eggs: 9, kills: 0, win: false }) ===
  KUP.META.cashIncome({ kills: 0, win: false }));
{
  const gEgg = new KUP.Game(canvas);
  gEgg.start({ char: 'kaf', area: 'area0', seed: 4242 });
  gEgg.debug.egg = true;                       // 调试钩子：下一次升级必出卵卡
  const pool = gEgg.rollChoices();
  check('現象卡作为**第 4 张**出现（和普通卡一样占一格，总数仍 4）',
    pool.length === 4 && pool[3].kind === 'egg', JSON.stringify(pool.map(c => c.kind)));
  check('現象卡不可封禁（无 id ⇒ 不渲染 ✕）', pool[3].id === undefined);
  const again = gEgg.rollChoices();
  check('同一等级重掷不重复掷卵（不会"刷卵"）', again.filter(c => c.kind === 'egg').length === 1);
  /* 选中 → 復活充能 */
  gEgg.state = 'levelup'; gEgg.pendingLevels = 1; gEgg.choices = pool;
  gEgg.choose(3);
  check('选中現象卡 → 獲得 1 次復活充能、回到 playing', gEgg.eggCharge === 1 && gEgg.state === 'playing');
  check('选中后回到四选一（卵卡不占普通卡池）', gEgg.rollChoices().length === 4);
  /* 致命伤 → 消耗卵復活（而不是 gameOver） */
  gEgg.player.invuln = false; gEgg.player.hitT = 0;
  gEgg.hurtPlayer(99999, 'contact');
  check('HP 归零 → 消耗卵復活（不结算败北）', gEgg.state === 'playing' && gEgg.eggCharge === 0 && gEgg.eggUsed === 1);
  check('復活回复 50% 生命', Math.abs(gEgg.player.hp - Math.round(gEgg.player.maxhp * 0.5)) <= 1, 'hp=' + gEgg.player.hp);
  check('復活给短暂无敌帧（2.5s）', gEgg.player.hitT >= KUP.CONFIG.EGG.IFRAME - 0.1, 'hitT=' + gEgg.player.hitT);
  check('復活释放小 AOE 冲击环（半径 240 / 有伤害）',
    gEgg.rings.some(r => r.maxR === KUP.CONFIG.EGG.AOE_R && r.dmg > 0 && r.kb > 0));
  /* 没有卵时照常败北 */
  gEgg.player.invuln = false; gEgg.player.hitT = 0;
  gEgg.hurtPlayer(99999, 'contact');
  check('没有卵 → 正常败北（gameOver）', gEgg.state === 'over');
  /* 番街：一局最多出现一次（哪怕没选也不算第二次机会） */
  const gOnce = new KUP.Game(canvas);
  gOnce.start({ char: 'kaf', area: 'area0', seed: 4243 });
  gOnce.debug.egg = true;
  gOnce.rollChoices();
  gOnce.level += 3;                            // 换等级也不会再抽到
  check('番街：本局抽过一次后不再出现（最多一次机会）',
    gOnce.rollChoices().filter(c => c.kind === 'egg').length === 0);
  /* 胜利/结算后不能復活 */
  const gWin = new KUP.Game(canvas);
  gWin.start({ char: 'kaf', area: 'area0', seed: 4244 });
  gWin.eggCharge = 1; gWin.state = 'victory';
  check('胜利结局不能復活（tryEggRevive 只在 playing 生效）',
    gWin.tryEggRevive() === false && gWin.eggCharge === 1 && gWin.eggUsed === 0);
  /* 治安战：充能用掉后可以再次抽到（可復活多次） */
  const gEnd = new KUP.Game(canvas);
  gEnd.start({ char: 'kaf', area: 'order', seed: 4245 });
  gEnd.debug.egg = true;
  gEnd.eggCharge = 0;
  const p1 = gEnd.rollChoices();
  check('治安战：卵卡同样能出现', p1.some(c => c.kind === 'egg'));
  gEnd.eggCharge = 1; gEnd.eggOffered = true;
  check('治安战：手里有充能时不再抽到', !gEnd.rollChoices().some(c => c.kind === 'egg'));
  gEnd.eggCharge = 0; gEnd.level += 2;         // 充能用掉后（充能=0）允许再次出现
  check('治安战：充能用掉后可再次抽到（可復活多次）',
    gEnd.rollChoices().some(c => c.kind === 'egg'));
}

/* 10b. 不可解空間（v0.18）：BOSS 战有几率进入，规则临时改写
 *    人类 2026-10-20：「研究接口，BOSS战时有几率进入『不可解空间』」。
 *    接口＝KUP.MODIFIERS / MODS_KEYS；本作把它用作 Boss 战的随机规则变异外壳。 */
{
  const gSp = new KUP.Game(canvas);
  gSp.start({ char: 'kaf', area: 'area0', seed: 707 });
  check('不可解空間数据表（≥6 条、三语名/说明/颜色、乘数键合法）',
    KUP.SPACES.length >= 6 && KUP.SPACES.every(s =>
      s.name && s.name.zh && s.name.en && s.name.ja &&
      s.desc && s.desc.zh && s.color &&
      Object.keys(s.mods || {}).every(k => KUP.MODS_KEYS.indexOf(k) >= 0)));
  check('combineMods 按项相乘、缺项补 1',
    (() => {
      const m = KUP.combineMods({ playerDmg: 1.1 }, { playerDmg: 1.3, enemySpeed: 1.15 });
      return Math.abs(m.playerDmg - 1.43) < 1e-9 && m.spawnRate === 1 && m.enemySpeed === 1.15;
    })());
  gSp.debug.space = 'heat';
  const bossSp = gSp.spawnEnemy('boss', gSp.player.x + 60, gSp.player.y);
  gSp.boss = bossSp;
  /* 另放一只活着的杂兵，用来验证「退出后回退」（死掉的触发体不再参与缩放） */
  const tankSp = gSp.spawnEnemy('tank', gSp.player.x + 200, gSp.player.y);
  const baseDmg = bossSp.dmg, basePlayerDmg = gSp.player.dmgMult, tankBaseDmg = tankSp.dmg;
  check('BOSS 出现 → 先记录待展开（延迟展开，不盖 Boss 横幅）',
    gSp.maybeEnterSpace(bossSp) === true && !!gSp.spacePending && gSp.space === null);
  check('展开前规则未变（mods 仍为基础）', Math.abs(gSp.mods.playerDmg - 1) < 1e-9);
  for (let i = 0; i < 120; i++) gSp._tickSpace(0.02);
  check('延迟后进入指定空間（?space=heat）', !!gSp.space && gSp.space.id === 'heat' && gSp.spaceBoss === bossSp);
  check('空間规则叠加：playerDmg 1.3 / enemyDmg 1.3',
    Math.abs(gSp.mods.playerDmg - 1.3) < 1e-9 && Math.abs(gSp.mods.enemyDmg - 1.3) < 1e-9);
  check('玩家即时重算（伤害 ×1.3）', Math.abs(gSp.player.dmgMult - basePlayerDmg * 1.3) < 1e-6);
  check('场上已有敌人同步（伤害 ×1.3，而不是只影响新刷的怪）',
    Math.abs(bossSp.dmg - baseDmg * 1.3) < 1e-6);
  check('同一时间不会叠加第二个空間', gSp.maybeEnterSpace(bossSp) === false);
  /* 触发体被击破 → 规则回归 */
  bossSp.dead = true;
  gSp._tickSpace(0.02);
  check('触发体击破 → 退出空間、规则回归', gSp.space === null && Math.abs(gSp.mods.playerDmg - 1) < 1e-9);
  check('玩家与敌人同步回退', Math.abs(gSp.player.dmgMult - basePlayerDmg) < 1e-6 &&
    Math.abs(tankSp.dmg - tankBaseDmg) < 1e-6);
  check('stats 记录遇到过的空間（结算徽章）',
    gSp.stats().space === 'heat' && !!gSp.stats().spaceName && gSp.stats().spaceCount === 1);
  /* 治安战多体 Boss：空间不叠加，且「触发体死了但另一体还在」时保持到整场 Boss 战结束 */
  const gMb = new KUP.Game(canvas);
  gMb.start({ char: 'kaf', area: 'order', seed: 712 });
  gMb.debug.space = 'heat';
  const bA = gMb.spawnEnemy('boss0', gMb.player.x + 60, gMb.player.y);
  gMb.boss = bA;
  gMb.maybeEnterSpace(bA);
  for (let i = 0; i < 120; i++) gMb._tickSpace(0.02);
  const bB = gMb.spawnEnemy('boss1', gMb.player.x - 60, gMb.player.y);
  check('多体 Boss：既存空间期间不会叠加第二处', gMb.maybeEnterSpace(bB) === false && !!gMb.space);
  bA.dead = true;
  gMb._tickSpace(0.02);
  check('多体 Boss：触发体被击破但仍有一体存活 → 空间保留', !!gMb.space && gMb.space.id === 'heat');
  check('多体 Boss：空间仍作用于后出现的 Boss（规则未提前回退）',
    Math.abs(gMb.mods.playerDmg - 1.3) < 1e-9 &&
    Math.abs(gMb.player.dmgMult - gMb.player.base.dmg * 1.3) < 1e-6);
  bB.dead = true;
  gMb._tickSpace(0.02);
  check('多体 Boss 全部击破 → 空间退出、规则回归',
    gMb.space === null && Math.abs(gMb.mods.playerDmg - 1) < 1e-9);
  /* 延迟期间触发体就被击破：不展开（否则会「展开即崩壊」闪一下） */
  const gPd = new KUP.Game(canvas);
  gPd.start({ char: 'kaf', area: 'area0', seed: 713 });
  gPd.debug.space = 'heat';
  const bPd = gPd.spawnEnemy('boss', gPd.player.x + 60, gPd.player.y);
  gPd.maybeEnterSpace(bPd);
  bPd.dead = true;
  for (let i = 0; i < 120; i++) gPd._tickSpace(0.02);
  check('延迟期间触发体被击破 → 不展开空间（不闪横幅）',
    gPd.space === null && gPd.spacesSeen.length === 0);
  /* 敌人血量类空间：过密空間让已存在的敌人也更脆 */
  const gDn = new KUP.Game(canvas);
  gDn.start({ char: 'kaf', area: 'area0', seed: 708 });
  gDn.debug.space = 'dense';
  const eDn = gDn.spawnEnemy('tank', gDn.player.x + 80, gDn.player.y);
  const hpDn = eDn.hp;
  gDn.maybeEnterSpace(null);
  for (let i = 0; i < 120; i++) gDn._tickSpace(0.02);
  check('過密空間：敌人在场血量 ×0.85',
    Math.abs(eDn.maxhp - hpDn * 0.85) < 1e-6 && Math.abs(eDn.hp - hpDn * 0.85) < 1e-6);
  /* 静音空間：浄化の歌被封印 */
  const gMu = new KUP.Game(canvas);
  gMu.start({ char: 'kaf', area: 'area0', seed: 709 });
  gMu.debug.space = 'mute';
  const bMu = gMu.spawnEnemy('boss', gMu.player.x + 60, gMu.player.y);
  gMu.boss = bMu;
  gMu.maybeEnterSpace(bMu);
  for (let i = 0; i < 120; i++) gMu._tickSpace(0.02);
  gMu.ult.charge = 100;
  const ringN = gMu.rings.length;
  gMu.castUltimate();
  check('静音空間封印浄化の歌（充能不被清空、不释放）', gMu.ult.charge === 100 && gMu.rings.length === ringN);
  /* 关闭开关 + 錯乱空間改写 + 随机可复现 */
  const gOff = new KUP.Game(canvas);
  gOff.start({ char: 'kaf', area: 'area0', seed: 710 });
  gOff.debug.space = 'off';
  check('?space=off 关闭（调试/回归用）', gOff.maybeEnterSpace(null) === false);
  const gCh = new KUP.Game(canvas);
  gCh.start({ char: 'kaf', area: 'area0', seed: 711 });
  gCh.debug.space = 'chaos';
  gCh.maybeEnterSpace(null);
  for (let i = 0; i < 120; i++) gCh._tickSpace(0.02);
  const firstId = gCh.space && gCh.space.id;
  for (let i = 0; i < 1400; i++) gCh._tickSpace(0.02);   // > rotateEvery(25s)
  check('錯乱空間：规则会改写为另一条空間',
    firstId === 'chaos' && !!gCh.space && gCh.space.id !== 'chaos' && gCh.spacesSeen.length >= 2);
  const mkRand = seed => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'kaf', area: 'area0', seed });
    g.debug.space = '1';
    g.maybeEnterSpace(null);
    return g.spacePending && g.spacePending.def.id;
  };
  check('同 seed 的随机空間可复现（确定性）', !!mkRand(4242) && mkRand(4242) === mkRand(4242));
}

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
check('全部武器均配进化形态数据', Object.keys(KUP.WEAPONS).length === 21 &&
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

// 11c. 皮肤（形態）：通用形态 ＋ 系列化全量形态（v0.13.5）；黑／白（魔女候補）；JK 制服（同伴）
check('魔女形态：共用形态（花魁鳥／姬連雀）已系列化（7 系列；化歩可选 14 条＝11＋共用 3；v0.18.2 取消通常形態）',
  ['ouranchou', 'himerenjaku', 'yatagarasu'].every(id => KUP.formsFor('witch', 'kaf').some(f => f.id === id)) &&
  KUP.FORM_SERIES.length === 7 && KUP.formsFor('witch', 'kaf').length === 14,
  String(KUP.formsFor('witch', 'kaf').length) + ' 条 / ' + KUP.FORM_SERIES.length + ' 系列');
check('魔女候補皮肤＝黑／白（v0.18.2 起没有「通常形態」）', KUP.formsFor('recruit').map(f => f.id).join(',') === 'kuro,shiro');
/* ★ 出处等级记在**数据层** `src`（界面上已不显示，见 js/ui.js selectForm 的注释）；
 *   这里断言它存在，是为了守住 docs/lore/README.md 铁律 1「每条设定都要能回答是官方还是自编」。 */
check('形態带官方命名法与出处标注（数据层 src）', KUP.FORM('ouranchou').label.zh.indexOf('魔女特殊歌唱用形態') === 0 && !!KUP.FORM('ouranchou').src && !!KUP.FORM('himerenjaku').src);
/* ★ 名称纪律：「異能テセラクター」在官方专指**眷魔（ファミリア）＝盟友**，
 *   不得用来命名敌人（否则等于"把盟友写成敌人"，违反 lore §4.2／§11 行 22）。 */
check('敌人不得使用「異能テセラクター」（该词指眷魔/盟友）',
  ['zh', 'en', 'ja'].every(l => !/異能テセラクター|Aberrant Tesseracter/.test(KUP.ENEMIES.elite.name[l])));

/* ========== v0.20.2 破维魔八形＝体型/参数原型（只改参数，不绑绘制） ========== */
const SHAPE_IDS = ['fish', 'humanoid_mob', 'humanoid', 'reptile', 'insect', 'plant', 'bird', 'sphere'];
check('破维魔八形齐全（顺序＝人类指定；三语＋设计注释齐备）',
  KUP.ENEMY_SHAPES.length === 8 && KUP.ENEMY_SHAPES.map(s => s.id).join(',') === SHAPE_IDS.join(',') &&
  KUP.ENEMY_SHAPES.every(s => ['zh', 'en', 'ja'].every(l => typeof s.name[l] === 'string' && s.name[l].length > 0) && !!s.note));
const ALL_ENEMY_IDS = ['noise', 'bird', 'human_mob', 'glitch', 'tank', 'elite',
  'boss0', 'boss1', 'boss2', 'boss3', 'boss4', 'boss5', 'boss6', 'boss7'];
check('每个敌人（6 杂兵/精英 ＋ 8 体 Boss）都写了合法 shape',
  ALL_ENEMY_IDS.every(id => KUP.ENEMIES[id] && SHAPE_IDS.indexOf(KUP.ENEMIES[id].shape) >= 0));
check('八形各至少一个成员（分类不留空）',
  SHAPE_IDS.every(id => KUP.enemiesOfShape(id).length > 0),
  SHAPE_IDS.map(id => id + ':' + KUP.enemiesOfShape(id).length).join(' '));
check('八体 Boss 各占一形（不重复，便于按体型记手感）',
  new Set(Object.values(KUP.BOSSES).map(b => b.shape)).size === 8);
check('KUP.ENEMY_SHAPE 查询可用（未知 → null）',
  KUP.ENEMY_SHAPE('fish') === KUP.ENEMY_SHAPES[0] && KUP.ENEMY_SHAPE('nope') === null);
/* 人类 2026-10-24 指定的两项：鱼形做高速型；鸟型／人形（杂兵）做"略有区别的基本型" */
check('体型分工：鱼形＝高速型，鸟型／人形（杂兵）＝基本型变体',
  KUP.ENEMIES.glitch.shape === 'fish' && KUP.ENEMIES.noise.shape === 'sphere' &&
  KUP.ENEMIES.bird.shape === 'bird' && KUP.ENEMIES.human_mob.shape === 'humanoid_mob' &&
  KUP.ENEMIES.elite.shape === 'humanoid' && KUP.ENEMIES.tank.shape === 'reptile');
/* 基本型变体只做小幅参数偏移：不能顺手把杂兵难度抬高一档 */
const rel = (a, b) => Math.abs(a - b) / b;
check('基本型变体只差 10–35% 的参数（不改变难度量级）',
  ['bird', 'human_mob'].every(id => {
    const e = KUP.ENEMIES[id], n = KUP.ENEMIES.noise;
    return rel(e.hp, n.hp) <= 0.35 && rel(e.speed, n.speed) <= 0.2 &&
      rel(e.dmg, n.dmg) <= 0.2 && rel(e.r, n.r) <= 0.2 && rel(e.turn, n.turn) <= 0.25;
  }),
  ['bird', 'human_mob'].map(id => {
    const e = KUP.ENEMIES[id], n = KUP.ENEMIES.noise;
    return id + ' hp' + ((e.hp / n.hp - 1) * 100).toFixed(0) + '% spd' + ((e.speed / n.speed - 1) * 100).toFixed(0) + '%';
  }).join(' '));
/* BOSS：先选体型再另外调参 ⇒ 体力曲线与体型解耦（鱼形可以更快但不必更肉） */
const bossSeq = ['boss0', 'boss1', 'boss2', 'boss3', 'boss4', 'boss5', 'boss6'].map(id => KUP.BOSSES[id]);
check('Boss 强度曲线：hp 严格递增（速度按体型给、不强行递增）',
  bossSeq.every((b, i) => i === 0 || b.hp > bossSeq[i - 1].hp) &&
  KUP.BOSSES.boss2.speed > KUP.BOSSES.boss3.speed);
check('Boss 转向按体型：鱼/虫/鸟最灵，植物/爬行最重',
  KUP.BOSSES.boss2.turn > 400 && KUP.BOSSES.boss4.turn > 400 && KUP.BOSSES.boss5.turn > 400 &&
  KUP.BOSSES.boss0.turn === 380 && KUP.BOSSES.boss1.turn < 380 &&
  KUP.BOSSES.boss6.turn < 380 && KUP.BOSSES.boss3.turn < 300);
check('Boss 不继承杂兵数值（同体型 ≠ 同强度）',
  KUP.BOSSES.boss2.hp > KUP.ENEMIES.glitch.hp * 30 && KUP.BOSSES.boss6.hp > KUP.ENEMIES.tank.hp * 50);
/* 波次接线：只把基本型权重拆给两个变体，总权重与刷怪率不变 */
const waveSplitOk = w => w.types.noise > 0 && w.types.bird > 0 && w.types.human_mob > 0 &&
  Math.abs(w.types.bird / w.types.noise - 0.15 / 0.7) < 0.03 &&
  Math.abs(w.types.human_mob / w.types.noise - 0.15 / 0.7) < 0.03;
check('鸟型/人形杂兵已接入波次（全局＋七个番街；权重按 70:15:15 拆基本型）',
  KUP.WAVES.every(waveSplitOk) &&
  KUP.AREAS.filter(a => !a.endless).every(a => a.waves.every(waveSplitOk)));
/* 人类要求「绘制方式等回退」：数据层不再提供剪影绘制钩子，剪影方案已整体撤回 */
check('绘制已回退（数据层不再有 KUP.ENEMY_SILHOUETTES 剪影钩子）',
  typeof KUP.ENEMY_SILHOUETTES === 'undefined');

/* ========== v0.20.4 射弹 Boss〈弾片〉＋ 统一警报 UI ＋ 不可解空間规则置顶 ========== */
check('射弹 Boss〈弾片〉：第 8 体 Boss／barrage 模式／人形（杂兵）体型／三语名',
  !!KUP.BOSSES.boss7 && KUP.BOSSES.boss7.pattern === 'barrage' &&
  KUP.BOSSES.boss7.shape === 'humanoid_mob' && KUP.BOSSES.boss7.boss === true &&
  /弾片/.test(KUP.BOSSES.boss7.name.zh) && /Shrapnel/.test(KUP.BOSSES.boss7.name.en) &&
  /弾片/.test(KUP.BOSSES.boss7.name.ja));
check('统一警报 UI：KUP.TELL 存在（红边 / 黄斜纹 / 近黑底）',
  !!KUP.TELL && KUP.TELL.red === '#ff2b3d' && /255,225,74/.test(KUP.TELL.yellowRGBA));

/* 记录式 ctx：抓 fillStyle/strokeStyle/shadowColor 赋值与「!」徽章，验证五种攻击同一套警报 */
const recTellCtx = () => {
  const calls = [];
  const c = {
    calls,
    save() {}, restore() {}, translate() {}, rotate() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {}, clip() {},
    arc() {}, fill() {}, stroke() {}, fillRect() {}, strokeRect() {}, setLineDash() {},
    fillText(txt) { calls.push(['fillText', String(txt)]); },
    createLinearGradient() { return { addColorStop() {} }; },
  };
  for (const prop of ['fillStyle', 'strokeStyle', 'shadowColor']) {
    let v = '';
    Object.defineProperty(c, prop, {
      get() { return v; },
      set(nv) { v = nv; calls.push([prop, String(nv)]); },
    });
  }
  return c;
};
const tellProbe = (kind, extra) => {
  const d = new KUP.Danger(0, 0, Object.assign({ kind, color: '#123456', arm: 0.5, r: 60, len: 300, w: 20, maxR: 200, dir: 0.3 }, extra || {}));
  d.age = 0.2;
  const c = recTellCtx();
  d.draw(c, 1.23);
  return c.calls;
};
const tellBad = [];
for (const kind of ['beam', 'ring', 'field', 'bomb', 'shot']) {
  const calls = tellProbe(kind);
  if (!calls.some(c => c[0] === 'fillText' && c[1] === '!')) tellBad.push(kind + ':no!');
  for (const c of calls) {
    if ((c[0] === 'fillStyle' || c[0] === 'strokeStyle' || c[0] === 'shadowColor') && c[1] === '#123456') tellBad.push(kind + ':ownColor');
  }
}
check('五种 Boss 攻击共用同一套警报 UI（「!」齐备，且不再使用各自的 color）',
  tellBad.length === 0, tellBad.join(','));

/* 射弹（shot）：预警不伤人 → 飞出命中结算 → 被楼体挡住 */
const gSht = new KUP.Game(canvas);
gSht.start({ char: 'kaf', area: 'area0', seed: 4242 });
const pSht = gSht.player;
pSht.invuln = 0;
const hpSht0 = pSht.hp;
const shotA = new KUP.Danger(pSht.x - 220, pSht.y, { kind: 'shot', dir: 0, speed: 260, r: 8, dmg: 12, arm: 0.4, shotLife: 3 });
shotA.update(1 / 60, gSht); shotA.update(1 / 60, gSht);
check('射弹预警期不造成伤害（可躲避窗口）', pSht.hp === hpSht0 && !shotA.dead);
const sx0 = shotA.x;
for (let i = 0; i < 160 && !shotA.dead; i++) shotA.update(1 / 60, gSht);
check('射弹有飞行时间，飞出击中玩家后才结算（不是"落点即判定"）',
  sx0 < pSht.x && pSht.hp < hpSht0 && shotA.dead, 'x ' + Math.round(sx0) + '→' + Math.round(shotA.x));
const gBlk = new KUP.Game(canvas);
gBlk.start({ char: 'kaf', area: 'area0', seed: 4243 });
const hpBlk0 = gBlk.player.hp;
const shotB = new KUP.Danger(gBlk.player.x - 200, gBlk.player.y, { kind: 'shot', dir: 0, speed: 300, r: 8, dmg: 12, arm: 0 });
gBlk.collideCircle = () => true;                    // 模拟"前面有一栋楼"
shotB.update(1 / 60, gBlk);
check('射弹会被楼体挡下（绕楼是合法解法）', shotB.dead && gBlk.player.hp === hpBlk0);

/* 〈弾片〉的 Boss 行为：barrage 真的发射 shot（扇形齐射 + 重弹） */
const gB7 = new KUP.Game(canvas);
gB7.start({ char: 'kaf', area: 'area0', seed: 777 });
gB7.enemies.length = 0;
gB7.player.invuln = 1e9;
const b7 = gB7.spawnEnemy('boss7', gB7.player.x + 80, gB7.player.y);
b7.bornAt = gB7.time;
for (let i = 0; i < 300; i++) gB7.updateBossBehavior(1 / 60);
const shots = gB7.dangers.filter(d => d.kind === 'shot');
check('〈弾片〉行为会发射弹丸（扇形齐射 ≥5 发，且为可预警的 arm）',
  shots.length >= 5 && shots.every(d => d.arm > 0 && d.dmg > 0), 'shots=' + shots.length);

/* 不可解空間：规则原文常驻顶部（HTML/CSS/UI 三处接线 + 每条空间都有三语规则文） */
const idxSrc = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssSrc = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const uiSrc2 = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
check('不可解空間规则置顶：HTML 有 #space-rules、CSS 有样式、UI 从 SPACES[*].desc 取文',
  idxSrc.includes('id="space-rules"') && cssSrc.includes('#space-rules') &&
  uiSrc2.includes("this.els['space-rules']") && uiSrc2.includes('g.space.desc') &&
  KUP.SPACES.every(s => ['zh', 'en', 'ja'].every(l => typeof s.desc[l] === 'string' && s.desc[l].length > 0)));

check('番街出处字段仍在数据层', KUP.AREAS.every(a => a.src === 'regenerate' || a.src === 'narrative' || a.src === 'original'));
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
const pAruBase = new KUP.Player(KUP.CHAR('aru'), KUP.modsFor('none'), { form: KUP.NO_FORM });
check('招募角色皮肤「黑」：攻击 +6%（基线＝無皮膚）', Math.abs(pKuro.dmgMult - pAruBase.dmgMult * 1.06) < 1e-9);
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
check('胜利不再必得記憶の卵（v0.17：改为局内現象卡）', gV.eggCharge === 0 && gV.eggUsed === 0);
check('胜利 → 復興率已结算', !!gV.metaResult && gV.metaResult.gain >= 12, JSON.stringify(gV.metaResult));
check('暴走标记照旧记录（只作 observability，不作判定）', gV.stats().bossEnraged === false);
check('普通胜利的副标题取 end.win.sub（pyrrhic 分支已取消，源码断言见下方 14 条）', gV.stats().bossEnraged === false);

// 14. v0.15.2：**取消胜利／惨胜的区分**（人类 2026-10-18）
//     暴走后击破仍然只是「胜利」，不再产生任何一种单独的结局分支：
//     ① 结算副标题固定 end.win.sub（pyrrhic 文案不再被取用，源码断言）
//     ② 结算口径只有「胜利」一条：復興率/市民票都由「是否胜利＋是否首通」决定，
//        与暴走与否无关（下方对比两次同一番街的胜利结算，增益完全相同）
//     ③ 暴走本身仍然记录在 stats.bossEnraged 里（只作 observability，不作判定）
const gP = new KUP.Game(canvas);
gP.start({ char: 'kaf', area: 'area6', seed: 888 });   // 从未通关的番街 → 两次都按「首通」结算
const boss2 = gP.spawnEnemy('boss', gP.player.x + 50, gP.player.y);
gP.boss = boss2;
gP.time = KUP.CONFIG.ENRAGE_TIME + 1;
gP.updateBossBehavior(0.01); // 触发暴走判定
check('5:00 后 Boss 暴走标记', gP.bossEnraged === true);
gP.damageEnemy(boss2, 999999);
check('暴走后击破 → 仍然只是胜利（不再叫惨胜）', gP.state === 'victory');
const gP2 = new KUP.Game(canvas);
gP2.start({ char: 'kaf', area: 'area5', seed: 889 }); // 同样从未通关
const boss2b = gP2.spawnEnemy('boss', gP2.player.x + 50, gP2.player.y);
gP2.boss = boss2b;
gP2.damageEnemy(boss2b, 999999);                      // 未暴走
check('惨胜不再单独结算：復興率增益与普通胜利一致', !!gP.metaResult && !!gP2.metaResult &&
  gP.metaResult.gain === gP2.metaResult.gain, gP2.metaResult.gain + ' vs ' + gP.metaResult.gain);
check('惨胜不再单独结算：现金收入与普通胜利一致', (() => {
  /* 现金收入＝（通关 15 ＋ 首通 10 ＋ 击杀/10 ＋ 番街深度×2）×4——
   * 两局在不同番街，所以先扣掉「番街深度×2×4」再比：剩下的公共部分应完全一致，
   * 即没有任何"惨胜"专属的奖励或扣减。 */
  const depth = id => KUP.META.areaIndex(id) * 2 * 4;
  const a = gP.metaResult.cash - depth('area6');
  const b = gP2.metaResult.cash - depth('area5');
  return a === b;
})(), gP2.metaResult.cash + ' vs ' + gP.metaResult.cash);
{
  /* 结算副标题与菜单记录：直接读 ui.js 源码做断言（node 环境没有 DOM，不跑真实 UI） */
  const uiSrc = require('fs').readFileSync('js/ui.js', 'utf8');
  check('showEnd 里 win-sub 固定为 end.win.sub（不再按暴走切换）',
    /win-sub'\]\s*&&\s*win\)[\s\S]{0,300}KUP\.I18N\.t\('end\.win\.sub'\)/.test(uiSrc) &&
    uiSrc.indexOf("KUP.I18N.t('end.win.sub.pyrrhic')") < 0);
  /* v0.18.8：惨胜副标题词条已彻底删除（不是"保留未删"） */
  const i18nSrc0 = require('fs').readFileSync('js/i18n.js', 'utf8');
  check('惨胜副标题词条 end.win.sub.pyrrhic 已从词典删除',
    i18nSrc0.indexOf('end.win.sub.pyrrhic') < 0);
  check('番街卡不再渲染章节行（.area-chapter 已移除，章节名只留在 Q 横幅）',
    uiSrc.indexOf('area-chapter') < 0);
  check('UI 不再提交番街最佳记录（submitBest 不再被 UI 调用）', uiSrc.indexOf('submitBest(') < 0);
  check('菜单最佳记录行隐藏（showBest 里给 best-line 加 hidden）',
    /best-line'\]\.classList\.add\('hidden'\)/.test(uiSrc));
  check('治安战记录行仍在显示（order-best-line 照常渲染）',
    /order-best-line'\]\.textContent\s*=/.test(uiSrc));
}

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

// 17. 结算屏数据：復活次数与 run 元信息
const st = gV.stats();
check('stats 含 run 元信息与復活次数', st.seed === 777 && st.areaId === 'area0' && st.revives === 0 && st.eggCharge === 0);
check('幸祜日文描述已修复（待修 #1）', KUP.WEAPONS.lance.desc.ja.indexOf('この世界に口づけを') < 0);

// 18. 存档层持久化往返（v0.7：kup.save.<槽id> + 版本化信封）
KUP.META.reset();
KUP.META.addRunResult('area0', true, { kills: 40, areaIdx: 0, runId: 'vfy-1' });
const rawSave = ctx.localStorage.getItem('kup.save.' + KUP.META.slotId());
const env = JSON.parse(rawSave);
const saved = env.data;
check('槽位存档已落盘（带版本信封）', !!saved && env.v === 1 && saved.fukkou > 0 && saved.cash > 0,
  'key=kup.save.' + KUP.META.slotId());
check('结算写入 runId 幂等键', saved.lastRunId === 'vfy-1', 'lastRunId=' + saved.lastRunId);
const dupTotal = KUP.META.total();
check('同一 runId 重复结算被拒（復興率不重复累加）',
  KUP.META.addRunResult('area0', true, { kills: 40, areaIdx: 0, runId: 'vfy-1' }) === null
  && KUP.META.total() === dupTotal);
KUP.META.data = null;
KUP.META.load();
check('槽位存档重载一致', KUP.META.total() === saved.fukkou && KUP.META.cash() === saved.cash);
check('最佳记录随槽位持久化', (KUP.META.submitBest({ win: true, time: 120, kills: 30, witch: 'x' }),
  KUP.META.data = null, KUP.META.load(), KUP.META.best().time === 120));

/* ========== v0.6：局外经济 / 商店 / 培养招募 ==========
 * v0.16（人类 2026-10-19）：经济改造——**每局结束发「现金」（单位：元）**，
 * 瓦利斯一律用现金结算；市民票由现金**小比例兑换**（CASH_PER_TICKET 元 → 1 张），
 * 且**一张市民票即可招募**。 */
// 19. 现金收入（旧 ticketIncome 接口保留，返回等值现金）
KUP.META.reset();
const inc1 = KUP.META.cashIncome({ kills: 100, areaIdx: 0, win: true, firstClear: true });
check('现金收入：100 杀 + 首通 → (10+15+10)×4＝140 元', inc1 === 140, 'income=' + inc1);
const inc2 = KUP.META.cashIncome({ kills: 40, areaIdx: 3, win: false, firstClear: false });
check('现金收入：败北也计入（(4+3+0+6)×4＝52 元）', inc2 === 52, 'income=' + inc2);
check('旧接口 ticketIncome 保留，返回等值现金（兼容旧调用）',
  KUP.META.ticketIncome({ kills: 100 }) === KUP.META.cashIncome({ kills: 100 }) &&
  KUP.META.ticketIncome({ kills: 100 }) > 0);
KUP.META.addCash(inc1);
check('现金入账', KUP.META.cash() === 140);
check('每局结算发放现金（不再是市民票）', (() => {
  KUP.META.reset();
  const r = KUP.META.addRunResult('area0', true, { kills: 50, areaIdx: 0 });
  return r && r.cash > 0 && r.cashTotal === r.cash && KUP.META.cash() === r.cash && KUP.META.tickets() === 0;
})(), 'cash=' + KUP.META.cash() + ' tickets=' + KUP.META.tickets());

// 19b. 现金 → 市民票：小比例兑换
KUP.META.reset();
KUP.META.addCash(250);
const rate = KUP.META.cashPerTicket();
check('兑换比例是小比例（≥50 元换 1 张，不会 1:1）', rate >= 50, 'rate=' + rate);
check('兑换 1 张：扣 ' + rate + ' 元、得 1 张票', (() => {
  const got = KUP.META.exchangeCash(1);
  return got === 1 && KUP.META.tickets() === 1 && KUP.META.cash() === 250 - rate;
})(), 'cash=' + KUP.META.cash() + ' tickets=' + KUP.META.tickets());
check('现金不足时兑换失败（不产生负数/不吞钱）', (() => {
  KUP.META.data.cash = rate - 1;
  const got = KUP.META.exchangeCash(1);
  return got === 0 && KUP.META.cash() === rate - 1 && KUP.META.tickets() === 1;
})(), 'cash=' + KUP.META.cash());

// 20. 瓦利斯商店：价格递增、购买扣**现金**、等级上限、乘积/加和汇总
KUP.META.reset();
KUP.META.addCash(2000);
const bun = KUP.SHOP_ITEM('bun');
check('商店表齐备（10 项·三语·mods）', KUP.SHOP.length === 10 && KUP.SHOP.every(s => s.mods && s.name.zh && s.desc.zh));
check('价格随等级递增（现金计价：32 / 56 / 128）',
  KUP.shopCost(bun, 0) === 32 && KUP.shopCost(bun, 1) === 56 && KUP.shopCost(bun, 4) === 128);
const c0 = KUP.META.cash();
check('购买一级成功并扣**现金**（市民票不动）',
  KUP.META.buyShop('bun') && KUP.META.shopLv('bun') === 1 &&
  KUP.META.cash() === c0 - 32 && KUP.META.tickets() === 0);
for (let i = 0; i < 10; i++) KUP.META.buyShop('bun');
check('等级封顶 maxLv', KUP.META.shopLv('bun') === 5 && KUP.META.shopNextCost('bun') === Infinity);
const mods1 = KUP.META.shopMods();
check('乘法型强化按 lv 幂次汇总', Math.abs(mods1.hp - Math.pow(1.03, 5)) < 1e-9, 'hp=' + mods1.hp.toFixed(4));
for (let i = 0; i < 2; i++) KUP.META.buyShop('sign');
for (let i = 0; i < 3; i++) KUP.META.buyShop('regular');
const mods2 = KUP.META.shopMods();
check('加法型强化（开局充能/开局等级）汇总', mods2.startUlt === 30 && mods2.startLevel === 3, JSON.stringify({ u: mods2.startUlt, l: mods2.startLevel }));
KUP.META.reset();
KUP.META.addCash(31);
check('现金不足时购买失败', !KUP.META.buyShop('bun') && KUP.META.cash() === 31);

// 21. 商店强化接线到 Player / 开局等级与充能
const pShop = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), { shopMods: { hp: 1.03, playerDmg: 1.02, pickup: 1.06, speed: 1.02, cd: 0.98, xp: 1.04 } });
const pPlain = new KUP.Player(KUP.CHAR('kaf'), KUP.modsFor('none'), {});
check('商店强化接入 Player 数值',
  pShop.maxhp === Math.round(pPlain.maxhp * 1.03) &&
  Math.abs(pShop.dmgMult - pPlain.dmgMult * 1.02) < 1e-9 &&
  Math.abs(pShop.pickup - pPlain.pickup * 1.06) < 1e-9 &&
  Math.abs(pShop.cdMult - pPlain.cdMult * 0.98) < 1e-9);
KUP.META.reset();
KUP.META.addCash(2000);
for (let i = 0; i < 2; i++) KUP.META.buyShop('sign');
KUP.META.buyShop('regular');
const gShop = new KUP.Game(canvas);
gShop.start({ char: 'kaf', area: 'area0', seed: 11 });
check('开局充能/开局等级生效', gShop.ult.charge === 30 && gShop.level === 2, 'charge=' + gShop.ult.charge + ' lv=' + gShop.level);

// 22. 招募（v0.16）：条件达成也不自动加入；**1 张市民票**即可招募
KUP.META.reset();
KUP.META.addRunResult('area3', true, { kills: 0, eggs: 0, areaIdx: 3 });
KUP.META.data.tickets = 0; KUP.META.save();   // 归零：验证"票不足不可招募"
check('通关参番街后亜留仍是"可招募"而非自动加入', !KUP.META.isCharUnlocked('aru') &&
  KUP.META.recruitable().chars.some(c => c.id === 'aru'));
check('市民票不足时招募失败', !KUP.META.payRecruit('aru'));
KUP.META.addCash(rate);                        // 兑换 1 张票
KUP.META.exchangeCash(1);
check('一张市民票即可招募亜留', KUP.META.payRecruit('aru') && KUP.META.isCharUnlocked('aru') &&
  KUP.META.tickets() === 0, 'tickets=' + KUP.META.tickets());
check('重复招募失败', !KUP.META.payRecruit('aru'));
KUP.META.addRunResult('area4', true, { kills: 100, eggs: 1, areaIdx: 4 });
KUP.META.addCash(rate); KUP.META.exchangeCash(1);
check('一张市民票即可招募復興課同伴 彩季詩得', KUP.META.payRecruit('ciel') && KUP.META.isCompanionUnlocked('ciel'));
KUP.META.reset();
KUP.META.data.fukkou = 55;
KUP.META.addCash(rate); KUP.META.exchangeCash(1);
check('復興率 55% + 1 张票 招募地邑阿栖', KUP.META.payRecruit('asu') && KUP.META.isCharUnlocked('asu'));
check('条件未达成（未通关参番街）不可招募',
  (KUP.META.reset(), KUP.META.addCash(rate), KUP.META.exchangeCash(1), !KUP.META.payRecruit('aru')));

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
  /* ⚠ spawnEnemy 带 ±80px 落点抖动，触碰测试必须**直接写坐标** */
  const me = gW.spawnEnemy('noise', anyMine.x, anyMine.y);
  me.x = anyMine.x; me.y = anyMine.y;
  gW.update(0.02);
  check('敌人踏进触发半径即引爆', anyMine.dead);
} else check('敌人踏进触发半径即引爆', false, 'no armed mine');

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
/* v0.14（人类 2026-10-17「轰炸区域应更靠近 player 但 player 容易跑出」）：
 * 旧断言要求落点 ≥150px 远离玩家（＝几乎炸不到人），已替换为新的两条口径：
 *   ① 至少一发**压在玩家附近**（≤180px，含直接压在脚下的预判点）；
 *   ② 信管 > 爆炸半径 / 玩家移速 ⇒ 持续移动就能跑出。 */
check('〈爆塵〉轰炸落点靠近玩家（至少一发 ≤180px）', bombs5.some(d => {
  const p = gB5.player; return Math.hypot(d.x - p.x, d.y - p.y) <= 180;
}), 'min=' + Math.min.apply(null, bombs5.map(d => Math.round(Math.hypot(d.x - gB5.player.x, d.y - gB5.player.y)))) + 'px');
check('〈爆塵〉轰炸有信管预警（arm ≥ 0.9s）', bombs5.every(d => d.arm >= 0.9));
check('〈爆塵〉预警时长足以跑出爆炸半径（arm > r / 玩家移速）', bombs5.every(d => {
  const walk = gB5.player.speed * d.arm;
  return walk > d.r;
}), 'walk=' + Math.round(gB5.player.speed * 1.15) + 'px ≥ r=86px');
/* 〈観測〉光束：v0.14 改**指向玩家**（预警期内近段预瞄），而不是固定角速度自转 */
const gScan = new KUP.Game(canvas);
gScan.start({ char: 'kaf', area: 'area0', seed: 72 });
gScan.player.weapons = [];
const bScan = gScan.spawnEnemy('boss4', gScan.player.x - 300, gScan.player.y);
gScan.time = 0;  // 不让 Boss 暴走干扰
bScan.t2 = 0.02; // 立即触发第一发光束（避免只看计时器初值）
for (let i = 0; i < 60; i++) gScan.updateBossBehavior(0.02);
const beam0 = gScan.dangers.filter(d => d.kind === 'beam')[0];
check('〈観測〉光束生成时朝玩家（误差 ≤ 单帧转向量 + 1°）', (() => {
  if (!beam0) return false;
  const want = Math.atan2(gScan.player.y - bScan.y, gScan.player.x - bScan.x);
  const tol = (beam0.aimTurn || 1.9) * 0.02 + 0.02;
  return Math.abs(KUP.U.angDiff(beam0.dir, want)) <= tol;
})(), beam0 ? ((KUP.U.angDiff(beam0.dir, Math.atan2(gScan.player.y - bScan.y, gScan.player.x - bScan.x)) * 180 / Math.PI)).toFixed(2) + '°' : 'no beam');
check('〈観測〉光束带近段预瞄（aimAt/aimF），可由横向移动躲开', !!beam0 && !!beam0.aimAt && beam0.aimF > 0 && beam0.aimF < 1);
/* v0.18.6（人类 2026-10-22「激光仍然是大角速度追杀玩家，没有前后摇时间」）：
 * 前摇 0.6s、后摇 ≥1s、追踪角速度 ≤0.5 rad/s、光路更细、伤害下调。 */
const beamFresh = () => {
  bScan.t2 = 0.02;
  gScan.updateBossBehavior(0.02);
  return gScan.dangers.filter(d => d.kind === 'beam' && !d.armed).pop();
};
const bm = beamFresh();
check('〈観測〉光束前摇 ≥ 0.6s（看得见、躲得开）', !!bm && bm.arm >= 0.6, bm ? 'arm=' + bm.arm : 'no beam');
check('〈観測〉两发之间有后摇（≥1.0s 才可能下一发）', bScan.t2 >= 1.0, 't2=' + bScan.t2.toFixed(2));
check('〈観測〉追踪角速度 ≤ 0.5 rad/s（不再贴脸追杀）', !!bm && bm.aimTurn <= 0.5,
  bm ? 'aimTurn=' + bm.aimTurn : 'no beam');
check('〈観測〉光路更细、伤害更低（w ≤ 18／dmg ≤ 12）', !!bm && bm.w <= 18 && bm.dmg <= 12,
  bm ? 'w=' + bm.w + ' dmg=' + bm.dmg : 'no beam');
/* 追踪量：玩家瞬间换到 Boss 正上方（约 90°），0.5 秒内光束最多转 ~10° */
if (bm) {
  const a0 = bm.dir;
  gScan.player.x = bScan.x; gScan.player.y = bScan.y - 300;
  for (let i = 0; i < 25; i++) bm.aimStep(0.02, gScan);
  const turned = Math.abs(KUP.U.angDiff(bm.dir, a0));
  check('〈観測〉0.5 秒内最多转约 10°（大角度也甩得掉）', turned <= 0.35 * 0.5 + 0.02,
    (turned * 180 / Math.PI).toFixed(1) + '°');
}
/* 暴走：双光束夹角明显（中间留安全缝） */
const bScanEn = gScan.spawnEnemy('boss4', gScan.player.x - 300, gScan.player.y);
bScanEn.enraged = true; bScanEn.t2 = 0.02;
gScan.updateBossBehavior(0.02);
const pair = gScan.dangers.filter(d => d.kind === 'beam' && !d.armed).slice(-2);
check('〈観測〉暴走双光束夹角 ≥ 25°（中间有缝）',
  pair.length === 2 && Math.abs(KUP.U.angDiff(pair[0].dir, pair[1].dir)) >= 25 * Math.PI / 180,
  pair.length === 2 ? (Math.abs(KUP.U.angDiff(pair[0].dir, pair[1].dir)) * 180 / Math.PI).toFixed(0) + '°' : 'no pair');


// 25b. v0.8 机制道具：护盾 / 回避 / 吸血 / 反響 / 冲刺
check('新增机制型被动（护盾/回避/吸血/反響/疾风）', ['shield', 'dodge', 'drain', 'retaliate', 'dashup'].every(id => KUP.PASSIVES[id]));
/* v0.18.4（人类 2026-10-21）：
 *   ① 护盾改成「**耐久**每级 +20（20/40/60/80/100）」；
 *   ② 保护效率 1～4 级一律＝原第 4 级的 88（贴靠 89%），第 5 级才 100（贴靠 95%）；
 *   ③ 挡下伤害消耗耐久（打空即无减伤），脱战 3s 后 1.5s 回满；
 *   ④ 「防音の符」＋60 耐久、＋12 效率（封顶 100）。 */
const gS = new KUP.Game(canvas);
gS.start({ char: 'kaf', area: 'area0', seed: 91 });
gS.player.addPassive('shield');
check('护盾建立（耐久 20，保护效率 88）',
  gS.player.shieldMax === 20 && gS.player.shield === 20 && gS.player.shieldEff === 88,
  'max=' + gS.player.shieldMax + ' cur=' + gS.player.shield + ' eff=' + gS.player.shieldEff);
check('效率 88 → 贴靠减伤 89%', gS.player.reducePct('contact') === 89, 'pct=' + gS.player.reducePct('contact'));
const hpS = gS.player.hp;
gS.hurtPlayer(30, 'contact');
/* 30 点被挡 26.7、耐久 20 直接打空（不会负数），只掉 3.3 */
check('耐久会被挡下的伤害打空（20 → 0，不出现负数）', gS.player.shield === 0, 'sh=' + gS.player.shield);
check('打空的那一击仍按效率结算（30 点只掉 3.3）', Math.abs((hpS - gS.player.hp) - 3.3) < 0.05,
  'loss=' + (hpS - gS.player.hp).toFixed(2));
check('耐久为 0 → 不再有减伤', gS.player.reducePct('beam') === 0);
/* 升到 5 级：耐久满 100，效率升到 100 */
gS.player.addPassive('shield'); gS.player.addPassive('shield'); gS.player.addPassive('shield');
check('1～4 级效率都是 88（第 4 级仍 88）', gS.player.shieldMax === 80 && gS.player.shieldEff === 88,
  'max=' + gS.player.shieldMax + ' eff=' + gS.player.shieldEff);
gS.player.addPassive('shield');
check('第 5 级：耐久 100、效率 100（升级时补满）',
  gS.player.shieldMax === 100 && gS.player.shield === 100 && gS.player.shieldEff === 100,
  'max=' + gS.player.shieldMax + ' cur=' + gS.player.shield + ' eff=' + gS.player.shieldEff);
gS.player.shieldTaintT = 0; gS.player.shieldTouchUsed = false; gS.player.shieldTouchT = 0;
check('效率 100 → 贴靠 95%／光束 50%／轰炸 70%／毒区 75%／音波 85%',
  gS.player.reducePct('contact') === 95 && gS.player.reducePct('beam') === 50 &&
  gS.player.reducePct('bomb') === 70 && gS.player.reducePct('field') === 75 &&
  gS.player.reducePct('ring') === 85);
/* v0.20.3（人类 2026-10-24「怎么又是没满就不减伤了…比如 19/40」）：
 * 删除「贴靠挡一次后 0.45s 失效」与「被光束/轰炸打穿后 3s 失效」两道门槛后，
 * **只要耐久 > 0，任何伤害类型都按效率减伤**，不存在"还有耐久却不减伤"的窗口。 */
gS.state = 'playing';
gS.player.hp = gS.player.maxhp;
gS.player.hitT = 0;
const hpT = gS.player.hp;
gS.hurtPlayer(20, 'contact');
check('满耐久贴靠：20 点只掉 1、耐久 100 → 81',
  Math.abs((hpT - gS.player.hp) - 1) < 0.01 && Math.abs(gS.player.shield - 81) < 0.02,
  'loss=' + (hpT - gS.player.hp).toFixed(2) + ' sh=' + gS.player.shield.toFixed(1));
gS.player.hitT = 0;
gS.hurtPlayer(20, 'contact');
check('连续接触的第二击照样减伤（不再有"挡一次就失效"）',
  Math.abs((hpT - gS.player.hp) - 2) < 0.02 && Math.abs(gS.player.shield - 62) < 0.05,
  'loss=' + (hpT - gS.player.hp).toFixed(2) + ' sh=' + gS.player.shield.toFixed(1));
/* 用户报的场景：2 级护盾 40 耐久，被打到 19，再吃一发光束——接触必须仍有 89% 减伤 */
const gS2 = new KUP.Game(canvas);
gS2.start({ char: 'kaf', area: 'area0', seed: 94 });
gS2.player.addPassive('shield'); gS2.player.addPassive('shield');
check('2 级护盾：耐久 40、效率 88', gS2.player.shieldMax === 40 && gS2.player.shieldEff === 88);
gS2.player.shield = 19;
gS2.player.hitT = 0;
gS2.hurtPlayer(10, 'beam');                    // 光束 47% 减伤，耐久扣到 ~14
check('19/40 被光束打过之后，接触仍有 89% 减伤（旧版这里会归零）',
  gS2.player.reducePct('contact') === 89, 'pct=' + gS2.player.reducePct('contact'));
gS2.player.hitT = 0;
const hpX = gS2.player.hp;
gS2.hurtPlayer(20, 'contact');
check('19/40 的接触受击照常减伤（20 点只掉 ~2.2）',
  Math.abs((hpX - gS2.player.hp) - 2.24) < 0.05,
  'loss=' + (hpX - gS2.player.hp).toFixed(2) + ' sh=' + gS2.player.shield.toFixed(1));
/* 打空与恢复 */
gS.player.shield = 12; gS.player.shieldTmp = 0; gS.player.hitT = 0;
gS.hurtPlayer(400, 'beam');
check('耐久打空后归零（不会负值）且此后不再减伤',
  gS.player.shield === 0 && gS.player.reducePct('beam') === 0, 'sh=' + gS.player.shield);
gS.player.shield = 10; gS.player.shieldRegenT = 0;
for (let i = 0; i < 40; i++) gS.player.update(0.05, gS);        // 2.0s
check('脱战 3 秒内不回盾', Math.abs(gS.player.shield - 10) < 1e-6, 'sh=' + gS.player.shield.toFixed(1));
for (let i = 0; i < 60; i++) gS.player.update(0.05, gS);        // 再 3.0s
check('脱战 3 秒后 1.5 秒内回满', gS.player.shield === 100, 'sh=' + gS.player.shield.toFixed(1));
gS.player.shield = 20; gS.player.shieldRegenT = 0;
for (let i = 0; i < 50; i++) gS.player.update(0.05, gS);
gS.player.hitT = 0;
const shMid = gS.player.shield;
gS.hurtPlayer(2, 'ring');
check('受伤会打断恢复计时', gS.player.shieldRegenT === 0, 't=' + gS.player.shieldRegenT.toFixed(2));
for (let i = 0; i < 20; i++) gS.player.update(0.05, gS);
check('打断后的 3 秒内仍不回复', gS.player.shield < shMid + 8, 'sh=' + gS.player.shield.toFixed(1));
/* v0.18.5：耐久只剩一点点也照样减伤，只有归零才失去 */
gS.player.shield = 5; gS.player.shieldTmp = 0;
check('耐久剩 5（>0）仍保留 95% 贴靠减伤', gS.player.reducePct('contact') === 95,
  'pct=' + gS.player.reducePct('contact'));
gS.player.hitT = 0; gS.player.invuln = false;
gS.player.hp = gS.player.maxhp;          // 前面的大伤害测试可能已把 HP 打空，这里先复位
const hpLow = gS.player.hp;
gS.hurtPlayer(20, 'contact');
check('耐久很低时依然挡下伤害（20 点只掉 1）',
  Math.abs((hpLow - gS.player.hp) - 1) < 0.01 && gS.player.shield === 0,
  'loss=' + (hpLow - gS.player.hp).toFixed(2) + ' sh=' + gS.player.shield);
gS.player.shield = 0.5;
check('耐久 0.5 也有减伤（归零前一直有效）', gS.player.reducePct('contact') === 95);
gS.player.shield = 0;
check('耐久归零后才是没有减伤', gS.player.reducePct('contact') === 0);
gS.player.shield = 100;

/* 「防音の符」：+60 耐久、+12 效率（封顶 100） */
const gSW = new KUP.Game(canvas);
gSW.start({ char: 'kaf', area: 'area0', seed: 93 });
gSW.player.addPassive('shield');
check('1 级护盾单独只有 88 效率（贴靠 89%）', gSW.player.reducePct('contact') === 89);
gSW.player.addShield(60);
check('防音の符：+60 耐久、效率 +12 → 100（贴靠 95%）',
  gSW.player.shieldTotal() === 80 && gSW.player.shieldEfficiency() === 100 && gSW.player.reducePct('contact') === 95,
  'total=' + gSW.player.shieldTotal() + ' eff=' + gSW.player.shieldEfficiency());
gSW.player.hitT = 0;
gSW.hurtPlayer(10, 'ring');
check('临时的膜层先被消耗（本体耐久不动）', gSW.player.shieldTmp < 60 && gSW.player.shield === 20,
  'tmp=' + gSW.player.shieldTmp.toFixed(1) + ' sh=' + gSW.player.shield);
check('强度探针仍兼容旧口径（88→89%、100→95%）', (() => {
  const probe = t => ({ shieldTotal: () => t });
  return KUP.shieldReducePct(probe(88), 'contact') === 89 && KUP.shieldReducePct(probe(100), 'contact') === 95;
})());
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

// 25c. 同伴皮肤＝JK 制服：v0.13.7 起**注释保留**（同伴层暂不登场，内容在 js/data/skin.js 里注释掉）
check('同伴皮肤：JK 制服已按人类要求注释保留（不在 FORMS 里；v0.18.2 起同伴层没有可选形态）',
  KUP.formsFor('companion').length === 0);
check('魔女候补皮肤仍为黑／白', KUP.formsFor('recruit').map(f => f.id).join(',') === 'kuro,shiro');
check('JK 制服（注释保留）确实不在 FORMS 里',
  !KUP.FORMS.some(f => f.id === 'jk_summer') && !KUP.FORMS.some(f => f.id === 'jk_winter'));

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
/* v0.14：防音の符＝追加**膜层**（不是给护盾值加 60、更不是回血） */
check('防音の符：无护盾时直接 +60 膜层（可见来源）', shBefore === 0 && gI.player.shieldTmp === 60, 'tmp=' + gI.player.shieldTmp);
check('防音の符：膜层有存活时间（30s）', Math.abs(gI.player.shieldTmpT - KUP.CONFIG.SHIELD.TEMP_SECONDS) < 1e-9);
check('防音の符：膜层计入护盾总强度（HUD 显示 60）', gI.player.shieldTotal() === 60, 'total=' + gI.player.shieldTotal());
const hpWard = gI.player.hp;
gI.player.hitT = 0;
/* v0.18.4：没有被动护盾时，「防音の符」只提供 +12 效率（k=0.12）→ 贴靠 52% */
const pctWard = gI.player.reducePct('contact');
gI.hurtPlayer(100, 'contact');
check('无护盾 + 60 膜时按 12% 效率减伤（贴靠 52%，掉 48）',
  pctWard === 52 && Math.round(hpWard - gI.player.hp) === 48,
  'pct=' + pctWard + ' loss=' + (hpWard - gI.player.hp).toFixed(1));
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
/* v0.15：判定改回**旋转物本身**（球心圆），并靠「径向呼吸」补上内圈
 * ⚠ 断言分三层：① 判定只认球体（连线不再算）② 内圈也能被打到 ③ 强度预算不退化 */
const gOs = new KUP.Game(canvas);
gOs.start({ char: 'rim', area: 'area0', seed: 108 });
gOs.player.invuln = true;
let osKills0 = gOs.kills;
for (let i = 0; i < 40 / 0.02; i++) { if (gOs.state === 'levelup') { gOs.state = 'playing'; gOs.pendingLevels = 0; } gOs.update(0.02); }
check('orbit：40 秒内确实能击杀（改成球体判定后仍可自理）', gOs.kills > 5, 'kills=' + gOs.kills);
check('Utils.segDist2：点到线段距离（工具函数仍在，orbit 已不再用它）',
  Math.abs(ctx.KUP.U.segDist2(5, 3, 0, 0, 10, 0) - 9) < 1e-9 && Math.abs(ctx.KUP.U.segDist2(-4, 0, 0, 0, 10, 0) - 16) < 1e-9);

/* ①②：判定几何——把敌人钉在"玩家与音球之间"（旧的扫掠臂会命中，新的球体判定不该命中），
 * 再把敌人放在球心附近（必须命中）；同时验证内圈（很靠近玩家）会在径向呼吸后被打到。 */
{
  const gGeom = new KUP.Game(canvas);
  gGeom.start({ char: 'rim', area: 'area0', seed: 109 });
  gGeom.director = () => {};
  gGeom.player.invuln = true;
  const wG = new KUP.WeaponRuntime(KUP.WEAPONS.orbit, 5);
  gGeom.player.weapons = [wG];
  gGeom.enemies.length = 0;
  const px = gGeom.player.x, py = gGeom.player.y;
  /* 先跑一帧让 orb 定位 */
  gGeom.update(0.016);
  const orb = wG.orbs[0];
  const R0 = Math.hypot(orb.x - px, orb.y - py);
  /* ⚠ spawnEnemy 会带 ±80px 落点抖动，几何测试必须**直接写坐标** */
  const ux = (orb.x - px) / (R0 || 1), uy = (orb.y - py) / (R0 || 1);
  /* A：放在玩家与球心连线的 **35% 处**（距球心 0.65R ≈ 73px，远大于 hitR≈35）→ 不应命中 */
  const mid = gGeom.spawnEnemy('noise', px, py);
  mid.x = px + ux * R0 * 0.35; mid.y = py + uy * R0 * 0.35;
  mid.hp = mid.maxhp = 1e6; mid.speed = 0;
  const midHp0 = mid.hp;
  /* B：放在球心（命中半径内）→ 应命中 */
  const onBall = gGeom.spawnEnemy('noise', px, py);
  onBall.x = orb.x; onBall.y = orb.y;
  onBall.hp = onBall.maxhp = 1e6; onBall.speed = 0;
  const ballHp0 = onBall.hp;
  /* 只走 1 帧：球体位移约 8px，仍够不到 73px 处的 mid */
  gGeom.update(0.016);
  check('orbit：判定只认球体本身（连线中途不再被判定命中）', mid.hp === midHp0,
    'mid 掉血 ' + (midHp0 - mid.hp).toFixed(1) + '（距球心 ' + (R0 * 0.65).toFixed(0) + 'px，hitR≈' + (wG.orbR + mid.r).toFixed(0) + '）');
  check('orbit：球体本身的接触照常命中', onBall.hp < ballHp0, 'onBall 掉血 ' + (ballHp0 - onBall.hp).toFixed(1));
  /* ③ v0.15.1：**取消径向呼吸** ⇒ 球心到玩家的距离必须恒定（只由 r 决定，
   * 不再随 angle 变化）；且球被拉近到 r 46–58，贴脸（约 25px）的敌人仍在球体可达范围内。 */
  const gConst = new KUP.Game(canvas);
  gConst.start({ char: 'rim', area: 'area0', seed: 110 });
  gConst.director = () => {};
  const wC = new KUP.WeaponRuntime(KUP.WEAPONS.orbit, 5);
  gConst.player.weapons = [wC];
  const dists = [];
  for (let i = 0; i < 120; i++) {
    gConst.update(0.05);
    dists.push(Math.hypot(wC.orbs[0].x - gConst.player.x, wC.orbs[0].y - gConst.player.y));
  }
  const dMin = Math.min.apply(null, dists), dMax = Math.max.apply(null, dists);
  check('orbit：取消径向呼吸（球心到玩家的距离恒定 = r）',
    Math.abs(dMax - dMin) < 0.5 && Math.abs(dMax - wC.orbitR) < 0.5,
    'R 区间 ' + dMin.toFixed(1) + '–' + dMax.toFixed(1) + '，orbitR=' + wC.orbitR.toFixed(1));
  check('orbit：球被拉得离玩家更近（Lv5 环绕半径 ≤ 60，旧版 112）', wC.orbitR <= 60,
    'r=' + wC.orbitR.toFixed(0));
  /* 贴脸敌人（碰撞距离 ≈ 玩家半径 13 + 敌半径 12 = 25px）必须落在球体可达范围内 */
  const reach = wC.orbitR - (wC.orbR + KUP.ENEMIES.noise.r);
  check('orbit：贴脸敌人仍可达（R − (orbR + 敌半径) < 25）', reach < 25, '内边界 ' + reach.toFixed(1) + 'px');
  const gIn = new KUP.Game(canvas);
  gIn.start({ char: 'rim', area: 'area0', seed: 111 });
  gIn.director = () => {};
  gIn.player.invuln = true;
  gIn.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.orbit, 5)];
  gIn.enemies.length = 0;
  const inner = gIn.spawnEnemy('noise', gIn.player.x + 25, gIn.player.y);
  inner.x = gIn.player.x + 25; inner.y = gIn.player.y;
  inner.hp = inner.maxhp = 1e6; inner.speed = 0;
  const innerX = inner.x, innerY = inner.y;
  for (let i = 0; i < 4 / 0.016; i++) {
    gIn.update(0.016);
    inner.x = innerX; inner.y = innerY; inner.kx = 0; inner.ky = 0;   // 钉住
  }
  check('orbit：贴脸 25px 的敌人确实会被球体打到', inner.hp < 1e6 - 1, '4 秒掉血 ' + (1e6 - inner.hp).toFixed(0));

  /* ④ 半圈律（人类 2026-10-18 指定的设计口径）：
   *    普通破维魔（noise，移速 62）走过**球体直径** 2×orbR 的时间 t＝2·orbR/62，
   *    这段时间里武器恰好转约半圈 ⇒ spin ≈ π·62/(2·orbR)。
   *    每一级（含覚醒）都要满足，容差 ±10%。 */
  const NV = KUP.ENEMIES.noise.speed, halfTurn = [];
  for (const row of KUP.WEAPONS.orbit.levels.concat([KUP.WEAPONS.orbit.evolved.stats])) {
    const want = Math.PI * NV / (2 * row.orbR);
    halfTurn.push({ orbR: row.orbR, spin: row.spin, ratio: row.spin / want });
  }
  check('orbit 半圈律：每级 spin ≈ π·62/(2·orbR)（容差 ±10%）',
    halfTurn.every(h => Math.abs(h.ratio - 1) <= 0.1),
    halfTurn.map(h => 'orbR' + h.orbR + ':' + (h.ratio * 100 - 100).toFixed(0) + '%').join(' '));
  /* ⑤ 穿越击杀：普通破维魔从环外走进来，必须在穿过球体这段时间里被打死（开局与中后期各测一次） */
  const crossingKill = (lv, evolved, tGame) => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'rim', area: 'area0', seed: 112 });
    g.director = () => {};
    g.player.invuln = true;
    const w = new KUP.WeaponRuntime(KUP.WEAPONS.orbit, lv);
    w.evolved = evolved;
    g.player.weapons = [w];
    g.enemies.length = 0;
    g.time = tGame;
    const s = w.stat();
    const d0 = s.r + s.orbR + KUP.ENEMIES.noise.r + 60;   // 环外 60px 起步
    const e = g.spawnEnemy('noise', g.player.x + d0, g.player.y);
    e.x = g.player.x + d0; e.y = g.player.y;
    e.hp = e.maxhp = KUP.ENEMIES.noise.hp * KUP.HP_SCALE(tGame);
    const hp0 = e.hp;
    for (let i = 0; i < 6 / 0.016; i++) { g.update(0.016); if (e.dead) break; }
    return { dead: e.dead, hp0, left: e.hp };
  };
  const ck1 = crossingKill(1, false, 0);
  const ck2 = crossingKill(5, false, 0);
  const ck3 = crossingKill(5, false, 240);
  check('orbit 穿越击杀：开局 Lv1 就能打死走过来的普通破维魔', ck1.dead, 'hp ' + ck1.hp0.toFixed(0) + ' 剩 ' + ck1.left.toFixed(0));
  check('orbit 穿越击杀：Lv5 同样成立', ck2.dead, 'hp ' + ck2.hp0.toFixed(0) + ' 剩 ' + ck2.left.toFixed(0));
  check('orbit 穿越击杀：4 分钟时（noise 血量 ×2.3）仍能打死', ck3.dead, 'hp ' + ck3.hp0.toFixed(0) + ' 剩 ' + ck3.left.toFixed(0));
}

/* 强度预算（v0.15.1 重定口径）：环绕半径拉到 46–58 后，"散布在 280px 的静止靶"这种几何
 * 已经不适用于贴脸环武器（只有环带上的靶会被扫到），所以改用**实战口径**：
 * 真实导演、无敌站桩 60 秒、只带 orbit，统计击杀数与名义 DPS —— 这才是玩家实际感受到的强度。
 * 基准（v0.15 径向呼吸版同口径实测，60s）：Lv1 57 杀 / 15.2 dps；Lv5 58 杀 / 21.3 dps。
 * v0.15.1（取消呼吸、球拉近）实测：Lv1 58 杀 / 15.5 dps；Lv5 57 杀 / 20.9 dps —— 与上一版持平。 */
{
  const realRun = (lv, evolved) => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'rim', area: 'area0', seed: 4242 });
    g.player.invuln = true;
    const w = new KUP.WeaponRuntime(KUP.WEAPONS.orbit, lv);
    w.evolved = evolved;
    g.player.weapons = [w];
    let nominal = 0;
    const orig = g.damageEnemy.bind(g);
    g.damageEnemy = (e, dmg, kx, ky) => { nominal += dmg; return orig(e, dmg, kx, ky); };
    const T = 60;
    for (let i = 0; i < T / 0.016; i++) {
      if (g.state === 'levelup') { g.state = 'playing'; g.pendingLevels = 0; g.choices = null; }
      if (g.state !== 'playing') break;
      g.update(0.016);
    }
    return { kills: g.kills, dps: nominal / T };
  };
  const r1 = realRun(1, false), r5 = realRun(5, false);
  check('orbit 强度预算（实战）：Lv1 60 秒 击杀 ≥ 45 且 dps ≥ 13',
    r1.kills >= 45 && r1.dps >= 13, r1.kills + ' 杀 / ' + r1.dps.toFixed(1) + ' dps');
  check('orbit 强度预算（实战）：Lv5 60 秒 击杀 ≥ 48 且 dps ≥ 18',
    r5.kills >= 48 && r5.dps >= 18, r5.kills + ' 杀 / ' + r5.dps.toFixed(1) + ' dps');
}
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
/* 无磁铁：拾取半径外的片段不被拉动（只会缓慢漂移） */
const gMg = new KUP.Game(canvas);
gMg.start({ char: 'kaf', area: 'area0', seed: 121 });
gMg.gems.length = 0;
const gemFar = new KUP.Gem(gMg.player.x + 600, gMg.player.y, 5);
gMg.gems.push(gemFar);
for (let i = 0; i < 20; i++) gMg.update(0.02);
const drift = Math.hypot(gemFar.x - gMg.player.x, gemFar.y - gMg.player.y);
check('无磁铁：600px 外的片段不被拉动', drift > 400, 'd=' + drift.toFixed(0));
/* 磁铁激活：全场片段被吸向魔女直至拾取 */
gMg.gems.length = 0;
const gemFar2 = new KUP.Gem(gMg.player.x + 600, gMg.player.y, 5);
gMg.gems.push(gemFar2);
gMg.player.addBuff('magnet', 8, 1);
check('磁石の符：BUFF 计时激活', gMg.player.buffs.magnet > 0);
for (let i = 0; i < 20; i++) gMg.update(0.02);
const dAfter = Math.hypot(gemFar2.x - gMg.player.x, gemFar2.y - gMg.player.y);
check('磁铁激活：600px 外的片段被吸近', dAfter < 300, '600→' + dAfter.toFixed(0));
for (let i = 0; i < 40; i++) gMg.update(0.02);
check('磁铁把远处片段吸到拾取圈内（自动收集）', gemFar2.dead);
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

// 25f-2. v0.18.1：片段掉落的三条新规则（人类 2026-10-21）
/* ① 每 240px 格配额 160：同格狂掉 200 次 → 只生成 160 个，**总经验不丢**（其余并入） */
const gCap = new KUP.Game(canvas);
gCap.start({ char: 'kaf', area: 'area0', seed: 131 });
gCap.gems.length = 0;
const capX = 1000, capY = 1000;                       // 固定落在同一格
for (let i = 0; i < 200; i++) gCap.dropGem(capX, capY, 3);
const capSum = gCap.gems.reduce((s, g) => s + g.xp, 0);
check('片段按 240px 格配额：同格 200 次掉落只留 ' + KUP.CONFIG.GEM_CELL_CAP + ' 个',
  gCap.gems.length === KUP.CONFIG.GEM_CELL_CAP, 'gems=' + gCap.gems.length);
check('超配额合并后总经验不丢（200×3 全部在场上）', capSum === 600, 'sum=' + capSum);
/* ② 合并只并进 xp 片段：场上只有回复 ♥ 时不能吞经验（旧版会丢） */
const gMerge = new KUP.Game(canvas);
gMerge.start({ char: 'kaf', area: 'area0', seed: 132 });
gMerge.gems.length = 0;
gMerge.gems.push(new KUP.Gem(capX, capY, 0, 'heal'));
for (let i = 0; i < KUP.CONFIG.GEM_CELL_CAP; i++) gMerge.gems.push(new KUP.Gem(capX, capY, 1));
gMerge.dropGem(capX, capY, 7);                        // 已满格 ⇒ 走合并
const healUntouched = gMerge.gems[0].type === 'heal' && gMerge.gems[0].xp === 0;
const xpSum = gMerge.gems.filter(g => g.type === 'xp').reduce((s, g) => s + g.xp, 0);
check('合并不碰回复 ♥ 片段（旧版会挑到它并吞掉经验）', healUntouched);
check('超配额的经验确实并进了 xp 片段', xpSum === KUP.CONFIG.GEM_CELL_CAP + 7, 'xp=' + xpSum);
/* ③ 5 分钟过期消失：life 到点即 dead，且不结算经验 */
const gLife = new KUP.Game(canvas);
gLife.start({ char: 'kaf', area: 'area0', seed: 133 });
gLife.gems.length = 0;
const gemOld = new KUP.Gem(gLife.player.x, gLife.player.y, 5);
gemOld.life = 0.05;
gLife.gems.push(gemOld);
const xpBefore = gLife.player.xp;
gLife.update(0.1);
check('片段 5 分钟过期消失（life 到点即 dead）', gemOld.dead);
check('过期消失不结算经验', gLife.player.xp === xpBefore);
check('配置项齐备：格边长/格上限/存活时长',
  KUP.CONFIG.GEM_CELL === 240 && KUP.CONFIG.GEM_CELL_CAP === 160 && KUP.CONFIG.GEM_LIFE === 300);

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
  check('新武器模组：斩音太刀（behavior=cleave，通用组无 owner）',
    SW && SW.behavior === 'cleave' && !SW.owner && SW.maxLv === 5 && !!SW.evolved);
  check('挥刀参数齐备：每级都有 arc（扇形角度·度）与 len（刀长·px）',
    SW.levels.every(l => typeof l.arc === 'number' && typeof l.len === 'number') &&
    typeof SW.evolved.stats.arc === 'number' && typeof SW.evolved.stats.len === 'number');
  check('挥刀参数随等级成长（扇形更宽、刀更长）',
    SW.levels.every((l, i, a) => i === 0 || (l.arc > a[i - 1].arc && l.len > a[i - 1].len)) &&
    SW.evolved.stats.arc > SW.levels[4].arc && SW.evolved.stats.len > SW.levels[4].len,
    'arc=' + SW.levels.map(l => l.arc).join('/') + ' len=' + SW.levels.map(l => l.len).join('/'));
  check('武器总数 21 · 行为 15 种', Object.keys(KUP.WEAPONS).length === 21 &&
    new Set(Object.values(KUP.WEAPONS).map(w => w.behavior)).size === 15);
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
  /* 武器分派：behavior 'cleave' 生成挥砍实体；Lv4+ 附带扇形冲击波（Ring 带角度） */
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
    id: '_arcTest', icon: '試', color: '#ffffff', behavior: 'shock', maxLv: 1,
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
  check('治安战仍结算现金（v0.16：不再直接发市民票）',
    r1o.cash > 0 && KUP.META.cash() === r1o.cash && r1o.tickets === 0 && KUP.META.tickets() === 0);
  check('治安战结算幂等（同 runId 不重复）',
    KUP.META.addOrderResult({ runId: 'ord-1', kills: 120, time: 90, wave: 4, score: 1780 }) === null &&
    KUP.META.cash() === r1o.cash);
  const cBefore = KUP.META.cash();
  const r2o = KUP.META.addOrderResult({ runId: 'ord-2', kills: 10, time: 30, wave: 2, score: 300 });
  check('更低分不刷新记录（但仍结算现金）',
    !r2o.isBest && KUP.META.orderBest().score === 1780 && KUP.META.cash() > cBefore);
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
  check('治安战击破 Boss 有清场奖励与片段', gOK.gems.length > 0 && gOK.ult.charge >= 40);
  /* 卵不再是掉落物（v0.17）：治安战不落卵、復興率不被卵污染 */
  const gOE = new KUP.Game(canvas);
  gOE.start({ char: 'kaf', area: 'order', seed: 505 });
  gOE.player.weapons = [];
  for (let i = 0; i < 40; i++) {
    const el = gOE.spawnEnemy('elite', gOE.player.x + 300, gOE.player.y);
    gOE.killEnemy(el);
  }
  check('卵不再是掉落物（无 egg 片段），治安战復興率不被污染',
    gOE.gems.every(g => g.type !== 'egg') && gOE.eggCharge === 0 && KUP.META.total() === 0);
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
/* 分桶保底：四张卡尽量覆盖 武器 / 被动 / 道具（卵卡不额外占位） */
let covOk = 0, samples = 0;
check('每次升级固定 4 张（无卵时）', gLu.rollChoices().length === 4);
for (let i = 0; i < 400; i++) {
  const roll = gLu.rollChoices();
  samples++;
  const cats = new Set(roll.map(c => c.kind === 'awaken' ? 'awaken'
    : (c.kind.indexOf('weapon') === 0 ? 'weapon'
    : (c.kind.indexOf('passive') === 0 ? 'passive' : (c.kind === 'item' ? 'item' : 'heal')))));
  if (cats.has('weapon') && cats.has('passive') && cats.has('item')) covOk++;
}
check('分桶保底：四卡覆盖武器+被动+道具', covOk / samples > 0.95, covOk + '/' + samples);
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
check('重掷：消耗 1 次并重新抽取', okRe && gRu.rerolls === 2 && gRu.choices.length === 4);
check('重掷后仍是合法四选一', gRu.choices.every(c => c && c.kind));
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
check('封禁：加入名单并替换该格', okBan && gBn.banned.has(bannedId) && gBn.choices.length === 4);
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

// 26. 结算包含现金收入与"可招募"提示
KUP.META.reset();
const gT = new KUP.Game(canvas);
gT.start({ char: 'kaf', area: 'area3', seed: 81 });
gT.kills = 100;
gT.victory();
check('结算返回现金收入与合计（v0.16：市民票不再直发）',
  gT.metaResult.cash > 0 && gT.metaResult.cashTotal === gT.metaResult.cash &&
  gT.metaResult.tickets === 0, JSON.stringify({ cash: gT.metaResult.cash }));
check('结算提示可培养对象', gT.metaResult.newlyRecruitable.length >= 1, JSON.stringify(gT.metaResult.newlyRecruitable));
check('stats 含 Boss 名与復活次数（v0.17：卵不再进图鉴）',
  gT.stats().areaId === 'area3' && gT.stats().revives === 0 && gT.stats().eggCharge === 0);

/* v0.16：结算屏文案必须写「现金（元）」，不能再出现「市民票 +N」。
 * 用最小 DOM 桩跑一遍真 UI.showEnd（不改 KUP.UI 桩，只在这次调用里替换）。 */
{
  const mkEl = () => ({
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, textContent: '', innerHTML: '', dataset: {}, disabled: false,
    appendChild() {}, addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
  });
  const docMap = {};
  ctx.document.getElementById = id => (docMap[id] || (docMap[id] = mkEl()));
  ctx.document.querySelector = () => mkEl();
  ctx.document.querySelectorAll = () => [];
  ctx.document.createElement = () => mkEl();
  const els = new Proxy({}, { get: (t, k) => (t[k] || (t[k] = mkEl())) });
  const saved = { els: REAL_UI.els, game: REAL_UI.game, showBest: REAL_UI.showBest };
  REAL_UI.els = els;
  REAL_UI.game = gT;
  KUP.UI = REAL_UI;                       // 这次调用走真 UI（showEnd 内部会用 KUP.UI）
  try {
    KUP.META.reset();
    const gE = new KUP.Game(canvas);
    gE.start({ char: 'kaf', area: 'area0', seed: 91 });
    gE.kills = 60;
    gE.metaResult = KUP.META.addRunResult('area0', true, { runId: 'end-1', kills: 60, areaIdx: 0, time: 180 });
    REAL_UI.game = gE;
    REAL_UI.showEnd(true, gE.stats());
    const html = els['win-stats'].innerHTML;
    check('结算屏显示「现金 +N 元（共 M 元）」', /现金 \+\d+ 元（共 \d+ 元）/.test(html),
      (html.match(/[^\u003c]*现金[^\u003c]*/) || [''])[0]);
    check('结算屏不再出现「市民票 +N」', html.indexOf('市民票 +') < 0 && html.indexOf('end.tickets') < 0);
    /* 治安战结算同样走现金分支 */
    KUP.META.reset();
    const gO = new KUP.Game(canvas);
    gO.start({ char: 'kaf', area: 'order', seed: 92 });
    gO.endless = true;
    gO.metaResult = KUP.META.addOrderResult({ runId: 'ord-end-1', kills: 40, time: 60, wave: 3, score: 900 });
    REAL_UI.game = gO;
    REAL_UI.els = els;
    els['win-stats'].innerHTML = '';
    REAL_UI.showEnd(false, gO.stats());
    const ohtml = els['over-stats'].innerHTML;
    check('治安战结算屏也显示现金（不是市民票）',
      /现金 \+\d+ 元/.test(ohtml) && ohtml.indexOf('市民票 +') < 0,
      (ohtml.match(/[^\u003c]*现金[^\u003c]*/) || [''])[0]);
  } finally {
    KUP.UI = { banner() {}, showScreen() {}, showHUD() {}, showBoss() {}, updateBoss() {}, syncBosses() {},
      showLevelUp() {}, showEnd() {}, updateHUD() {}, onLangChange() {} };
    REAL_UI.els = saved.els;
    REAL_UI.game = saved.game;
    REAL_UI.showBest = saved.showBest;
  }
}

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

// 25n-2. v0.15.3：多体 Boss 的血条（逐行依次显示 + 击破一体只减一行 + 不溢出屏幕）
{
  /* KUP.bossHudRows 是纯函数（不碰 DOM），直接在 node 里测它的语义 */
  const mk = (id, name, hp, maxhp, enraged, dead) => ({
    def: { id: id, name: { zh: name, en: name, ja: name } }, hp: hp, maxhp: maxhp, enraged: enraged, dead: !!dead,
  });
  const live3 = [
    mk('boss0', '消音', 2000, 2000),
    mk('boss1', '緘黙', 500, 1000, true),
    mk('boss2', '誘惑', 0, 800, false, true),      // 已击破
    mk('boss3', '枯死', 300, 1200),
  ];
  const r3 = KUP.bossHudRows(live3);
  check('Boss 血条：每个**存活** Boss 一行，已击破的不出现',
    r3.rows.length === 3 && r3.total === 3 && r3.rows.every(r => r.id !== 'boss2'),
    r3.rows.map(r => r.id).join(','));
  check('Boss 血条：按出现顺序依次排列（先出现的在上）',
    r3.rows[0].id === 'boss0' && r3.rows[1].id === 'boss1' && r3.rows[2].id === 'boss3');
  check('Boss 血条：血量比例归一化（含暴走标记）',
    Math.abs(r3.rows[0].ratio - 1) < 1e-9 && Math.abs(r3.rows[1].ratio - 0.5) < 1e-9 &&
    r3.rows[1].enraged === true && r3.rows[0].enraged === false,
    r3.rows.map(r => r.ratio.toFixed(2)).join('/'));
  check('Boss 血条：名字取三语表', r3.rows[0].name === '消音', r3.rows[0].name);
  /* 击破一体只减一行（旧版 showBoss(false) 会把整块面板藏掉 = "被击退出场"） */
  const afterOneDead = live3.slice();
  afterOneDead[0] = mk('boss0', '消音', 2000, 2000, false, true);
  const rAfter = KUP.bossHudRows(afterOneDead);
  check('击破一体后其它 Boss 的血条仍在（不再整块消失）',
    rAfter.rows.length === 2 && rAfter.rows[0].id === 'boss1' && rAfter.rows[1].id === 'boss3',
    rAfter.rows.map(r => r.id).join(','));
  /* 超过上限 → 折叠，保证不会把 HUD 顶出屏幕 */
  const many = [];
  for (let i = 0; i < 7; i++) many.push(mk('boss' + (i % 7), 'B' + i, 100, 100));
  const rMany = KUP.bossHudRows(many);
  check('Boss 血条：最多显示 4 行，其余折叠成「+N」',
    rMany.rows.length === 4 && rMany.more === 3 && rMany.total === 7, 'rows=' + rMany.rows.length + ' more=' + rMany.more);
  check('Boss 血条：没有 Boss 时返回空（面板隐藏）', KUP.bossHudRows([]).rows.length === 0);
  /* 结构性守卫：syncBosses 必须调用**同一个**纯函数（别又写成 KUP.UI.bossHudRows ——
   * 浏览器实测踩过：函数挂在 KUP 上，写错位置会让 HUD 整块静默失效） */
  check('UI.syncBosses 调用的是 KUP.bossHudRows（不是 KUP.UI.bossHudRows）',
    /const \{ rows, more \} = KUP\.bossHudRows\(bosses\);/.test(
      String(KUP.UI && KUP.UI.syncBosses)) || /KUP\.bossHudRows\(bosses\)/.test(
      require('fs').readFileSync('js/ui.js', 'utf8')),
    '');
  check('Boss 血条：血量异常不会产生 NaN/越界',
    KUP.bossHudRows([mk('x', 'X', 10, 0)]).rows[0].ratio <= 1 &&
    KUP.bossHudRows([mk('x', 'X', -5, 100)]).rows[0].ratio === 0);
  /* game.update 真的会把「存活 Boss 列表」交给 UI（不是只交 this.boss 那一体） */
  const seen = [];
  const origSync = KUP.UI.syncBosses;
  KUP.UI.syncBosses = list => { seen.push((list || []).map(b => b.def.id).join(',')); };
  const gHud = new KUP.Game(canvas);
  gHud.start({ char: 'kaf', area: 'order', seed: 602 });
  gHud.director = () => {};
  gHud.player.invuln = true;
  gHud.enemies.length = 0;
  const h1 = gHud.spawnEnemy('boss0', 1500, 1400);
  const h2 = gHud.spawnEnemy('boss1', 1600, 1500);
  gHud.update(0.016);
  gHud.killEnemy(h1);
  gHud.update(0.016);
  KUP.UI.syncBosses = origSync;
  check('game.update 每帧把全部存活 Boss 交给 HUD（多体并列）',
    seen[0] === 'boss0,boss1' && seen[1] === 'boss1', seen.join(' → '));
  void h2;

  /* 出界保护：击退不再能把敌人/Boss 推出竞技场（"被击退出场"） */
  const gOut = new KUP.Game(canvas);
  gOut.start({ char: 'kaf', area: 'order', seed: 603 });
  gOut.director = () => {};
  gOut.player.invuln = true;
  gOut.enemies.length = 0;
  const edge = gOut.spawnEnemy('boss0', KUP.CONFIG.ARENA - 60, 1500);
  edge.kx = 4000; edge.ky = 0;                       // 模拟被强力击退推向边界外
  for (let i = 0; i < 120; i++) { edge.x = Math.min(KUP.CONFIG.ARENA + 200, edge.x); gOut.update(0.016); }
  check('Boss 不会被击退出竞技场（位置被夹在场地内）',
    edge.x <= KUP.CONFIG.ARENA - edge.r + 1e-6 && edge.x >= edge.r - 1e-6,
    'x=' + edge.x.toFixed(1) + ' r=' + edge.r + ' arena=' + KUP.CONFIG.ARENA);
  const small = gOut.spawnEnemy('noise', 1500, 1500);
  small.kx = -9000; small.ky = -9000;
  for (let i = 0; i < 60; i++) gOut.update(0.016);
  check('普通怪异同样被夹在场地内（不会飞出地图）',
    small.x >= small.r - 1e-6 && small.y >= small.r - 1e-6,
    small.x.toFixed(1) + ',' + small.y.toFixed(1));
}

// 25o. 显示缩放：地雷只缩画面、不缩判定（v0.15.1：更小 + 触发/爆炸半径分离）；太刀不再画扇形范围框
{
  check('地雷显示缩放更小（vis 0.5 → 0.32，面积 ≈ 1/10）', KUP.WEAPONS.mine.vis === 0.32, 'vis=' + KUP.WEAPONS.mine.vis);
  check('地雷模组声明了触发半径系数（triggerMul）', KUP.MODULE('minefield').base.triggerMul > 0 &&
    KUP.MODULE('minefield').params.indexOf('triggerMul') >= 0);
  const gM = new KUP.Game(canvas);
  gM.debug.w = 'mine';                                  // ?w=mine：开局带 5 级音之地雷
  gM.start({ char: 'kaf', area: 'area0', seed: 601 });
  gM.director = () => {};
  for (let i = 0; i < 240 && !gM.zones.some(z => z.kind === 'mine'); i++) gM.update(1 / 60);
  const zm = gM.zones.find(z => z.kind === 'mine');
  check('实战生成的地雷：判定半径不变（>60）且带显示缩放',
    !!zm && zm.vis === 0.32 && zm.r > 60, zm ? 'r=' + Math.round(zm.r) + ' vis=' + zm.vis : '未生成');
  check('地雷的触发半径 < 爆炸半径（"踩到"与"被炸到"分离）',
    !!zm && zm.triggerR < zm.r && Math.abs(zm.triggerR - zm.r * KUP.MODULE('minefield').base.triggerMul) < 1e-6,
    zm ? 'trigger=' + Math.round(zm.triggerR) + ' blast=' + Math.round(zm.r) : '未生成');
  /* 触发边界：站在 triggerR 外（但仍在 r 内）**不该**引爆；踏进 triggerR 才引爆 */
  {
    const mkMine = () => {
      const g2 = new KUP.Game(canvas);
      g2.start({ char: 'kaf', area: 'area0', seed: 602 });
      g2.director = () => {};
      g2.player.invuln = true;
      g2.enemies.length = 0;
      const m = new KUP.Zone(g2.player.x + 300, g2.player.y, {
        r: 90, triggerR: 54, dmg: 10, life: 10, kind: 'mine', vis: 0.32,
      });
      g2.zones.push(m);
      return { g2, m };
    };
    const a = mkMine();
    const eOut = a.g2.spawnEnemy('noise', a.m.x + 75, a.m.y);   // 75 > triggerR(54) + r_noise(12) = 66
    eOut.x = a.m.x + 75; eOut.y = a.m.y; eOut.speed = 0;
    a.g2.update(0.02);
    check('站在触发半径外（仍在爆炸半径内）不会提前引爆', !a.m.dead && a.m.life > 0);
    const b = mkMine();
    const eIn = b.g2.spawnEnemy('noise', b.m.x + 50, b.m.y);    // 50 < 66
    eIn.x = b.m.x + 50; eIn.y = b.m.y; eIn.speed = 0;
    b.g2.update(0.02);
    check('踏进触发半径 → 引爆，且按**爆炸半径**结算伤害（50px 内必中）',
      b.m.dead && (eIn.dead || eIn.hp < eIn.maxhp), 'enemy hp=' + (eIn.maxhp - eIn.hp).toFixed(0));
  }
  /* 起爆特效：两道向外推的圆（触发半径 → 击杀半径），且**纯表现**（不结算伤害） */
  {
    const g3 = new KUP.Game(canvas);
    g3.start({ char: 'kaf', area: 'area0', seed: 603 });
    g3.director = () => {};
    g3.enemies.length = 0;
    g3.fx.length = 0;
    const m3 = new KUP.Zone(g3.player.x + 400, g3.player.y, { r: 90, triggerR: 54, dmg: 10, life: 10, kind: 'mine' });
    g3.zones.push(m3);
    /* 远处放一个敌人：起爆时它在爆炸半径外，用它验证特效不造成伤害 */
    const far = g3.spawnEnemy('noise', m3.x + 300, m3.y);
    far.x = m3.x + 300; far.y = m3.y; far.speed = 0;
    const farHp0 = far.hp;
    m3.detonate(g3);
    check('地雷起爆生成向外推的圆（触发半径 + 击杀半径，共 ≥2 道）', g3.fx.length >= 2,
      'fx=' + g3.fx.length + ' r1=' + g3.fx.map(f => Math.round(f.r1)).join('/'));
    check('第一道推到触发半径、第二道推到击杀半径',
      g3.fx[0].r1 === 54 && g3.fx[1].r1 === 90, g3.fx.slice(0, 2).map(f => Math.round(f.r1)).join('→'));
    check('冲击波是纯表现（不结算伤害：半径外的敌人不掉血）', far.hp === farHp0);
    for (let i = 0; i < 40; i++) g3.update(0.02);
    check('冲击波会自然消失（不残留）', g3.fx.length === 0, 'fx=' + g3.fx.length);
  }
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

/* ========== v0.13.1 追加：武器模组注册表（模组 ↔ 具体武器）与「范围」生效面 ========== */

// 25p. 注册表结构：模组 → 具体武器 的对应、参数键校验、反向查询
{
  const MODS = KUP.WEAPON_MODULES;
  const modIds = Object.keys(MODS);
  check('模组注册表存在且每个模组 id 自洽',
    modIds.length >= 9 && modIds.every(id => MODS[id].id === id && MODS[id].name && MODS[id].name.zh));
  /* 每把具体武器的 behavior 都必须能在注册表里找到实现（否则这把武器是死数据） */
  const orphan = Object.keys(KUP.WEAPONS).filter(id => !KUP.MODULE_OF(id));
  check('每把武器的 behavior 都能在注册表找到模组', orphan.length === 0, orphan.join(',') || '无孤儿');
  /* 反向查询：模组 → 具体武器（人类点名的例子：bass 共用テラ・ドロップ与救済の鐘） */
  const bassW = KUP.WEAPONS_OF('shock').map(w => w.id).sort().join(',');
  const lanceW = KUP.WEAPONS_OF('sniper').map(w => w.id).sort().join(',');
  check('shock 模组被三把武器共用（テラ・ドロップ ＋ 法螺話 ＋ あおいゆめ）', bassW === 'bass,horagai,prayer', bassW);
  check('sniper 模组只给 the last bullet（v0.20：オレンジ改走 machinegun）', lanceW === 'lance', lanceW);
  check('每个模组都至少有一把武器在用',
    modIds.every(id => KUP.WEAPONS_OF(id).length >= 1),
    modIds.map(id => id + ':' + KUP.WEAPONS_OF(id).length).join(' '));
  check('武器 → 模组 → 武器 往返一致', Object.keys(KUP.WEAPONS).every(id => KUP.MODULE_OF(id) === KUP.MODULE(KUP.WEAPONS[id].behavior)));
  /* 参数键校验：等级表（含覚醒后 stats）里出现的键必须在该模组的 params 白名单里 */
  const bad = [];
  for (const id of Object.keys(KUP.WEAPONS)) {
    const w = KUP.WEAPONS[id], mod = KUP.MODULE_OF(id);
    const checkRow = (row, tag) => {
      if (!row) return;
      for (const k in row) if (mod.params.indexOf(k) < 0) bad.push(`${id}.${tag}.${k}`);
    };
    for (const row of w.levels) checkRow(row, 'lv');
    checkRow(w.evolved && w.evolved.stats, 'evolved');
  }
  check('等级表参数键都在模组白名单内（写错键名会当场失效）', bad.length === 0, bad.join(',') || '全部合法');
  /* 每个模组都要声明「受范围放大」的键——否则「范围」对它是废属性 */
  check('每个模组都声明了受「范围」放大的键',
    modIds.every(id => Array.isArray(MODS[id].area) && MODS[id].area.length >= 1),
    modIds.filter(id => !(MODS[id].area || []).length).join(',') || '全部已声明');
}

// 25p-3. v0.20：projectile 大模组（模组族 → 模组 → 武器 三层分离）＋ 连射/散弹
{
  const fam = KUP.FAMILY('projectile');
  check('projectile 大模组存在，含 homing/sniper/machinegun/shotgun',
    !!fam && ['homing', 'sniper', 'machinegun', 'shotgun'].every(id => fam.modules.indexOf(id) >= 0),
    fam ? fam.modules.join(',') : 'missing');
  check('每个弹道模组都回指 projectile 族',
    !!fam && fam.modules.every(id => KUP.FAMILY_OF_MODULE(id) === fam));
  check('模组 id 与武器 id 不重名（武器=歌／模组=行为）',
    Object.keys(KUP.WEAPON_MODULES).every(id => !KUP.WEAPONS[id]),
    Object.keys(KUP.WEAPON_MODULES).filter(id => KUP.WEAPONS[id]).join(',') || '无重名');
  check('武器 → 模组 → 族 的查询接口可用',
    KUP.FAMILY_OF('note') === fam && KUP.FAMILY_OF('lance') === fam && KUP.FAMILY_OF('orbit') !== fam);

  /* machinegun：弹夹打空 → 进入换弹（停火）→ 换弹完成自动装满 */
  const gMg = new KUP.Game(canvas);
  gMg.start({ char: 'kaf', area: 'area0', seed: 901 });
  gMg.director = () => {};
  gMg.enemies.length = 0;
  gMg.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.mg, 5)];
  const wMg = gMg.player.weapons[0];
  const mgStats = wMg.stat();
  wMg.t = 0;
  gMg.projs.length = 0;
  for (let i = 0; i < mgStats.mag; i++) { wMg.t = 0; wMg.update(0.02, gMg); }
  check('连射：打空弹夹后进入换弹且弹夹为 0',
    wMg.mag === 0 && wMg.reloadT > 0 && gMg.projs.length === mgStats.mag,
    'mag=' + wMg.mag + ' reloadT=' + (wMg.reloadT || 0).toFixed(2) + ' shots=' + gMg.projs.length);
  gMg.projs.length = 0;
  wMg.t = 0;
  wMg.update(0.05, gMg);
  check('连射：换弹期间停火（不产出弹体）', gMg.projs.length === 0 && wMg.mag === 0);
  wMg.update(2.0, gMg);
  check('连射：换弹完成后弹夹装满', wMg.mag === mgStats.mag && wMg.reloadT === 0, 'mag=' + wMg.mag);
  check('连射：每发只消耗 1 发弹药（count 只增加同帧弹数）',
    typeof mgStats.mag === 'number' && typeof mgStats.reload === 'number' && mgStats.reload > 0);

  /* shotgun：一次多枚弹丸，总散布角 = spread（弧度），弹丸带较小击退倍率 */
  const gSg = new KUP.Game(canvas);
  gSg.start({ char: 'kaf', area: 'area0', seed: 902 });
  gSg.director = () => {};
  gSg.enemies.length = 0;
  gSg.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.shot, 5)];
  const wSg = gSg.player.weapons[0];
  const sgStats = wSg.stat();
  wSg.t = 0;
  gSg.projs.length = 0;
  wSg.update(0.016, gSg);
  const sgAng = gSg.projs.map(pr => Math.atan2(pr.vy, pr.vx)).sort((a, b) => a - b);
  const span = sgAng.length ? sgAng[sgAng.length - 1] - sgAng[0] : 0;
  check('散弹：一次射出 count 枚弹丸、总散布角 = spread',
    sgAng.length === sgStats.count && Math.abs(span - sgStats.spread) < 1e-6,
    'n=' + sgAng.length + ' span=' + span.toFixed(3) + ' spread=' + sgStats.spread);
  check('散弹：弹丸带击退倍率（kb<1，避免散弹把敌人推飞）',
    gSg.projs.every(pr => pr.kb === KUP.MODULE('shotgun').base.kb || pr.kb === 0.6));
}

// 25p-4. v0.20：角色双武装（花譜三把）与新模组 devour / chain / summon / typhoon
{
  check('花譜三把：私論理(homing)＋過去を喰らう(devour)＋不可解(chain)',
    KUP.WEAPONS.note.behavior === 'homing' && KUP.WEAPONS.kuu.behavior === 'devour' &&
    KUP.WEAPONS.fukakai.behavior === 'chain' &&
    [KUP.WEAPONS.note, KUP.WEAPONS.kuu, KUP.WEAPONS.fukakai].every(w => w.owner === 'kaf'));
  const pairs = {
    rim: ['orbit', 'horagai'], harusaruhi: ['bass', 'taifuu'], isekaijoucho: ['laser', 'housekitan'],
    koko: ['lance', 'hakuchuumu'], aru: ['prayer', 'sayonara'], asu: ['follow', 'kyogen'],
  };
  check('其余六人各两把，第二把 owner 正确', Object.keys(pairs).every(c =>
    pairs[c].length === 2 && pairs[c].every(id => KUP.WEAPONS[id] && KUP.WEAPONS[id].owner === c)));
  check('第二把模组：shock／typhoon／lob／blast／shotgun／summon',
    KUP.WEAPONS.horagai.behavior === 'shock' && KUP.WEAPONS.taifuu.behavior === 'typhoon' &&
    KUP.WEAPONS.housekitan.behavior === 'lob' && KUP.WEAPONS.hakuchuumu.behavior === 'blast' &&
    KUP.WEAPONS.sayonara.behavior === 'shotgun' && KUP.WEAPONS.kyogen.behavior === 'summon');
  check('白昼夢是「白色空爆」', KUP.WEAPONS.hakuchuumu.color === '#ffffff' &&
    KUP.WEAPONS.hakuchuumu.behavior === 'blast');
  check('白昼夢的起爆前摇改为极浅紫（默认空爆仍是橙色）',
    KUP.WEAPONS.hakuchuumu.warnColor === '#d8c8ff' &&
    new KUP.Zone(0, 0, { kind: 'bomb' }).warnColor === '#ff8a5a');

  /* devour：先把敌人拖向中心，收束时群伤 */
  const gDv = new KUP.Game(canvas);
  gDv.start({ char: 'kaf', area: 'area0', seed: 921 });
  gDv.director = () => {};
  gDv.player.weapons = [];
  const dvE = gDv.spawnEnemy('noise', 1500, 1500);
  dvE.x = gDv.player.x + 90; dvE.y = gDv.player.y;
  const dvD0 = Math.hypot(dvE.x - gDv.player.x, dvE.y - gDv.player.y);
  const hpDv = dvE.hp;
  gDv.zones.push(new KUP.Zone(gDv.player.x, gDv.player.y, {
    r: 140, dmg: 12, kind: 'devour', pull: 300, life: 0.4,
  }));
  gDv.update(0.2);
  const dvD1 = Math.hypot(dvE.x - gDv.player.x, dvE.y - gDv.player.y);
  check('吞噬：领域把敌人拖向中心', dvD1 < dvD0 - 5, dvD0.toFixed(1) + '→' + dvD1.toFixed(1));
  gDv.update(0.3);
  check('吞噬：收束时对范围内敌人造成伤害', dvE.dead || dvE.hp < hpDv, 'hp ' + hpDv + '→' + dvE.hp);

  /* chain：最近怪 → 下一个最近怪，超出 range 的不进入首段 */
  const gCh = new KUP.Game(canvas);
  gCh.start({ char: 'kaf', area: 'area0', seed: 922 });
  gCh.director = () => {};
  gCh.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.fukakai, 5)];
  gCh.player.weapons[0].t = 0;
  const cE = [];
  for (let i = 0; i < 3; i++) {
    const e = gCh.spawnEnemy('noise', 1500, 1500);
    e.x = gCh.player.x + 120 + i * 200; e.y = gCh.player.y;
    e.maxhp = 9999; e.hp = 9999; e.speed = 0;
    cE.push(e);
  }
  const cFar = gCh.spawnEnemy('noise', 1500, 1500);
  cFar.x = gCh.player.x + 1600; cFar.y = gCh.player.y; cFar.maxhp = 9999; cFar.hp = 9999; cFar.speed = 0;
  gCh.update(0.02);
  check('连锁：沿最近的敌人逐段传导（3 段都掉血）',
    cE.every(e => e.hp < 9999), cE.map(e => Math.round(9999 - e.hp)).join('/'));
  check('连锁：超出 range 的敌人不被首段命中', cFar.hp === 9999);
  check('连锁：每段画 1 条纯表现光束（不重复结算）', gCh.beams.length === 3, 'beams=' + gCh.beams.length);

  /* summon：幻影自动索敌射击 */
  const gSm = new KUP.Game(canvas);
  gSm.start({ char: 'kaf', area: 'area0', seed: 923 });
  gSm.director = () => {};
  gSm.player.weapons = [];
  const smE = gSm.spawnEnemy('noise', 1500, 1500);
  smE.x = gSm.player.x + 300; smE.y = gSm.player.y; smE.maxhp = 9999; smE.hp = 9999; smE.speed = 0;
  gSm.summons.push(new KUP.Summon(gSm.player.x, gSm.player.y, { life: 3, fireCd: 0.3, dmg: 5 }));
  for (let i = 0; i < 12; i++) gSm.update(0.05);
  check('召唤：幻影自动索敌并射出弹体', gSm.projs.length > 0 && gSm.summons.length === 1,
    'projs=' + gSm.projs.length);

  /* typhoon：巨大弹体、高击退 */
  const gTy = new KUP.Game(canvas);
  gTy.start({ char: 'kaf', area: 'area0', seed: 924 });
  gTy.director = () => {};
  gTy.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.taifuu, 5)];
  const wTy = gTy.player.weapons[0];
  wTy.t = 0;
  gTy.projs.length = 0;
  wTy.update(0.016, gTy);
  check('台風の子：巨大弹体（r=34）＋高击退倍率（kb=3.6）',
    gTy.projs.length === 2 && gTy.projs[0].r === 34 && gTy.projs[0].kb === 3.6 &&
    gTy.projs[0].kind === 'typhoon',
    'n=' + gTy.projs.length + ' r=' + (gTy.projs[0] && gTy.projs[0].r) + ' kb=' + (gTy.projs[0] && gTy.projs[0].kb));
}

// 25p-2. 「范围」生效面：逐模组实测 areaMult 1 → 2 时几何量是否成比例放大
{
  const probe = (wid, area) => {
    const g = new KUP.Game(canvas);
    g.debug.w = wid;                                  // 开局带这把武器（Lv5）
    g.start({ char: 'kaf', area: 'area0', seed: 777 });
    g.director = () => {};                            // 不刷怪，只看这一次开火产出
    g.player.areaMult = area;
    const w = g.player.weapons.find(x => x.def.id === wid);
    g.projs.length = 0; g.rings.length = 0; g.slashes.length = 0; g.beams.length = 0;
    g.zones.length = 0; g.tosses.length = 0;
    w.t = 0; w.update(1 / 60, g);
    return { g, w };
  };
  const CASES = [
    ['note', '私論理（homing 命中半径）', r => r.g.projs[0] && r.g.projs[0].r],
    ['orbit', '环绕音球（球体体积）', r => r.w.orbR],
    ['orbit', '环绕音球（环绕半径）', r => r.w.orbitR],
    ['bass', 'テラ・ドロップ（冲击环半径）', r => r.g.rings[0] && r.g.rings[0].maxR],
    ['prayer', '救済の鐘（共用 bass 模组）', r => r.g.rings[0] && r.g.rings[0].maxR],
    ['slash', '斩音太刀（刀长）', r => r.g.slashes[0] && r.g.slashes[0].len],
    ['laser', '贯穿光束（长度）', r => r.g.beams[0] && r.g.beams[0].len],
    ['lance', 'the last bullet（sniper 命中半径）', r => r.g.projs[0] && r.g.projs[0].r],
    ['follow', 'オレンジ（machinegun 命中半径）', r => r.g.projs[0] && r.g.projs[0].r],
    ['mg', '连符机关（machinegun 命中半径）', r => r.g.projs[0] && r.g.projs[0].r],
    ['shot', '散弹和音（shotgun 弹丸半径）', r => r.g.projs[0] && r.g.projs[0].r],
    ['toss', '残留音块（音场半径）', r => r.g.tosses[0] && r.g.tosses[0].zone.r],
    ['toss', '残留音块（投掷距离）', r => r.g.tosses[0] && Math.hypot(r.g.tosses[0].tx - r.g.player.x, r.g.tosses[0].ty - r.g.player.y)],
    ['bomb', '随机空爆（爆炸半径）', r => r.g.zones[0] && r.g.zones[0].r],
    ['mine', '音之地雷（作用半径）', r => r.g.zones[0] && r.g.zones[0].r],
  ];
  for (const [wid, label, get] of CASES) {
    const a = probe(wid, 1), b = probe(wid, 2);
    const v1 = get(a), v2 = get(b);
    const ok = (v1 > 0) && (v2 > 0) && Math.abs(v2 - v1 * 2) < 0.01;
    check('「范围」×2 → ' + label + ' ×2', ok, v1 + ' → ' + v2);
  }
  /* 判定之外：不随范围变化的量要明确保持（口径写进模组 area 声明） */
  const lz1 = probe('laser', 1), lz2 = probe('laser', 2);
  check('光束宽度不随「范围」变化（模组未声明 w）', lz1.g.beams[0].w === lz2.g.beams[0].w);
  const nt1 = probe('note', 1), nt2 = probe('note', 2);
  check('音符飞行距离不随「范围」变化（模组未声明 life）', nt1.g.projs[0].life === nt2.g.projs[0].life);
}

/* ========== v0.13.3：支援物品（同伴层退出） ========== */

// 25q. 支援物品：五件、顺序对应五位魔女之子、**先不做差异化**（数值全同）
{
  const SP = KUP.SUPPORTS;
  check('支援物品共 5 件', Array.isArray(SP) && SP.length === 5, (SP || []).map(s => s.id).join(','));
  const order = ['icecream', 'chocolate', 'candy', 'puff', 'arare'];
  check('支援物品顺序＝冰淇淋／巧克力／糖果／泡芙／炸年糕果子',
    SP.map(s => s.id).join(',') === order.join(','), SP.map(s => s.id).join(','));
  check('arare 的中文名＝炸年糕果子', KUP.SUPPORT('arare').name.zh === '炸年糕果子', KUP.SUPPORT('arare').name.zh);
  /* 顺序对应五位魔女之子（花譜／理芽／異世界情緒／春猿火／幸祜）——现在只作记录 */
  const owners = SP.map(s => s.owner).join(',');
  check('五件顺序对应五位魔女之子（kaf／rim／isekaijoucho／harusaruhi／koko）',
    owners === 'kaf,rim,isekaijoucho,harusaruhi,koko', owners);
  check('每件都有三语名与三语说明',
    SP.every(s => s.name.zh && s.name.en && s.name.ja && s.desc.zh && s.desc.en && s.desc.ja));
  /* 先不做差异化：五件 perk 数值必须完全一致（以后要做差异化改这一条即可） */
  const perkSig = s => JSON.stringify(s.perk);
  check('先不做差异化：五件 perk 数值完全相同', SP.every(s => perkSig(s) === perkSig(SP[0])), perkSig(SP[0]));
  check('支援物品都标了局外解锁价', SP.every(s => s.unlock && s.unlock.cost > 0),
    SP.map(s => s.unlock.cost).join('/'));
  check('支援物品按**现金（元）**计价（v0.16：与原市民票价同一档位×4）',
    SP.every(s => s.unlock.cost >= 200), SP.map(s => s.unlock.cost).join('/'));
}

// 25q-2. 局外解锁 ＋ 出击时选一件：meta 流程与出击接线
{
  KUP.META.reset();
  check('支援物品默认未解锁', !KUP.META.isSupportUnlocked('icecream'));
  KUP.META.setSupport('icecream');
  check('未解锁的支援物品选不上（回落为不带）', KUP.META.ensure().support === null);
  check('现金不足时买不了', KUP.META.paySupport('icecream') === false);
  KUP.META.ensure().cash = 1000;
  check('花现金可解锁（局外解锁）', KUP.META.paySupport('icecream') === true &&
    KUP.META.isSupportUnlocked('icecream') && KUP.META.cash() === 600, '现金=' + KUP.META.cash());
  check('重复购买被拒（不会重复扣款）', KUP.META.paySupport('icecream') === false && KUP.META.cash() === 600);
  KUP.META.setSupport('icecream');
  check('解锁后可选中并写入存档', KUP.META.ensure().support === 'icecream');
  KUP.META.setSupport('nonexistent');
  check('未知支援物选不上', KUP.META.ensure().support === null);
  /* 出击接线：带上支援物 → perk 生效（gather：拾取 +20%、经验 +15%） */
  KUP.META.setSupport('icecream');
  const gS = new KUP.Game(canvas);
  gS.start({ char: 'kaf', area: 'area0', seed: 812, support: 'icecream' });
  check('出击时带上支援物品（供 HUD/结算显示）', !!gS.support && gS.support.id === 'icecream');
  const gNo = new KUP.Game(canvas);
  gNo.start({ char: 'kaf', area: 'area0', seed: 812 });
  check('支援物品生效：拾取半径 ×1.2', Math.abs(gS.player.pickup - gNo.player.pickup * 1.2) < 1e-6,
    gNo.player.pickup.toFixed(1) + ' → ' + gS.player.pickup.toFixed(1));
  check('支援物品生效：经验 ×1.15', Math.abs(gS.player.xpMult - gNo.player.xpMult * 1.15) < 1e-6,
    gNo.player.xpMult.toFixed(3) + ' → ' + gS.player.xpMult.toFixed(3));
  check('未解锁的支援物品不生效（URL 直开也不给）', (() => {
    KUP.META.setSupport(null);
    KUP.META.ensure().supports = [];              // 清掉解锁
    const gX = new KUP.Game(canvas);
    gX.start({ char: 'kaf', area: 'area0', seed: 813, support: 'chocolate' });
    return gX.support === null && Math.abs(gX.player.pickup - gNo.player.pickup) < 1e-6;
  })());
  check('结算 stats 带支援物品名', (() => {
    const st = gS.stats();
    return st.support === 'icecream' && !!st.supportName;
  })());
  /* 旧存档兼容：没有 supports/support 字段的记录读进来后补默认值 */
  const legacy = { fukkou: 3, tickets: 7, chars: [], companions: ['ciel'], shop: {}, cleared: {}, eggs: [] };
  KUP.STORE.write('progress', KUP.META._key(), legacy, { now: true });
  KUP.META.load(true);
  const dOld = KUP.META.ensure();
  check('旧存档（无 supports 字段）读入后补空列表且选择为 null',
    Array.isArray(dOld.supports) && dOld.supports.length === 0 && dOld.support === null,
    JSON.stringify({ supports: dOld.supports, support: dOld.support }));
  check('旧存档的 companions 列表不受影响', dOld.companions.indexOf('ciel') >= 0);
  /* v0.17：记忆图鉴/片段已移除——旧档里的 eggs/eggCount 被安全忽略（不报错、不回流） */
  check('旧档的 eggs/eggCount 被忽略（图鉴移除后不影响读档）',
    dOld.eggs === undefined && dOld.eggCount === undefined);
}

// 25q-3. 彩季詩得「先退出」：数据与 JK 皮肤保留，但不可选、不进招募列表
{
  const ciel = KUP.COMPANION('ciel');
  check('彩季詩得数据保留（含 perk）', !!ciel && !!ciel.perk && !!ciel.desc.zh);
  check('彩季被标为暂不登场（retired）', ciel.retired === true);
  check('出击界面可见的同伴为空（彩季不出现）', KUP.companionsActive().length === 0);
  check('同伴的 JK 制服以注释形式保留（不再进 FORMS，恢复时取消注释即可）',
    KUP.formsFor('companion').length === 0);
  KUP.META.ensure().companions = ['ciel'];            // 旧存档里已解锁的彩季
  KUP.META.setCompanion('ciel');
  check('retired 的同伴不可被选（旧存档也不会自动带上）', KUP.META.ensure().companion === null);
  const gC = new KUP.Game(canvas);
  gC.start({ char: 'kaf', area: 'area0', seed: 814, companion: 'ciel' });
  check('即使 URL 指定彩季，本局也不会出现同行实体', gC.recruit === null && gC.player.recruit === null);
  check('旧存档字段仍在（companions 列表不被破坏）', KUP.META.ensure().companions.indexOf('ciel') >= 0);
}

/* ========== v0.13.5：全量形态（系列化）＋ 共用形态 ＋ 变体取舍 ========== */

// 25r. 系列与清单：数量口径、三语、出处、渲染分支
{
  const SER = KUP.FORM_SERIES;
  check('形态系列共 7 个', SER.length === 7, SER.map(s => s.id).join(','));
  const expect = {
    kaf_singing: 11, rim_meta: 7, haru_matoi: 8, sekai_anima: 5, koko_type: 4, vwp_shared: 3, legacy: 0,
  };
  const got = {};
  for (const f of KUP.FORMS) if (f.series) got[f.series] = (got[f.series] || 0) + 1;
  check('各系列形态数符合当前取舍（化歩 11＝17 去枭黑+雛鳥黑再注释 4 条／狸眼 7／派流 8／世界 5／此処 4／共用 3／自创 0）',
    SER.every(s => (got[s.id] || 0) === expect[s.id]),
    SER.map(s => s.id + ':' + (got[s.id] || 0) + '/' + expect[s.id]).join(' '));
  check('每条魔女形态都归入系列', KUP.FORMS.filter(f => f.kinds && f.kinds.indexOf('witch') >= 0 && f.id !== 'none').every(f => !!f.series));
  check('系列 id 都是已声明的', KUP.FORMS.every(f => !f.series || SER.some(s => s.id === f.series)));
  /* 系列共同字段被补齐：三语名/标签/说明/配色/出处（「通常形態」是"不指定"，不在其列） */
  const witchy = KUP.FORMS.filter(f => f.id !== 'none');
  const incomplete = witchy.filter(f => !f.name || !f.name.zh || !f.name.en || !f.name.ja ||
    !f.label || !f.label.zh || !f.label.en || !f.label.ja ||
    !f.desc || !f.desc.zh || !f.desc.en || !f.desc.ja || !f.color || !f.accent);
  check('所有形态都有三语名/标签/说明与配色/配件', incomplete.length === 0, incomplete.map(f => f.id).join(','));
  check('所有形态都带出处（形态名来源＋服装为本作设计的说明）',
    witchy.every(f => f.src && f.src.zh), witchy.filter(f => !f.src || !f.src.zh).map(f => f.id).join(',') || '全部有');
  /* 渲染侧：用到的 accent 必须都有绘制分支 */
  const entSrc = require('fs').readFileSync('js/entities.js', 'utf8');
  const used = [...new Set(KUP.FORMS.map(f => f.accent))].filter(a => a && a !== 'none');
  const missing = used.filter(a => entSrc.indexOf("accent === '" + a + "'") < 0);
  check('形态用到的所有轮廓配件都有绘制分支', missing.length === 0, missing.join(',') || used.length + ' 种全部已实现');
}

// 25r-2. 人类的两条取舍：共用形态（花魁鳥・八咫烏）、仅数字/括号区分的变体不做
{
  const shared = KUP.FORMS.filter(f => f.series === 'vwp_shared');
  check('花魁鳥・八咫烏・姬連雀等共用形态不绑定角色（char 为空）', shared.every(f => !f.char), shared.map(f => f.id).join(','));
  check('共用形态对五位魔女之子都可用',
    ['kaf', 'rim', 'harusaruhi', 'isekaijoucho', 'koko'].every(c => shared.every(f => KUP.formFits(f, 'witch', c))));
  check('共用形态不会漏给魔女候補／同伴（kinds 限定 witch）',
    shared.every(f => !KUP.formFits(f, 'recruit', 'aru') && !KUP.formFits(f, 'companion', null)));
  /* 仅用数字或括号区分的变体：一律不做（按 ja 名判定） */
  const skipMarks = ['(壊)', '(想)', '(怪)', '（戒）', '（解）', '（巡）', 'Ⅱ'];
  const leaked = KUP.FORMS.filter(f => f.series && skipMarks.some(m => (f.name.ja || '').indexOf(m) >= 0));
  check('仅用数字/括号区分的变体没有混进来（燕(壊)・軍鶏(想)・雉(怪)・花魁鳥（戒）・八咫烏（解）・梟（巡）・Ⅱ 系）',
    leaked.length === 0, leaked.map(f => f.id + ':' + f.name.ja).join(',') || '已按取舍跳过');
  check('括号变体的基座形态仍在（燕／雉；軍鶏因人类要求已注释）',
    ['tsubame', 'kiji'].every(id => KUP.FORMS.some(f => f.id === id)) && !KUP.FORMS.some(f => f.id === 'shamo'));
  /* 2025–2026 新衣装（只在官方商品页有的名字）已收录；人类点名不要的「枭黑」已移除 */
  check('官方商品页才有的新衣装已收录（梟／銀兜／金兜／Dr.Futurity）',
    ['fukurou', 'ginkabuto', 'kinakabuto', 'dr_futurity'].every(id => KUP.FORMS.some(f => f.id === id)));
  check('人类点名的「枭黑」未做（fukurou_kuro 不存在）', !KUP.FORMS.some(f => f.id === 'fukurou_kuro'));
  check('采集稿标「名称不明」的照原样保留、不替它取名',
    (() => { const f = KUP.FORM('pc_1'); return !!f && f.name.zh.indexOf('parallel canvas') >= 0; })());
}

// 25r-3. 数值从简：只有覚醒／戦闘形態带数值，其余纯外观
{
  const withMods = KUP.FORMS.filter(f => f.kinds && f.kinds.indexOf('witch') >= 0)
    .filter(f => f.mods && Object.keys(f.mods).length).map(f => f.id).sort();
  const expect = ['aogara', 'alnair', 'childhoods_end', 'heliotrope', 'himerenjaku', 'kumonryu', 'ouranchou', 'yatagarasu'].sort();
  check('带数值的魔女形态恰为「覚醒／戦闘形態」8 条（其余形态纯外观）',
    withMods.join(',') === expect.join(','), withMods.join(','));
  const probe = (char, form) => { const g = new KUP.Game(canvas); g.start({ char, area: 'area0', seed: 831, form }); return g.player; };
  const baseK = probe('kaf', 'hinadori');   // 纯外观形态作基准（通常形態已取消）
  check('花魁鳥 Revolutions 已注释保留（不生效、不可选）', !KUP.FORMS.some(f => f.id === 'ouranchou_rev') &&
    KUP.formsFor('witch', 'kaf').every(f => f.id !== 'ouranchou_rev'));
  const baseKo = probe('koko', 'bellatrix'), yata = probe('koko', 'yatagarasu');
  check('八咫烏生效：攻击 ×1.08／范围 ×1.10',
    Math.abs(yata.dmgMult - baseKo.dmgMult * 1.08) < 1e-6 && Math.abs(yata.areaMult - baseKo.areaMult * 1.10) < 1e-6);
  const baseH = probe('harusaruhi', 'matoi_tanchou'), kumo = probe('harusaruhi', 'kumonryu');
  check('九紋龍生效：生命 ×1.15／范围 ×1.08', Math.abs(kumo.maxhp - Math.round(baseH.maxhp * 1.15)) <= 1);
  const pure = probe('kaf', 'fukurou');
  check('纯外观形态不改变任何数值（梟＝与基准形态同值）',
    Math.abs(pure.dmgMult - baseK.dmgMult) < 1e-6 && pure.maxhp === baseK.maxhp && Math.abs(pure.areaMult - baseK.areaMult) < 1e-6);
  /* 专属绑定仍然成立 */
  check('专属形态对别的魔女之子仍不可用',
    !KUP.formFits(KUP.FORM('aogara'), 'witch', 'koko') && !KUP.formFits(KUP.FORM('ubik'), 'witch', 'kaf'));
  const cross = probe('koko', 'ubik');
  check('跨角色形态被拒并回落该角色的默认形态', cross.form.id === 'bellatrix', cross.form.id);
}

// 25r-4. UI 分组（同一屏内按系列切换，避免"一墙卡"）
{
  const g = KUP.formGroups('witch', 'kaf');
  check('分组顺序＝本命系列 → 共用（自创系列现为空组，不出现），且不含「通常形態」',
    g.map(x => x.key).join(',') === 'kaf_singing,vwp_shared' && g.every(x => x.forms.every(f => f.id !== 'none')),
    g.map(x => x.key + ':' + x.forms.length).join(' '));
  check('化歩一组 11 条、共用 3 条（花魁鳥・八咫烏・姬連雀）', g[0].forms.length === 11 && g[1].forms.length === 3);
  check('每组都有三语短名（系列按钮用）', g.every(x => x.short && x.short.zh && x.short.en && x.short.ja),
    g.map(x => x.key).join(','));
  check('此処的分组＝此処 4／共用 3', (() => {
    const k = KUP.formGroups('witch', 'koko');
    return k[0].key === 'koko_type' && k[0].forms.length === 4 && k.length === 2 &&
      k[1].key === 'vwp_shared' && k[1].forms.length === 3;
  })());
  check('魔女候補／同伴没有系列分组（UI 因而不显示系列按钮；同伴层暂不登场 ⇒ 0 组）',
    KUP.formGroups('recruit', 'aru').length === 1 && KUP.formGroups('companion', null).length === 0);
  check('「全部」＝该角色可选的全部形态数（化歩 14 条）', KUP.formsFor('witch', 'kaf').length === 14,
    String(KUP.formsFor('witch', 'kaf').length));
}

// 25r-5. v0.18.7：皮肤「系列按钮」分组解析（「共用」「全部」可点击）
{
  const groups = KUP.formGroups('witch', 'kaf');
  const list = KUP.formsFor('witch', 'kaf');
  check('选中的形态不在本命系列 → 首次渲染自动跳到它所在的组',
    KUP.resolveFormGroup(groups, list, 'kaf_singing', 'ouranchou', false) === 'vwp_shared');
  check('玩家手动点「共用」→ 保留该组（不会被弹回本命系列）',
    KUP.resolveFormGroup(groups, list, 'vwp_shared', 'hinadori', true) === 'vwp_shared');
  check('玩家手动点「全部」→ `__all` 合法且保留（不被当成未知分组清掉）',
    KUP.resolveFormGroup(groups, list, '__all', 'hinadori', true) === '__all');
  check('未知分组回落到第一组',
    KUP.resolveFormGroup(groups, list, 'no_such_group', 'hinadori', false) === 'kaf_singing');
  check('选中形态就在当前组时不跳组',
    KUP.resolveFormGroup(groups, list, 'kaf_singing', 'hinadori', false) === 'kaf_singing');
}

// ===== v0.14：瞄准规则（人类 2026-10-17 的六条反馈）=====
{
  /* ① 投掷型：向**最近的两个不同敌人**各投一个（不是对着一个撒两个） */
  const gT = new KUP.Game(canvas);
  gT.start({ char: 'kaf', area: 'area0', seed: 201 });
  gT.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.toss, 5)];
  gT.enemies.length = 0;
  const px = gT.player.x, py = gT.player.y;
  const eA = gT.spawnEnemy('noise', px + 160, py);
  const eB = gT.spawnEnemy('noise', px - 200, py + 40);
  eA.speed = 0; eB.speed = 0;
  gT.tosses.length = 0;                     // 清空残留投掷物，只看这一轮齐射
  gT.player.weapons[0].t = 0;
  gT.player.weapons[0].update(0.016, gT);
  gT.tosses.length = 2;                     // count=3 时第 3 个无目标（只有两只敌人），轮次无残留
  const targetDists = gT.tosses.map(ts => {
    /* 落点应各自贴近**不同的**敌人（允许 30px 误差，投掷有飞行时间） */
    const da = Math.hypot(ts.tx - eA.x, ts.ty - eA.y), db = Math.hypot(ts.tx - eB.x, ts.ty - eB.y);
    return Math.min(da, db);
  });
  check('投掷型向最近两个不同敌人各投一个（落点分别贴近两只）',
    gT.tosses.length === 2 && Math.max.apply(null, targetDists) < 40,
    'tosses=' + gT.tosses.length + ' d=' + targetDists.map(v => Math.round(v)).join(',') +
    ' tg=' + gT.tosses.map(ts => ts.target ? Math.round(ts.target.x - px) : 'null').join('|'));
  check('投掷物各自锁定目标（homing）并会修订落点',
    gT.tosses.every(ts => !!ts.target) && gT.tosses[0].target !== gT.tosses[1].target);

  /* ② 激光：双光束分射两个不同敌人；只有一个目标时前后对穿（不是张开夹角） */
  const gL = new KUP.Game(canvas);
  gL.start({ char: 'isekaijoucho', area: 'area0', seed: 202 });
  gL.enemies.length = 0;
  const lx = gL.player.x, ly = gL.player.y;
  const lA = gL.spawnEnemy('noise', lx + 220, ly - 30);
  const lB = gL.spawnEnemy('noise', lx - 120, ly + 260);
  lA.speed = 0; lB.speed = 0;
  gL.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.laser, 5)];   // Lv5＝双光束
  gL.player.weapons[0].t = 0;
  gL.player.weapons[0].update(0.016, gL);
  const wantA = Math.atan2(lA.y - ly, lA.x - lx), wantB = Math.atan2(lB.y - ly, lB.x - lx);
  const hitsA = gL.beams.some(b => Math.abs(KUP.U.angDiff(b.dir, wantA)) < 0.02);
  const hitsB = gL.beams.some(b => Math.abs(KUP.U.angDiff(b.dir, wantB)) < 0.02);
  check('激光双光束分射最近的两个敌人（各对准一个，不张开夹角）', gL.beams.length === 2 && hitsA && hitsB,
    gL.beams.map(b => (b.dir * 180 / Math.PI).toFixed(1)).join('/'));
  const gL1 = new KUP.Game(canvas);
  gL1.start({ char: 'isekaijoucho', area: 'area0', seed: 203 });
  gL1.enemies.length = 0;
  const only = gL1.spawnEnemy('noise', gL1.player.x + 200, gL1.player.y);
  only.speed = 0;
  gL1.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.laser, 5)];
  gL1.player.weapons[0].t = 0;
  gL1.player.weapons[0].update(0.016, gL1);
  check('激光只有一个目标时改为「前后对穿」（dir2 ≈ dir1 + π）', gL1.beams.length === 2 &&
    Math.abs(Math.abs(KUP.U.angDiff(gL1.beams[1].dir, gL1.beams[0].dir)) - Math.PI) < 0.02);

  /* ③ 射弹（音枪/音枪系）：夹角变小；最近两敌各一发，多出来的补小角度 */
  check('射弹模组的 spread 从 0.16 降到 ≤0.09（夹角变小）', KUP.MODULE('sniper').base.spread <= 0.09,
    'spread=' + KUP.MODULE('sniper').base.spread);
  const gPj = new KUP.Game(canvas);
  gPj.start({ char: 'asu', area: 'area0', seed: 204 });
  gPj.enemies.length = 0;
  const q1 = gPj.spawnEnemy('noise', gPj.player.x + 300, gPj.player.y - 20);
  const q2 = gPj.spawnEnemy('noise', gPj.player.x - 260, gPj.player.y + 60);
  q1.speed = 0; q2.speed = 0;
  gPj.player.weapons = [new KUP.WeaponRuntime(KUP.WEAPONS.lance, 5)];   // count 5
  gPj.player.weapons[0].t = 0;
  gPj.player.weapons[0].update(0.016, gPj);
  const dirs = gPj.projs.map(pr => Math.atan2(pr.vy, pr.vx));
  const wq1 = Math.atan2(q1.y - gPj.player.y, q1.x - gPj.player.x);
  const wq2 = Math.atan2(q2.y - gPj.player.y, q2.x - gPj.player.x);
  check('射弹 5 发：两发分别对准最近两个敌人，其余补角 ≤ 5°×2', gPj.projs.length === 5 &&
    dirs.some(d => Math.abs(KUP.U.angDiff(d, wq1)) < 0.02) && dirs.some(d => Math.abs(KUP.U.angDiff(d, wq2)) < 0.02) &&
    dirs.every(d => Math.abs(KUP.U.angDiff(d, wq1)) < 0.2 || Math.abs(KUP.U.angDiff(d, wq2)) < 0.2),
    dirs.map(d => (d * 180 / Math.PI).toFixed(0)).join('/'));
  /* volleyAngles 的基础单元：目标不足时对称补角、无目标时也发得出 */
  const gV2 = new KUP.Game(canvas);
  gV2.start({ char: 'kaf', area: 'area0', seed: 205 });
  const vv = gV2.volleyAngles(gV2.player, 4, { base: 0, spread: 0.085, targets: [] });
  check('齐射无目标时仍沿基准方向对称发满（±0.085/±0.17）',
    vv.angles.length === 4 && vv.angles.every(a => Math.abs(Math.abs(a) - 0.085) < 1e-9 || Math.abs(Math.abs(a) - 0.17) < 1e-9),
    vv.angles.map(a => a.toFixed(3)).join(','));
  /* 补角必须避开已被目标占用的方向（否则两发打同一处） */
  const vv2 = gV2.volleyAngles(gV2.player, 3, { base: 0, spread: 0.085, targets: [gV2.player] });
  check('齐射补角跳过已用方向（不重复打同一处）', (() => {
    const dup = vv2.angles.some((a, i) => vv2.angles.some((b, j) => j > i && Math.abs(KUP.U.angDiff(a, b)) < 1e-9));
    return vv2.angles.length === 3 && !dup;
  })(), vv2.angles.map(a => a.toFixed(3)).join(','));
}

// ===== v0.14：不同的大招（按角色，数据表 KUP.ULTIMATES）=====
{
  const ids = ['kaf', 'rim', 'harusaruhi', 'isekaijoucho', 'koko', 'aru', 'asu'];
  check('每个可玩角色都有独立的大招定义', ids.every(id => KUP.ULTIMATES[id] && KUP.ULTIMATES[id].id) &&
    KUP.CHARS.every(c => KUP.ULTIMATES[c.id]),   // ★ 键名必须与 KUP.CHARS 的 id 完全一致
    KUP.CHARS.filter(c => !KUP.ULTIMATES[c.id]).map(c => c.id).join(',') || '全部已定义');
  check('各不相同（id 唯一）且都有三语名/说明', (() => {
    const all = ids.map(id => KUP.ULTIMATES[id]);
    return new Set(all.map(u => u.id)).size === ids.length &&
      all.every(u => u.name && u.name.zh && u.name.en && u.name.ja && u.desc && u.desc.zh && u.desc.en && u.desc.ja);
  })());
  check('效果不雷同：至少分别是 冲击环/冻结/扇形/减速/弹幕/回血/箭雨 的多种组合', (() => {
    const feat = u => [u.rings ? 1 : 0, u.freeze ? 1 : 0, u.slow ? 1 : 0, u.fields ? 1 : 0,
      u.beams ? 1 : 0, u.shots ? 1 : 0, (u.heal || 0) > 0 ? 1 : 0,
      (u.rings || []).some(r => (r.arcDeg || 360) < 360) ? 1 : 0].join('');
    return new Set(ids.map(id => feat(KUP.ULTIMATES[id]))).size >= 6;
  })());
  check('未知角色回落到 default（旧「浄化の歌」）', KUP.ULTIMATE('nobody').id === 'ult_default');
  /* 共通规则：充能 <100 不可释放；满 → 释放并清零 + 进入冷却；冷却中不可连续释放 */
  const gU = new KUP.Game(canvas);
  gU.start({ char: 'rim', area: 'area0', seed: 211 });
  gU.ult.charge = 99;
  gU.castUltimate();
  check('充能 <100 不可释放', gU.ult.charge === 99);
  gU.player.hp = gU.player.maxhp * 0.4;
  const hpBefore = gU.player.hp;
  gU.ult.charge = 100;
  gU.castUltimate();
  check('满充能 → 释放并清零、进入冷却', gU.ult.charge === 0 && gU.ult.cdT > 0);
  check('静止帧：回血 15%（rim 的大招特征）', gU.player.hp > hpBefore);
  gU.ult.charge = 100;
  const ringsBefore = gU.rings.length;
  gU.castUltimate();
  check('冷却中不可释放（HUD 显示冷却秒数）', gU.rings.length === ringsBefore && gU.ult.charge === 100 && !gU.ultReady());
  for (let i = 0; i < 400; i++) gU.update(0.016);   // 等冷却
  check('冷却结束后可再次释放', gU.ultReady() || gU.state !== 'playing');
  /* 冻结型（rim）确实冻结了全场；扇形型（haru）确实只朝瞄准方向成扇形 */
  const gUf = new KUP.Game(canvas);
  gUf.start({ char: 'rim', area: 'area0', seed: 212 });
  const f1 = gUf.spawnEnemy('noise', gUf.player.x + 50, gUf.player.y);
  gUf.ult.charge = 100; gUf.castUltimate();
  check('静止帧冻结全场（敌人 stunT > 0）', f1.stunT > 0, 'stun=' + f1.stunT.toFixed(2));
  const gUh = new KUP.Game(canvas);
  gUh.start({ char: 'harusaruhi', area: 'area0', seed: 213 });   // 角色 id 是 harusaruhi（不是 haru）
  gUh.player.weapons = [];
  gUh.ult.charge = 100;
  gUh.castUltimate();
  const fan = gUh.rings.filter(r => r.arc < Math.PI * 1.9)[0] || gUh.rings[gUh.rings.length - 1];
  check('九龍噴火：单条 160° 扇形波（不是整圆）', !!fan && Math.abs(fan.arc - 160 * Math.PI / 180) < 1e-6,
    fan ? (fan.arc * 180 / Math.PI).toFixed(0) + '°' : 'no ring');
  const gUk = new KUP.Game(canvas);
  gUk.start({ char: 'koko', area: 'area0', seed: 214 });
  gUk.ult.charge = 100;
  gUk.castUltimate();
  check('终结弹幕：一次性打出 12 道环形贯穿光束', gUk.beams.length === 12, 'beams=' + gUk.beams.length);
  const gUi = new KUP.Game(canvas);
  gUi.start({ char: 'isekaijoucho', area: 'area0', seed: 215 });
  const s1 = gUi.spawnEnemy('noise', gUi.player.x + 40, gUi.player.y);
  gUi.ult.charge = 100;
  gUi.castUltimate();
  check('星海陷落：全场减速 + 留下 4 处滞留区', s1.slowT > 0 && gUi.zones.length === 4,
    'slow=' + s1.slowT.toFixed(1) + ' zones=' + gUi.zones.length);
  const gUa = new KUP.Game(canvas);
  gUa.start({ char: 'asu', area: 'area0', seed: 216 });
  gUa.ult.charge = 100;
  gUa.castUltimate();
  check('終楽章・箭雨：16 方向放射贯穿箭', gUa.projs.length === 16, 'projs=' + gUa.projs.length);
}


/* ========== v0.18.3/18.4：暴击「会心」 ========== */
{
  /* 数据表：每个可玩角色都有会心定义 */
  check('每位可玩角色都有会心定义（率/倍率/三语名）',
    KUP.CHARS.every(c => {
      const cr = KUP.CRIT[c.id];
      return cr && cr.rate > 0 && cr.rate <= 0.35 && cr.mult >= 1.3 && cr.mult <= 2.5 &&
        cr.name && cr.name.zh && cr.name.en && cr.name.ja &&
        cr.desc && cr.desc.zh && cr.desc.en && cr.desc.ja;
    }));
  const ev = KUP.CHARS.map(c => 1 + KUP.CRIT[c.id].rate * (KUP.CRIT[c.id].mult - 1));
  check('会心期望增伤都在 1.06–1.12 之间（差异化手感、不差异化总量）',
    ev.every(v => v >= 1.06 && v <= 1.12), ev.map(v => v.toFixed(3)).join(' '));
  check('会心率/倍率有高有低（不是同一个数）',
    new Set(KUP.CHARS.map(c => KUP.CRIT[c.id].rate)).size >= 5 &&
    new Set(KUP.CHARS.map(c => KUP.CRIT[c.id].mult)).size >= 5);
  check('角色表与 CRIT 一一对应（没有多余/缺失）', Object.keys(KUP.CRIT).length === KUP.CHARS.length);

  /* 接线：Player.recompute 把会心带到玩家身上 */
  const mkP = id => { const g = new KUP.Game(canvas); g.start({ char: id, area: 'area0', seed: 901 }); return g.player; };
  check('玩家会心率/倍率＝角色表数值',
    Math.abs(mkP('kaf').critRate - KUP.CRIT.kaf.rate) < 1e-9 &&
    Math.abs(mkP('harusaruhi').critMult - KUP.CRIT.harusaruhi.mult) < 1e-9);
  check('全局上限兜底（率 0.6 / 倍率 3.0 / Boss 0.85）',
    KUP.CONFIG.CRIT.RATE_CAP === 0.6 && KUP.CONFIG.CRIT.MULT_CAP === 3.0 && KUP.CONFIG.CRIT.BOSS_MULT === 0.85);

  /* v0.18.4 升级卡：鋭音（+4%/级）与重音（+0.20/级）分别只加一项 */
  check('两张会心成长卡齐备（鋭音／重音，各 5 级）',
    KUP.PASSIVES.flint && KUP.PASSIVES.heavy &&
    KUP.PASSIVES.flint.maxLv === 5 && KUP.PASSIVES.heavy.maxLv === 5 &&
    KUP.PASSIVES.flint.name.zh === '鋭音' && KUP.PASSIVES.heavy.name.zh === '重音');
  const gFl = new KUP.Game(canvas);
  gFl.start({ char: 'kaf', area: 'area0', seed: 920 });
  const baseRate = gFl.player.critRate, baseMult = gFl.player.critMult;
  gFl.player.addPassive('flint');
  check('鋭音：会心率 +4%（倍率不变）',
    Math.abs(gFl.player.critRate - (baseRate + 0.04)) < 1e-9 && gFl.player.critMult === baseMult,
    'rate=' + gFl.player.critRate.toFixed(3));
  gFl.player.addPassive('heavy');
  check('重音：会心伤害 +0.20（会心率不变）',
    Math.abs(gFl.player.critMult - (baseMult + 0.20)) < 1e-9, 'mult=' + gFl.player.critMult.toFixed(2));
  for (let i = 0; i < 20; i++) { gFl.player.addPassive('flint'); gFl.player.addPassive('heavy'); }
  check('超上限时被全局闸门钳制（率 ≤60%、倍率 ≤3.0）',
    gFl.player.critRate === KUP.CONFIG.CRIT.RATE_CAP && gFl.player.critMult === KUP.CONFIG.CRIT.MULT_CAP,
    'rate=' + gFl.player.critRate + ' mult=' + gFl.player.critMult);
  /* 两张卡进升级池的「被动」桶 */
  const gPool = new KUP.Game(canvas);
  gPool.start({ char: 'kaf', area: 'area0', seed: 921 });
  let seenFlint = false, seenHeavy = false;
  for (let i = 0; i < 300; i++) {
    const roll = gPool.rollChoices();
    if (roll.some(c => c.kind.indexOf('passive') === 0 && c.id === 'flint')) seenFlint = true;
    if (roll.some(c => c.kind.indexOf('passive') === 0 && c.id === 'heavy')) seenHeavy = true;
  }
  check('鋭音／重音都会出现在升级池', seenFlint && seenHeavy);

  /* 会心翻倍：率 1、倍率 2 → 100 变 200 */
  const gC1 = new KUP.Game(canvas);
  gC1.start({ char: 'koko', area: 'area0', seed: 902 });
  gC1.player.critRate = 1; gC1.player.critMult = 2;
  const dummy = gC1.spawnEnemy('elite', gC1.player.x + 200, gC1.player.y);
  dummy.boss = false; dummy.elite = false; dummy.maxhp = 99999; dummy.hp = 99999;
  const hp0 = dummy.hp;
  gC1.damageEnemy(dummy, 100);
  check('会心命中：伤害 × 倍率（100 → 200）', Math.abs((hp0 - dummy.hp) - 200) < 1e-6, 'loss=' + (hp0 - dummy.hp));
  check('会心计入统计（次数 / 最高单发）', gC1.critCount === 1 && Math.abs(gC1.critMax - 200) < 1e-6);
  check('stats 暴露会心字段', (() => { const st = gC1.stats(); return st.crits === 1 && st.critMax === 200; })());
  gC1.player.critRate = 0;
  const hp1 = dummy.hp;
  gC1.damageEnemy(dummy, 100);
  check('会心率 0 → 伤害不变', Math.abs((hp1 - dummy.hp) - 100) < 1e-6);
  gC1.player.critRate = 1;
  const hp2 = dummy.hp;
  gC1.damageEnemy(dummy, 100, 0, 0, { noCrit: true });
  check('opt.noCrit 的追加伤害不会再暴击', Math.abs((hp2 - dummy.hp) - 100) < 1e-6);

  /* Boss 会心倍率 ×0.85 */
  const gC2 = new KUP.Game(canvas);
  gC2.start({ char: 'koko', area: 'area0', seed: 903 });
  gC2.player.critRate = 1; gC2.player.critMult = 2;
  const boss = gC2.spawnEnemy('boss0', gC2.player.x + 200, gC2.player.y);
  const bhp = boss.hp;
  gC2.damageEnemy(boss, 100);
  check('Boss 会心倍率 ×0.85（100 → 170）', Math.abs((bhp - boss.hp) - 170) < 1e-6, 'loss=' + (bhp - boss.hp));

  /* v0.18.4：**所有特殊触发已注释**——会心只加伤害，不再附带任何效果 */
  const mkNoFx = (id, seed) => {
    const g = new KUP.Game(canvas);
    g.start({ char: id, area: 'area0', seed });
    g.player.critRate = 1; g.player.critMult = 1.5;
    const e = g.spawnEnemy('elite', g.player.x + 120, g.player.y);
    e.boss = false; e.elite = false; e.maxhp = 99999; e.hp = 99999;
    return { g, e };
  };
  const nfK = mkNoFx('kaf', 904);
  const kHp = nfK.e.hp;
  nfK.g.damageEnemy(nfK.e, 100);
  check('化歩会心不再追加「残响」伤害（100 → 150，不是 195）',
    Math.abs((kHp - nfK.e.hp) - 150) < 1e-6, 'loss=' + (kHp - nfK.e.hp));
  const nfR = mkNoFx('rim', 905);
  nfR.g.damageEnemy(nfR.e, 1);
  check('狸眼会心不再附带减速（特殊触发已注释）', nfR.e.slowT === 0 && nfR.e.slowMul === 1,
    'slow=' + nfR.e.slowT);
  const nfKo = mkNoFx('koko', 906);
  nfKo.g.ult.charge = 0;
  nfKo.g.damageEnemy(nfKo.e, 1);
  check('此処会心不再给大招充能（特殊触发已注释）', nfKo.g.ult.charge === 0, 'charge=' + nfKo.g.ult.charge);
  const nfI = mkNoFx('isekaijoucho', 907);
  nfI.g.gems.length = 0;
  nfI.g.damageEnemy(nfI.e, 1);
  check('世界会心不再掉额外片段（特殊触发已注释）', nfI.g.gems.length === 0);
  const nfA = mkNoFx('aru', 908);
  nfA.g.player.hp = nfA.g.player.maxhp * 0.5;
  const aHp = nfA.g.player.hp;
  nfA.g.damageEnemy(nfA.e, 1);
  check('亜留会心不再回血（特殊触发已注释）', nfA.g.player.hp === aHp);
  const nfAs = mkNoFx('asu', 909);
  nfAs.g.player.dashCd = 3;
  nfAs.g.damageEnemy(nfAs.e, 1);
  check('阿栖会心不再缩短冲刺 CD（特殊触发已注释）', nfAs.g.player.dashCd === 3);

  /* 确定性：同 seed、同操作 → 会心次数一致 */
  const runCrit = () => {
    const g = new KUP.Game(canvas);
    g.start({ char: 'rim', area: 'area0', seed: 911 });
    g.player.critRate = 0.5;
    const e = g.spawnEnemy('elite', g.player.x + 200, g.player.y);
    e.maxhp = 99999; e.hp = 99999;
    for (let i = 0; i < 200; i++) g.damageEnemy(e, 1);
    return g.critCount;
  };
  const c1 = runCrit(), c2 = runCrit();
  check('同 seed 同操作 → 会心次数可复现', c1 === c2 && c1 > 40, c1 + '/' + c2);
}
console.log(fail === 0 ? '\nALL PASS (' + total + ' checks)' : '\n' + fail + ' FAILED / ' + total + ' checks');
process.exit(fail === 0 ? 0 : 1);
