/* ================= 敌人数据域（js/data/enemy.js） =================
 * 模块 id：enemy
 * 内容：KUP.ENEMIES（杂兵／精英）→ KUP.BOSSES（七体番街 Boss，含 pattern）→ 并入敌人表。
 * 依赖：无。Boss 的 pattern 由 js/director.js 的 updateBossBehavior 分派。
 * 纪律：turn＝角速度上限（度/秒）；zh 一律「破维魔…」，日文原词只进 ja 字段。
 * 加杂兵＝ENEMIES 加一条；加 Boss＝BOSSES 加一条 + area.boss 指向它 +
 *   director 的 switch 加一个 pattern（**名称须标注本作二创**）。
 * ================================================================ */

window.KUP = window.KUP || {};

/* ---------- 敌人＝破维魔（テセラクター）：人的恐惧与欲望被具象化的产物 ----------
 * 官方文案（动画官网）只写到「人の悪意と欲望から生まれる怪物」；更底层的「具象者＝麦克斯韦」
 * 出自动画后四集（lore §11 行 21／行 30），**本作不做 Boss 实体、不在文案里点其名**。
 * ⚠️ 名称纪律：zh 一律「破维魔…」（§0.5 统一表记），日文原词只出现在 ja 字段；
 *    **「異能テセラクター」在官方指的是眷魔（ファミリア）＝盟友**，故本表不再用它命名杂兵精英
 *    （lore §4.2：全部眷魔都是破维魔盟友，不存在完全敌对，不能当敌人）。
 * turn ＝ **角速度上限（度/秒）**：敌人朝向以它为上限转向「可走方向」（见
 * js/game.js steerCity 与 js/entities.js Enemy.update）。单位按本仓库数据表
 * 约定用「度」，运行时以 DEG 换算；大体型转得慢 ⇒ tank/elite/Boss 绕圈时更笨重。
 * 未写 turn 的条目回落到 CONFIG.NAV.TURN。 */
