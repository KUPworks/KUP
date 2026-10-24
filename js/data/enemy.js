/* ================= 敌人数据域（js/data/enemy.js） =================
 * 模块 id：enemy
 * 内容：KUP.ENEMY_SHAPES（八形＝体型/参数原型）→ KUP.ENEMIES（杂兵／精英）→ KUP.BOSSES（七体番街 Boss，含 pattern）→ 并入敌人表。
 * 依赖：无。Boss 的 pattern 由 js/director.js 的 updateBossBehavior 分派。
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

/* ========== 破维魔的「形」——八形＝体型/参数原型（v0.20.2） ==========
 * ★ 2026-10-24 人类要求：「绘制方式等回退，只是改动参数」。
 *   因此本层**不承载绘制**：所有破维魔仍走 js/entities.js 的同一套多边形故障体，
 *   观感差异只来自数据参数（`sides` 边数、`color`、`r` 大小、移动速度）。
 *   八形在这里的作用是**参数原型与命名**——决定"这个敌人该有多快/多硬/多大/怎么转"，
 *   以及后续图鉴分组；**不是**另一套画法（剪影方案已于本版回退）。
 *
 * 【现有分工（2026-10-24 人类指定）】
 *   基本型家族（彼此只差 10–30% 的参数）：`sphere` 基线 / `bird` 鸟型 / `humanoid_mob` 人形（杂兵）
 *   高速型 ＝ `fish` 鱼形（glitch）：比基本型快约 70%、血更少、转向更灵
 *   巨躯型 ＝ `reptile` 爬行类（tank）：慢、硬、撞得疼
 *   精英   ＝ `humanoid` 人形（个体）：数量少、血量高
 *   Boss   ＝ **先选体型，再另外调参**：Boss 只借用体型的"手感方向"（鱼形偏快、植物形偏慢…），
 *            数值一律单独写，不继承任何杂兵的 hp/dmg/speed（见 BOSSES 的注释）。
 *
 * 【出处与纪律】（与绘制无关，只用于命名与设计的合法性）
 *   官方 3.22 新闻把「既持有テセラクター之姿、又有人型之姿」者称为ファミリア（盟友）
 *   ⇒ 破维魔本来就有「人形／非人形」两种姿态（docs/lore/related-settings.md §6、worldview 行 214–222）；
 *   「鱼类·爬虫·植物等非人形态」见 docs/lore/legacy-research-2025.md 行 165（⚠️ 已废弃稿，只作形状佐证）。
 *   ★「八形」本身是本作的**设计归纳**，官方没有这套说法；文案里不得写成官方设定。
 *   ★ 形只描述外观/手感，**不是阵营**：五体ファミリア（らぷらす＝青鱼／はすたー＝红鱼／あぐに＝爬虫／
 *     あねもす＝植物／くーげる＝半人半怪）是**盟友**，不得因为"鱼形/爬虫形/植物形"就把敌人写成他们，
 *     也不得给敌人冠以眷魔之名。
 * 【顺序】按人类 2026-10-24 指定的顺序排列（后续图鉴/UI 沿用此序）。 */
KUP.ENEMY_SHAPES = [
  {
    id: 'fish',
    name: { zh: '鱼形', en: 'Fish-form', ja: '魚型' },
    note: '高速型原型：速度快、血量低、转向灵，靠绕圈与突进施压（glitch＝鱼形）。',
  },
  {
    id: 'humanoid_mob',
    name: { zh: '人形（杂兵）', en: 'Human-form (Rank & File)', ja: '人型（雑兵）' },
    note: '基本型变体：比基线略慢、略硬、伤害略高；"像人但不对"的低阶人形（human_mob）。',
  },
  {
    id: 'humanoid',
    name: { zh: '人形', en: 'Human-form', ja: '人型' },
    note: '精英原型：数量少、血厚、转向稳；个体型人形（elite 与〈緘黙〉）。',
  },
  {
    id: 'reptile',
    name: { zh: '爬行类', en: 'Reptilian', ja: '爬虫類' },
    note: '巨躯原型：贴地、慢、血厚、撞得疼，turn 最低（tank 与〈再生〉）。',
  },
  {
    id: 'insect',
    name: { zh: '虫型', en: 'Insectoid', ja: '虫型' },
    note: '敏捷原型：细长、快、转向快；目前只由〈走査〉担任（Boss 选型）。',
  },
  {
    id: 'plant',
    name: { zh: '植物形', en: 'Plant-form', ja: '植物型' },
    note: '扎根原型：移动最慢、体积最大，靠散播/占场而不是追人（〈枯死〉）。',
  },
  {
    id: 'bird',
    name: { zh: '鸟型', en: 'Avian', ja: '鳥型' },
    note: '基本型变体：比基线略快、略脆、转向灵活；游走/绕行的手感（bird 与〈爆塵〉）。',
  },
  {
    id: 'sphere',
    name: { zh: '球型', en: 'Orb', ja: '球型' },
    note: '基线：无肢体、参数居中，作为"标准破维魔"的量尺（noise 与〈笛卡尔〉）。',
  },
];

