/* ================= 敌人数据域（js/data/enemy.js） =================
 * 模块 id：enemy
 * 内容：KUP.ENEMY_SHAPES（八形分类）→ KUP.ENEMIES（杂兵／精英）→ KUP.BOSSES（七体番街 Boss，含 pattern）→ 并入敌人表。
 * 依赖：无。Boss 的 pattern 由 js/director.js 的 updateBossBehavior 分派；
 *       shape 由 js/entities.js 的 KUP.ENEMY_SILHOUETTES 绘制（同 id 一一对应）。
 * 纪律：turn＝角速度上限（度/秒）；zh 一律「破维魔…」，日文原词只进 ja 字段。
 * 加杂兵＝ENEMIES 加一条（必须写 shape）；加 Boss＝BOSSES 加一条 + area.boss 指向它 +
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

/* ========== 破维魔的「形」——八形分类（v0.20.1 · 2026-10-24） ==========
 * 这一层回答的是「它长什么样」，**不是阵营、不是强度**；强度仍只由 hp/dmg/speed 决定。
 *
 * 【官方依据】① 官方 3.22 新闻把「既持有テセラクター之姿、又有人型之姿」者称为
 *   ファミリア（盟友）⇒ **破维魔本来就有「人形／非人形」两种姿态**，人形不是本作发明
 *   （docs/lore/related-settings.md §6、worldview.md 行 214–222）。
 *   ② 「鱼类·爬虫·植物等非人形态」见 docs/lore/legacy-research-2025.md 行 165
 *   （⚠️ 该文件已废弃、只作形状佐证，不得据此回填设定）。
 * 【本作归纳】「鱼／人形（杂兵）／人形／爬行／虫／植物／鸟／球」这**八形**是本作为了
 *   让剪影可辨识而归纳的设计分类，**官方没有这套说法**；文案里不得写成官方设定。
 * 【纪律】形只描述外观：五体ファミリア（らぷらす＝青鱼／はすたー＝红鱼／あぐに＝爬虫／
 *   あねもす＝植物／くーげる＝半人半怪）是**盟友**，不得因为「鱼形／爬虫形／植物形」
 *   就把敌人写成他们，也不得给敌人冠以眷魔之名。八形之间不设强弱，只有「像什么」。
 * 【分工】数据侧只写 shape id；剪影在 js/entities.js 的 KUP.ENEMY_SILHOUETTES
 *   （同一 id），两边由 KUP.DATA.audit 与 verify-run 同时校验「八形齐全且一一对应」。
 * 【顺序】按人类 2026-10-24 指定的顺序排列（后续图鉴/UI 沿用此序）。 */
KUP.ENEMY_SHAPES = [
  {
    id: 'fish',
    name: { zh: '鱼形', en: 'Fish-form', ja: '魚型' },
    note: '纺锤躯干＋分叉尾鳍＋背鳍。游动时整体摆尾，速度感靠"身体在扭"而不是腿。',
  },
  {
    id: 'humanoid_mob',
    name: { zh: '人形（杂兵）', en: 'Human-form (Rank & File)', ja: '人型（雑兵）' },
    note: '前倾、细长、双臂前伸的小人形——数量型。头略大、没有五官，靠"像人但不对"制造不安。',
  },
  {
    id: 'humanoid',
    name: { zh: '人形', en: 'Human-form', ja: '人型' },
    note: '宽肩、长臂、步伐沉重的大人形——个体型（精英/Boss 级）。与杂兵同一"人形线"，但一眼更大、更稳。',
  },
  {
    id: 'reptile',
    name: { zh: '爬行类', en: 'Reptilian', ja: '爬虫類' },
    note: '低伏宽躯干＋摆动长尾＋四条短肢。贴地、笨重、转向慢——用剪影直接解释它的 turn 很低。',
  },
  {
    id: 'insect',
    name: { zh: '虫型', en: 'Insectoid', ja: '虫型' },
    note: '长腹节＋三对高频摆动的足＋触角。密集时会"糊成一片"，是数量压力的视觉来源。',
  },
  {
    id: 'plant',
    name: { zh: '植物形', en: 'Plant-form', ja: '植物型' },
    note: '中心球茎＋五片缓慢张合的叶瓣＋后拖根须。不靠移动，靠"扎根／散播"占场。',
  },
  {
    id: 'bird',
    name: { zh: '鸟型', en: 'Avian', ja: '鳥型' },
    note: '纺锤躯干＋双翼拍动＋扇形尾羽＋喙。俯冲与投掷类行为的剪影担当。',
  },
  {
    id: 'sphere',
    name: { zh: '球型', en: 'Orb', ja: '球型' },
    note: '多面体核心＋绕核碎片（本作的"数字故障体"原型）。最中性、最不像生物，适合当基线。',
  },
];