KUP.ENEMIES = {
  noise: {
    id: 'noise',
    name: { zh: '破维魔（基本型）', en: 'Tesseracter (Basic)', ja: 'テセラクター（基本型）' },
    hp: 10, speed: 62, dmg: 8, xp: 1, r: 12, color: '#8d94b8', sides: 7, turn: 600,
  },
  glitch: {
    id: 'glitch',
    name: { zh: '破维魔（高速型）', en: 'Tesseracter (Swift)', ja: 'テセラクター（高速型）' },
    hp: 7, speed: 108, dmg: 6, xp: 2, r: 9, color: '#5959ff', sides: 5, turn: 900,
  },
  tank: {
    id: 'tank',
    name: { zh: '破维魔（巨躯型）', en: 'Tesseracter (Bulwark)', ja: 'テセラクター（巨躯型）' },
    hp: 60, speed: 34, dmg: 18, xp: 6, r: 20, color: '#c2507e', sides: 8, turn: 300,
  },
  elite: {
    id: 'elite',
    /* ★ 原名「異能テセラクター」有误——该词官方指眷魔（盟友）。这里改用中性的「強化型」。 */
    name: { zh: '破维魔（強化型）', en: 'Tesseracter (Elite)', ja: 'テセラクター（強化型）' },
    hp: 260, speed: 74, dmg: 16, xp: 30, r: 26, color: '#ffab5e', sides: 6, elite: true, turn: 450,
  },
  boss: {
    id: 'boss',
    name: { zh: '大破维魔〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true, turn: 380,
  },
};

/* ========== 关卡 Boss：每番街一体（2026-10 追加） ==========
 * ⚠️ 全部为**本作二创**的大破维魔名（〈消音〉已是本作自拟；其余同）；
 *    命名取自各番街的官方定位/章节副标题的意象，不涉官方未公开设定。
 *    ★ 引用纪律：官方概念里**没有「消音」这类称号**（lore §12.2「◇ 大テセラクター〈消音〉」，
 *      标注为本作二创）；因此本表只在注释里保留日文原形，**zh 文案一律写「大破维魔〈…〉」**。
 *    ★ `chapter` 用的是**动画各话官方副标题**（壱＝悪意／弐＝欲望／参＝ファミリア／
 *      肆＝現象／伍＝ブラックアウト／陸＝再生），与 Boss 称号是两回事，别混用。
 * pattern 为行为模式 id，由 js/director.js 的 updateBossBehavior 分派：
 *   mute   〈消音〉   ：音波环 + 混合召唤（零番街·基线）
 *   chase  〈緘黙〉   ：沉默地直线冲锋，冲锋沿途留下滞留伤害带（壱番街·办公区）
 *   swarm  〈誘惑〉   ：三段音波环 + 高速群召唤（弐番街·歓楽街）
 *   blight 〈枯死〉   ：自身周围持续散播毒区，缓慢逼近（参番街·農園）
 *   scan   〈観測〉   ：旋转光束扫射 + 分裂体（肆番街·科学研究特区）
 *   smog   〈爆塵〉   ：随机轰炸 + 短暂视野遮蔽（伍番街·工业）
 *   regen  〈再生〉   ：两阶段——前半音波环+高速群，后半轰炸+精英召唤（陸番街·终盘） */
KUP.BOSSES = {
  boss0: {
    id: 'boss0', pattern: 'mute',
    name: { zh: '大破维魔〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true,
  },
  boss1: {
    id: 'boss1', pattern: 'chase',
    name: { zh: '大破维魔〈緘黙〉', en: 'Grand Tesseracter 〈Taciturn〉', ja: '大テセラクター〈緘黙〉' },
    hp: 2200, speed: 42, dmg: 26, xp: 0, r: 50, color: '#55e0ff', sides: 6, boss: true,
  },
  boss2: {
    id: 'boss2', pattern: 'swarm',
    name: { zh: '大破维魔〈誘惑〉', en: 'Grand Tesseracter 〈Temptation〉', ja: '大テセラクター〈誘惑〉' },
    hp: 2400, speed: 48, dmg: 25, xp: 0, r: 52, color: '#ff7ad9', sides: 7, boss: true,
  },
  boss3: {
    id: 'boss3', pattern: 'blight',
    name: { zh: '大破维魔〈枯死〉', en: 'Grand Tesseracter 〈Blight〉', ja: '大テセラクター〈枯死〉' },
    hp: 2600, speed: 34, dmg: 24, xp: 0, r: 56, color: '#7dff6a', sides: 8, boss: true,
  },
  boss4: {
    id: 'boss4', pattern: 'scan',
    name: { zh: '大破维魔〈観測〉', en: 'Grand Tesseracter 〈Observation〉', ja: '大テセラクター〈観測〉' },
    hp: 2800, speed: 44, dmg: 26, xp: 0, r: 54, color: '#b58cff', sides: 10, boss: true,
  },
  boss5: {
    id: 'boss5', pattern: 'smog',
    name: { zh: '大破维魔〈爆塵〉', en: 'Grand Tesseracter 〈Smog〉', ja: '大テセラクター〈爆塵〉' },
    hp: 3000, speed: 40, dmg: 28, xp: 0, r: 56, color: '#ffb25a', sides: 6, boss: true,
  },
  boss6: {
    id: 'boss6', pattern: 'regen',
    name: { zh: '大破维魔〈再生〉', en: 'Grand Tesseracter 〈Regenerate〉', ja: '大テセラクター〈再生〉' },
    hp: 3600, speed: 48, dmg: 30, xp: 0, r: 60, color: '#8fd0ff', sides: 12, boss: true,
  },
};
KUP.BOSS = id => KUP.BOSSES[id] || KUP.BOSSES.boss0;
/* 7 体 Boss 一律笨重（380°/s，与 ENEMIES.boss 同值）：它们是「大破维魔」，
 * 转身不该比小怪灵活——逐个手写 7 份没有意义，故在此统一赋值（见顶部 turn 说明）。 */
for (const k in KUP.BOSSES) if (KUP.BOSSES[k].turn == null) KUP.BOSSES[k].turn = 380;
/* 把各番街 Boss 并入敌人表（spawnEnemy 统一按 id 生成；boss0 与 KUP.ENEMIES.boss 同源） */
for (const k in KUP.BOSSES) KUP.ENEMIES[k] = KUP.BOSSES[k];
KUP.ENEMIES.boss = KUP.BOSSES.boss0;

/* 敌人查询（v0.19 新增接口；Boss 用 KUP.BOSS，杂兵/精英用 KUP.ENEMY） */
KUP.ENEMY = id => KUP.ENEMIES[id] || null;