/* 形查询：未知 id 回落 null（图鉴/audit 共同口径） */
KUP.ENEMY_SHAPE = id => KUP.ENEMY_SHAPES.find(s => s.id === id) || null;

KUP.ENEMIES = {
  /* 球型＝基线。所有"略有区别的变体"都相对它做 ±10–30% 的参数偏移。 */
  noise: {
    id: 'noise', shape: 'sphere',
    name: { zh: '破维魔（基本型）', en: 'Tesseracter (Basic)', ja: 'テセラクター（基本型）' },
    hp: 10, speed: 62, dmg: 8, xp: 1, r: 12, color: '#8d94b8', sides: 7, turn: 600,
  },
  /* 鸟型＝基本型变体（略快、略脆）：更快贴脸，但一碰就碎。 */
  bird: {
    id: 'bird', shape: 'bird',
    name: { zh: '破维魔（鸟型）', en: 'Tesseracter (Avian)', ja: 'テセラクター（鳥型）' },
    hp: 9, speed: 70, dmg: 7, xp: 1, r: 11, color: '#6fc6b4', sides: 6, turn: 700,
  },
  /* 人形（杂兵）＝基本型变体（略慢、略硬、略疼）：逼玩家在"清得快"与"先躲"之间做选择。 */
  human_mob: {
    id: 'human_mob', shape: 'humanoid_mob',
    name: { zh: '破维魔（人形・杂兵）', en: 'Tesseracter (Human-form, Rank & File)', ja: 'テセラクター（人型・雑兵）' },
    hp: 13, speed: 55, dmg: 9, xp: 2, r: 13, color: '#c48a6e', sides: 4, turn: 520,
  },
  /* 鱼形＝高速型：比基本型快约 70%，血量最低、转向最快（turn 900）。 */
  glitch: {
    id: 'glitch', shape: 'fish',
    name: { zh: '破维魔（高速型）', en: 'Tesseracter (Swift)', ja: 'テセラクター（高速型）' },
    hp: 7, speed: 108, dmg: 6, xp: 2, r: 9, color: '#5959ff', sides: 5, turn: 900,
  },
  /* 爬行类＝巨躯型：低伏宽躯的观感与"慢＋撞得疼"的手感一致，turn 300 最低。 */
  tank: {
    id: 'tank', shape: 'reptile',
    name: { zh: '破维魔（巨躯型）', en: 'Tesseracter (Bulwark)', ja: 'テセラクター（巨躯型）' },
    hp: 60, speed: 34, dmg: 18, xp: 6, r: 20, color: '#c2507e', sides: 8, turn: 300,
  },
  /* 人形（个体）＝精英：1:30/2:30/3:30 出现，血量高、掉落回复。 */
  elite: {
    id: 'elite', shape: 'humanoid',
    /* ★ 原名「異能テセラクター」有误——该词官方指眷魔（盟友）。这里改用中性的「強化型」。 */
    name: { zh: '破维魔（強化型）', en: 'Tesseracter (Elite)', ja: 'テセラクター（強化型）' },
    hp: 260, speed: 74, dmg: 16, xp: 30, r: 26, color: '#ffab5e', sides: 6, elite: true, turn: 450,
  },
  boss: {
    id: 'boss', shape: 'sphere',
    name: { zh: '笛卡尔', en: 'Descartes', ja: 'デカルト' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true, turn: 380,
  },
};

/* ========== 关卡 Boss：每番街一体（2026-10 追加；2026-10-24 按体型重调参） ==========
 * ★ 命名出处分两类，**不得混淆**：
 *   ① **boss0＝「笛卡尔／Descartes／デカルト」** —— **官方 REGENERATE 游戏内敌人名**
 *      （人类 2026-10-24 指出；本仓库 lore 尚未录原文，标为待补考据）。
 *      ⇒ 它是官方名，不属于「大破维魔〈○○〉」那套本作二创称号，因此**不加〈〉**。
 *   ② 其余称号（緘黙／誘惑／枯死／走査／爆塵／再生／弾片）＝**本作二创**，
 *      命名取自各番街的官方定位/章节副标题的意象，不涉官方未公开设定。
 *   ★ **「観測」一词在世界观里指観測者（玩家）**，自 v0.20.6 起不再用作敌人名——
 *      原〈観測〉改名 **〈走査〉**（行为 id 仍是 `scan`，不影响代码）。
 *   ★ **「消音」是旧的本作自拟称号**，自 v0.20.6 起不再使用（boss0 改用官方名「笛卡尔」）。
 *   ★ `chapter` 用的是**动画各话官方副标题**（壱＝悪意／弐＝欲望／参＝ファミリア／
 *      肆＝現象／伍＝ブラックアウト／陸＝再生），与 Boss 称号是两回事，别混用。
 * pattern 为行为模式 id，由 js/director.js 的 updateBossBehavior 分派：
 *   mute   笛卡尔    ：音波环 + 混合召唤（零番街·基线）              —— 球型：纯核心，只发"声"
 *   chase  〈緘黙〉   ：沉默地直线冲锋，冲锋沿途留下滞留伤害带（壱番街·办公区）—— 人形：沉默地走来
 *   swarm  〈誘惑〉   ：三段音波环 + 高速群召唤（弐番街·歓楽街）      —— 鱼形：诱饵灯＋鱼群
 *   blight 〈枯死〉   ：自身周围持续散播毒区，缓慢逼近（参番街·農園）—— 植物形：扎根与枯萎
 *   scan   〈走査〉   ：旋转光束扫射 + 分裂体（肆番街·科学研究特区）—— 虫型：复眼扫描
 *   smog   〈爆塵〉   ：随机轰炸 + 短暂视野遮蔽（伍番街·工业）        —— 鸟型：高空投下
 *   regen  〈再生〉   ：两阶段——前半音波环+高速群，后半轰炸+精英召唤（陸番街·终盘）—— 爬行类：蜕皮再生
 *
 * 【2026-10-24 人类要求：「BOSS 先选体型再另外调参」】
 *   ① **先选型**：每体 Boss 的 `shape` 先定，决定它的"手感方向"——
 *      鱼/虫/鸟偏快与灵（turn 高）、人形偏稳、植物/爬行偏慢而重（turn 低）；`r` 也按体型给（植物/爬行更大）。
 *   ② **再调参**：hp/dmg/speed 一律**单独写**，不继承任何杂兵；只服从关卡顺序的强度曲线
 *      （hp 2000 → 3800 递增；dmg 24 → 33 递增；速度按体型给出、不强行递增）。
 *   ③ 因此"同体型的杂兵很弱、Boss 很强"是**设计如此**：体型只借手感，不借数值。
 *   七体番街 Boss 各占一形（球／人形／鱼／植物／虫／鸟／爬行），治安战的第 8 体〈弾片〉
 *   取 `humanoid_mob`（人形·杂兵）⇒ **八形在 Boss 侧也各自有成员**。 */
KUP.BOSSES = {
  boss0: {
    /* 官方 REGENERATE 游戏内敌人名（人类 2026-10-24 提供；lore 待补原文） */
    id: 'boss0', pattern: 'mute', shape: 'sphere', src: 'regenerate',
    name: { zh: '笛卡尔', en: 'Descartes', ja: 'デカルト' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true, turn: 380,
  },
  boss1: {
    /* 人形：慢而稳、每一步都很疼——冲锋型行为与"沉重脚步"的体型方向一致 */
    id: 'boss1', pattern: 'chase', shape: 'humanoid',
    name: { zh: '大破维魔〈緘黙〉', en: 'Grand Tesseracter 〈Taciturn〉', ja: '大テセラクター〈緘黙〉' },
    hp: 2200, speed: 38, dmg: 28, xp: 0, r: 50, color: '#55e0ff', sides: 6, boss: true, turn: 360,
  },
  boss2: {
    /* 鱼形：七体里最快、转向最灵；伤害略让，靠"追不上"施压 */
    id: 'boss2', pattern: 'swarm', shape: 'fish',
    name: { zh: '大破维魔〈誘惑〉', en: 'Grand Tesseracter 〈Temptation〉', ja: '大テセラクター〈誘惑〉' },
    hp: 2400, speed: 58, dmg: 24, xp: 0, r: 52, color: '#ff7ad9', sides: 7, boss: true, turn: 470,
  },
  boss3: {
    /* 植物形：全场最慢、体积最大；毒区替它"走路" */
    id: 'boss3', pattern: 'blight', shape: 'plant',
    name: { zh: '大破维魔〈枯死〉', en: 'Grand Tesseracter 〈Blight〉', ja: '大テセラクター〈枯死〉' },
    hp: 2700, speed: 26, dmg: 24, xp: 0, r: 58, color: '#7dff6a', sides: 8, boss: true, turn: 280,
  },
  boss4: {
    /* 虫型：快、转向快；光束本身有前后摇，体型不额外加难度
     * ★ 原〈観測〉→〈走査〉（v0.20.6）：「観測」在世界观里指観測者（玩家），不能拿来当敌人名。 */
    id: 'boss4', pattern: 'scan', shape: 'insect',
    name: { zh: '大破维魔〈走査〉', en: 'Grand Tesseracter 〈Scanning〉', ja: '大テセラクター〈走査〉' },
    hp: 2800, speed: 50, dmg: 26, xp: 0, r: 54, color: '#b58cff', sides: 10, boss: true, turn: 450,
  },
  boss5: {
    /* 鸟型：游走、转向最快；血量略低，但轰炸密度弥补 */
    id: 'boss5', pattern: 'smog', shape: 'bird',
    name: { zh: '大破维魔〈爆塵〉', en: 'Grand Tesseracter 〈Smog〉', ja: '大テセラクター〈爆塵〉' },
    hp: 2950, speed: 54, dmg: 27, xp: 0, r: 54, color: '#ffb25a', sides: 6, boss: true, turn: 480,
  },
  boss6: {
    /* 爬行类：最慢、最硬、伤害最高——"终盘重甲"，考走位不考闪避速度 */
    id: 'boss6', pattern: 'regen', shape: 'reptile',
    name: { zh: '大破维魔〈再生〉', en: 'Grand Tesseracter 〈Regenerate〉', ja: '大テセラクター〈再生〉' },
    hp: 3800, speed: 32, dmg: 33, xp: 0, r: 62, color: '#8fd0ff', sides: 12, boss: true, turn: 320,
  },
  /* ★ v0.20.4：**射弹型** Boss（治安战第 8 体，不进主线番街）。
   * 人类 2026-10-24：「设计一个有射弹的 BOSS」。
   * - 体型取 `humanoid_mob`（人形·杂兵）：它不是"更强的个体"，而是一团挤在一起的人形在往外吐碎片，
   *   与它召唤 human_mob 的行为同一叙事；同时补上八形里唯一没有 Boss 的一形。
   * - 攻击全部由 `Danger` 的 `shot` 种类承担（见 js/entities.js）：扇形齐射 + 单发重弹，
   *   弹丸有飞行时间、会被楼体挡住 ⇒ **绕楼/侧移都能躲**，不是"贴脸必中"。
   * - 出现方式：治安战的 Boss 轮换（`Object.keys(KUP.BOSSES)`）第 8 位；
   *   调试可直接 `?boss=boss7` 在任意番街的 Boss 时刻看它。
   * ⚠️ 名称与"弾片"称号均为**本作二创**（官方无此概念）。 */
  boss7: {
    /* 人形（杂兵）体型：不是更强的个体，而是"一群人形"挤成的炮台——靠射弹而不是身体素质施压 */
    id: 'boss7', pattern: 'barrage', shape: 'humanoid_mob',
    name: { zh: '大破维魔〈弾片〉', en: 'Grand Tesseracter 〈Shrapnel〉', ja: '大テセラクター〈弾片〉' },
    hp: 3000, speed: 42, dmg: 24, xp: 0, r: 54, color: '#e0557a', sides: 7, boss: true, turn: 420,
  },
};
KUP.BOSS = id => KUP.BOSSES[id] || KUP.BOSSES.boss0;
/* 新增 Boss 若没写 turn，统一回落到 380（默认"笨重"值）。
 * 现有七体都按体型显式给了 turn（鱼/虫/鸟偏灵、植物/爬行偏重），循环不会再覆盖它们。 */
for (const k in KUP.BOSSES) if (KUP.BOSSES[k].turn == null) KUP.BOSSES[k].turn = 380;
/* 把各番街 Boss 并入敌人表（spawnEnemy 统一按 id 生成；boss0 与 KUP.ENEMIES.boss 同源） */
for (const k in KUP.BOSSES) KUP.ENEMIES[k] = KUP.BOSSES[k];
KUP.ENEMIES.boss = KUP.BOSSES.boss0;

/* 敌人查询（v0.19 新增接口；Boss 用 KUP.BOSS，杂兵/精英用 KUP.ENEMY） */
KUP.ENEMY = id => KUP.ENEMIES[id] || null;

/* 按「形」反查敌人（同一对象只返回一次——KUP.ENEMIES 里 boss0 与 boss 是同一体）
 * 用途：图鉴分组、audit/inventory 盘点、以及"这个类型还没有杂兵"的缺口检查。 */
KUP.enemiesOfShape = shape => {
  const seen = new Set(), out = [];
  for (const k in KUP.ENEMIES) {
    const e = KUP.ENEMIES[k];
    if (e && e.shape === shape && !seen.has(e)) { seen.add(e); out.push(e); }
  }
  return out;
};