/* 形查询：未知 id 回落 null（图鉴/audit 共同口径） */
KUP.ENEMY_SHAPE = id => KUP.ENEMY_SHAPES.find(s => s.id === id) || null;

KUP.ENEMIES = {
  /* 球型：基线。无肢体的多面体核心，玩家第一眼看到的"破维魔"长相。 */
  noise: {
    id: 'noise', shape: 'sphere',
    name: { zh: '破维魔（基本型）', en: 'Tesseracter (Basic)', ja: 'テセラクター（基本型）' },
    hp: 10, speed: 62, dmg: 8, xp: 1, r: 12, color: '#8d94b8', sides: 7, turn: 600,
  },
  /* 虫型：高速、蛇行。细长剪影＋六足，在弹幕里"动得比看得清"——但血量最低，仍是可清的杂兵。 */
  glitch: {
    id: 'glitch', shape: 'insect',
    name: { zh: '破维魔（高速型）', en: 'Tesseracter (Swift)', ja: 'テセラクター（高速型）' },
    hp: 7, speed: 108, dmg: 6, xp: 2, r: 9, color: '#5959ff', sides: 5, turn: 900,
  },
  /* 爬行类：巨躯。低伏宽剪影解释"慢＋撞得疼"，转向上限也最低（turn 300）。 */
  tank: {
    id: 'tank', shape: 'reptile',
    name: { zh: '破维魔（巨躯型）', en: 'Tesseracter (Bulwark)', ja: 'テセラクター（巨躯型）' },
    hp: 60, speed: 34, dmg: 18, xp: 6, r: 20, color: '#c2507e', sides: 8, turn: 300,
  },
  /* 人形（杂兵）：数量型人形。精英出现时是"人形线"第一次抬头——后续同形杂兵都归这里。 */
  elite: {
    id: 'elite', shape: 'humanoid_mob',
    /* ★ 原名「異能テセラクター」有误——该词官方指眷魔（盟友）。这里改用中性的「強化型」。 */
    name: { zh: '破维魔（強化型）', en: 'Tesseracter (Elite)', ja: 'テセラクター（強化型）' },
    hp: 260, speed: 74, dmg: 16, xp: 30, r: 26, color: '#ffab5e', sides: 6, elite: true, turn: 450,
  },
  boss: {
    id: 'boss', shape: 'sphere',
    name: { zh: '大破维魔〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true, turn: 380,
  },
};

/* ========== 关卡 Boss：每番街一体（2026-10 追加；2026-10-24 补 shape） ==========
 * ⚠️ 全部为**本作二创**的大破维魔名（〈消音〉已是本作自拟；其余同）；
 *    命名取自各番街的官方定位/章节副标题的意象，不涉官方未公开设定。
 *    ★ 引用纪律：官方概念里**没有「消音」这类称号**（lore §12.2「◇ 大テセラクター〈消音〉」，
 *      标注为本作二创）；因此本表只在注释里保留日文原形，**zh 文案一律写「大破维魔〈…〉」**。
 *    ★ `chapter` 用的是**动画各话官方副标题**（壱＝悪意／弐＝欲望／参＝ファミリア／
 *      肆＝現象／伍＝ブラックアウト／陸＝再生），与 Boss 称号是两回事，别混用。
 * pattern 为行为模式 id，由 js/director.js 的 updateBossBehavior 分派：
 *   mute   〈消音〉   ：音波环 + 混合召唤（零番街·基线）              —— 球型：纯核心，只发"声"
 *   chase  〈緘黙〉   ：沉默地直线冲锋，冲锋沿途留下滞留伤害带（壱番街·办公区）—— 人形：沉默地走来
 *   swarm  〈誘惑〉   ：三段音波环 + 高速群召唤（弐番街·歓楽街）      —— 鱼形：诱饵灯＋鱼群
 *   blight 〈枯死〉   ：自身周围持续散播毒区，缓慢逼近（参番街·農園）—— 植物形：扎根与枯萎
 *   scan   〈観測〉   ：旋转光束扫射 + 分裂体（肆番街·科学研究特区）—— 虫型：复眼扫描
 *   smog   〈爆塵〉   ：随机轰炸 + 短暂视野遮蔽（伍番街·工业）        —— 鸟型：高空投下
 *   regen  〈再生〉   ：两阶段——前半音波环+高速群，后半轰炸+精英召唤（陸番街·终盘）—— 爬行类：蜕皮再生
 * 【2026-10-24 分类说明】七体 Boss 各占一形（球／人形／鱼／植物／虫／鸟／爬行），
 *   于是"八个形"在现有内容里全部有成员；**人形（杂兵）由 elite 担任**、**人形（个体）由 boss1 担任**。
 *   Boss 改形只改 shape 字段，剪影与行为都不受影响（行为由 pattern 决定）。 */
KUP.BOSSES = {
  boss0: {
    id: 'boss0', pattern: 'mute', shape: 'sphere',
    name: { zh: '大破维魔〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true,
  },
  boss1: {
    id: 'boss1', pattern: 'chase', shape: 'humanoid',
    name: { zh: '大破维魔〈緘黙〉', en: 'Grand Tesseracter 〈Taciturn〉', ja: '大テセラクター〈緘黙〉' },
    hp: 2200, speed: 42, dmg: 26, xp: 0, r: 50, color: '#55e0ff', sides: 6, boss: true,
  },
  boss2: {
    id: 'boss2', pattern: 'swarm', shape: 'fish',
    name: { zh: '大破维魔〈誘惑〉', en: 'Grand Tesseracter 〈Temptation〉', ja: '大テセラクター〈誘惑〉' },
    hp: 2400, speed: 48, dmg: 25, xp: 0, r: 52, color: '#ff7ad9', sides: 7, boss: true,
  },
  boss3: {
    id: 'boss3', pattern: 'blight', shape: 'plant',
    name: { zh: '大破维魔〈枯死〉', en: 'Grand Tesseracter 〈Blight〉', ja: '大テセラクター〈枯死〉' },
    hp: 2600, speed: 34, dmg: 24, xp: 0, r: 56, color: '#7dff6a', sides: 8, boss: true,
  },
  boss4: {
    id: 'boss4', pattern: 'scan', shape: 'insect',
    name: { zh: '大破维魔〈観測〉', en: 'Grand Tesseracter 〈Observation〉', ja: '大テセラクター〈観測〉' },
    hp: 2800, speed: 44, dmg: 26, xp: 0, r: 54, color: '#b58cff', sides: 10, boss: true,
  },
  boss5: {
    id: 'boss5', pattern: 'smog', shape: 'bird',
    name: { zh: '大破维魔〈爆塵〉', en: 'Grand Tesseracter 〈Smog〉', ja: '大テセラクター〈爆塵〉' },
    hp: 3000, speed: 40, dmg: 28, xp: 0, r: 56, color: '#ffb25a', sides: 6, boss: true,
  },
  boss6: {
    id: 'boss6', pattern: 'regen', shape: 'reptile',
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

/* 按「形」反查敌人（v0.20.1；同一对象只返回一次——KUP.ENEMIES 里 boss0 与 boss 是同一体）
 * 用途：图鉴分组、audit/inventory 盘点、以及"这个形还没有杂兵"的缺口检查。 */
KUP.enemiesOfShape = shape => {
  const seen = new Set(), out = [];
  for (const k in KUP.ENEMIES) {
    const e = KUP.ENEMIES[k];
    if (e && e.shape === shape && !seen.has(e)) { seen.add(e); out.push(e); }
  }
  return out;
};
