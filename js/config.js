window.KUP = window.KUP || {};

/* ================= 全局配置 ================= */
KUP.CONFIG = {
  VERSION: '0.13.1-nav',
  ARENA: 3000,            // 正方形竞技场边长
  PLAYER_R: 13,
  PLAYER_HIT_CD: 0.55,    // 玩家受击无敌帧
  PICKUP_BASE: 70,        // 基础拾取半径
  MAX_ENEMIES: 220,
  MAX_GEMS: 160,
  MAX_TEXTS: 40,
  BOSS_TIME: 240,         // 4:00 Boss 出现（各番街可覆盖 area.bossTime）
  ENRAGE_TIME: 300,       // 5:00 Boss 暴走
  ELITE_TIMES: [90, 150, 210], // 各番街可覆盖 area.eliteTimes
  CAM_LERP: 6,
  /* 冲刺（Shift）：主动回避机制——位移 + 无敌帧，可躲开敌方预警攻击（v0.8） */
  DASH: { CHARGES: 2, CD: 3.4, DUR: 0.16, DIST: 190, IFRAME: 0.4 },
  /* 护盾：4 秒未受伤后按此比例/秒回复（v0.8） */
  SHIELD_REGEN_DELAY: 4, SHIELD_REGEN_RATE: 0.35,
  /* ---------- 建筑实体（v0.11）：楼体＝角色与敌人不可通过的障碍物 ----------
   * 生成方式从「随机散布（互相重叠、会压住出生点）」改为**道路网格**：
   *   - 竞技场划成 GRID×GRID 的街区格（ARENA 3000 / GRID 200 = 15×15 格）；
   *   - 每格靠 roads 侧留 ROAD 宽的道路，楼体只落在格内剩余的街区带里（每格至多一栋）；
   *   - ⇒ 任意两栋楼之间必有 ≥ROAD 的通道，敌人/玩家永远不会被困死；
   *   - 楼体落在哪些格子由 seed 决定（洗牌选取），同 seed 同区仍是同一张城。
   * SOLID   ：是否启用楼体碰撞（?solid=0 可关——用于「有无实体」的对比与回退）。
   * MIN_GAP ：软间隙——可走判定把圆心挡在楼体外扩这么多像素（≥任何敌人半径，
   *           避免「软夹紧」与硬碰撞互相拉扯造成抖动；道路 80 宽仍容精英单列通行）。 */
  CITY: { SOLID: true, GRID: 200, ROAD: 80, MARGIN: 12, MIN_GAP: 22 },
  /* ---------- 绕楼寻路（v0.13.1）：敌人贴墙时的**局部避障转向** ----------
   * 敌人原本只会「直冲玩家 + 被楼体推出」：正对楼体时推出方向恰好与前进方向
   * 相反，净位移为零 ⇒ 顶着墙原地卡住（实测「逐楼正后方」放置、每样本窗口
   * ＝直线理想 +12s：旧版 88〜119/101〜126 按时到达、29〜40 体全程停滞、
   * 最长停滞 48.7 秒 ⇔ 新版全部按时到达且零停滞）。
   * 做法＝**把「指向玩家」投影到可走路径上**（不再朝墙里使劲）：
   *   ① 沿期望方向前视，畅通就直冲；
   *   ② 被挡则取挡路墙面的法线，把方向里的**进墙分量扣掉** ⇒ 只剩沿墙切向
   *      （楼体轴对齐 ⇒ 切向就是 ±x/±y），敌人「滑墙」而不是「磨墙」；
   *   ③ 正对墙面时投影退化为零（|切向| < MIN_T）⇒ 由 HOLD/navSide 的滞回
   *      决定往哪一侧滑；
   *   ④ 投影仍被挡（凹角、夹缝）才退回角度阶梯 STEP 兜底。
   * 方向本身连续（不逐档跳变），再叠 entities 侧的**角速度上限**（数据表
   * ENEMIES[*].turn，度/秒）即成为弧线绕行。
   * LOOK   ：前视距离（叠加在自身半径之上；道路 80 宽，够坦克型转身）。
   * STEP   ：兜底试探的偏角阶梯（弧度；≈31°/60°/89°/120°/152°），由小到大。
   * HOLD   ：选定绕行侧后的最短保持时间（秒）——墙面正交时的滞回，防左右横跳。
   * WOBBLE ：绕行期间横向摆动（原本的蛇行）的衰减系数（防把敌人摆进墙里）。
   * MIN_T  ：投影长度下限——低于它视为「正对墙面」，走切向 ＋ 滞回选侧。
   * SIDE_K ：换边的门槛——沿墙分量超过它才允许改绕另一侧（否则沿用 navSide）。
   * TURN   ：缺省角速度上限（度/秒）——敌人表未写 turn 时回落到它。
   * SPIN   ：防打转阈值（弧度）——朝向累计转过这么多而净位移不足一个半径，
   *          判定「卡在斜对角楼缝里」（投影方向逐帧翻转、朝向空转），
   *          改走最开阔方向逃逸 ESC_T 秒。 */
  NAV: { LOOK: 34, STEP: [0.55, 1.05, 1.55, 2.10, 2.65], HOLD: 0.4, WOBBLE: 0.25,
    MIN_T: 0.15, SIDE_K: 0.3, TURN: 600, SPIN: 8, ESC_T: 0.8 },
  /* ---------- 敌人「数字故障」抖动（v0.13.1）----------
   * 怪异的色散抖动必须**逐帧跳变**才有故障感，但渲染路径不得消费随机流
   * （AGENTS §3）。故用「离散故障时钟」：按 HZ 对时间取整数刻度，偏移由整数
   * 散列 U.hash01 给出 —— 定频跳变（每刻度保持 1/HZ 秒）、跨刷新率观感一致、
   * 且完全确定性。JITTER＝主层位移幅度（px）；SPLIT＝品红/青两层的基础错位。 */
  GLITCH: { HZ: 22, JITTER: 1.2, SPLIT: 1.6 },
  /* ---------- 治安战（v0.13）：无尽关卡 ----------
   * 规则：怪异无限涌来，**没有败北**——HP 归零只表示「战斗结束」；
   *       成绩（点数／波次／存活／净化数）记入**独立的**治安战最高记录；
   *       不发復興率、不写番街通关（避免污染主线进度）。
   * 波次：每 WAVE_T 秒推进一波，刷怪率与种类逐步升级；
   *       ELITE_EVERY 秒一体精英；BOSS_EVERY 秒一体 Boss（7 体轮换，
   *       每轮血量 ×(1 + n×HP_STEP)），Boss 出生 BOSS_ENRAGE 秒后暴走。 */
  ENDLESS: {
    WAVE_T: 30, RATE_BASE: 1.4, RATE_STEP: 0.32, RATE_MAX: 7.5,
    ELITE_EVERY: 45, BOSS_EVERY: 120, BOSS_FIRST: 60, HP_STEP: 0.35, BOSS_ENRAGE: 75,
  },
  DEFAULT_SEED: 20250314,
  DEFAULT_AREA: 'area0',
  DEFAULT_MOD: 'none',

  /* ---------- 存档与元进度（v0.7：实现在 js/store.js + js/meta.js） ----------
   * 復興率阈值/收益集中在此，便于平衡调整时不必碰存储逻辑。 */
  SAVE: {
    SCHEMA: 1,                       // 槽位存档 schema 版本（迁移链见 meta.js）
    MAX_SLOTS: 8,                    // 槽位上限
    THRESHOLDS: [0, 8, 20, 32, 45, 58, 70], // 復興率解锁阈值（index = 番街序号）
    FIRST_CLEAR: 12,                 // 首次通关某番街
    REPEAT_CLEAR: 2,                 // 重复通关
    RUN_MEASURED: 1,                 // 任意完成一局（観測データの計上）
    EGG_BONUS: 1,                    // 每枚記憶の卵
  },
};

/* 升级所需音片（フラグメント）经验曲线 */
KUP.XP_NEXT = l => 3 + l * 3 + Math.floor(Math.pow(l, 1.6));

/* 随时间缩放的难度曲线 */
KUP.HP_SCALE = t => 1 + (t / 60) * 0.28 + Math.pow(t / 60, 2) * 0.01;
KUP.DMG_SCALE = t => 1 + (t / 600) * 0.5;

/* 全局波次表（零番街基线；按时间取最后一条满足的行） */
KUP.WAVES = [
  { t: 0,   rate: 1.0, types: { noise: 1 } },
  { t: 45,  rate: 1.5, types: { noise: 4, glitch: 1 } },
  { t: 105, rate: 2.0, types: { noise: 3, glitch: 1.4, tank: 0.18 } },
  { t: 165, rate: 2.4, types: { noise: 2.6, glitch: 1.6, tank: 0.4 } },
  { t: 225, rate: 2.8, types: { noise: 2.2, glitch: 1.8, tank: 0.55 } },
  { t: 285, rate: 3.1, types: { noise: 2, glitch: 2, tank: 0.7 } },
];

/* ================= 一局（run / session）的配置 =================
 * 一局 = 一次『Q』任務。run 由 6 个字段构成：
 *   { char, area, mod, seed, companion, form }
 *   - char     : 出撃的**魔女之子** id（KUP.CHARS：森先化歩／谷置狸眼／朝主派流／夜河世界／輪廻此処）
 *   - area     : 番街 id（KUP.AREAS，REGENERATE 官方分区 零番街〜肆番街 ＋ NARRATIVE 侧 伍・陸番街）
 *   - mod      : 规则修正 id（KUP.MODIFIERS，「不可解空間」的接口）
 *   - seed     : 整数种子；决定城市布景与整局随机流（同 seed 可复现）
 *   - companion: 同行同伴 id（KUP.RECRUITS：魔女候補 天祢亜留／地邑阿栖）或 null
 *   - form     : 特殊歌唱用形態 id（KUP.FORMS）或 'none'
 * 均可由 URL 覆盖：?char=&area=&mod=&seed=&companion=&form=
 */

/* 番街（关卡主线）。命名与分区的**首要依据＝REGENERATE 官方页【官方】**：
 *   零番街＝下町／壱番街＝オフィス地区／弐番街＝歓楽街／参番街＝農園地区／肆番街＝科学研究特区（しばんがい）
 *   （佐证：动画第1集「三号街」；动画 OST「弐番街にて」；SINKA LIVE 副标题「神椿市参番街」「神椿市伍番街」）
 *   ⇒ 前五区按官方定位命名；伍・陸番街官方未给定位，本作沿用 NARRATIVE CITYGUIDE 侧分区并**显式标注**（src）。
 * 字段：
 *   role 官方定位；resident 居住的魔女之子 id（REGENERATE 官方）；faction 势力（每番街一组织）；
 *   src 'regenerate'（官方定位）| 'narrative'（NARRATIVE 侧，本作沿用并标注）；
 *   chapter 关卡章节名（动画各话副标题）；waves 独立波次表；events 章节演出；
 *   theme 地图主题；accent 界面强调色；hue/blocks/win/tone/fog 布景参数。
 * ★ 復興率（KUP.META.THRESHOLDS）解锁下一番街。 */
KUP.AREAS = [
  {
    id: 'area0', boss: 'boss0', name: { zh: '零番街', en: 'Area 0 · Lower Town', ja: '零番街' },
    role: { zh: '下町', en: 'Lower Town', ja: '下町' },
    resident: 'kaf',
    faction: { zh: '観統衿架（化歩的養育者）', en: 'Fostered by Erika KANTO', ja: '観統衿架（化歩の養育者）' },
    src: 'regenerate',
    desc: { zh: '下町。高层与下町共存，共創課オフィス与「塔」所在。', en: 'Lower town: towers over old downtown, home of the Co-creation Office.', ja: '下町。共創課オフィスと「塔」のある街。' },
    chapter: { zh: '魔女の娘 -Witchling-', en: 'Witchling', ja: '魔女の娘 -Witchling-' },
    hue: [200, 300], blocks: 130, win: 0.6, tone: 'rgba(16,10,36,0.92)', fog: 0,
    accent: '#7dd4ff',
    waves: KUP.WAVES, // 零番街＝基线节奏
  },
  {
    id: 'area1', boss: 'boss1', name: { zh: '壱番街', en: 'Area 1 · Office District', ja: '壱番街' },
    role: { zh: 'オフィス地区（办公区）', en: 'Office District', ja: 'オフィス地区' },
    resident: 'rim',
    faction: { zh: '谷置家／谷置室長（課長）', en: 'The Tanioki family / Chief Tanioki', ja: '谷置家／谷置室長（課長）' },
    src: 'regenerate',
    desc: { zh: '办公区。玻璃幕墙与再开发的明暗对比（NARRATIVE CITYGUIDE 侧另记有十九里海岸的灵异传闻）。', en: 'Office district: glass towers and redevelopment contrast (the NARRATIVE CITYGUIDE adds ghost tales of the Jūkuri shore).', ja: 'オフィス地区。再開発の明暗（NARRATIVE CITYGUIDE 側には十九里海岸の霊異譚も）。' },
    chapter: { zh: '悪意 -Malice-', en: 'Malice', ja: '悪意 -Malice-' },
    hue: [185, 235], blocks: 150, win: 0.75, tone: 'rgba(10,20,42,0.92)', fog: 0.06,
    accent: '#4ec8ff',
    waves: [
      { t: 0,   rate: 1.1, types: { noise: 1 } },
      { t: 40,  rate: 1.8, types: { noise: 3.2, glitch: 1.5 } },
      { t: 100, rate: 2.3, types: { noise: 2.6, glitch: 1.9, tank: 0.22 } },
      { t: 160, rate: 2.7, types: { noise: 2.2, glitch: 2.1, tank: 0.45 } },
      { t: 225, rate: 3.0, types: { noise: 2, glitch: 2.2, tank: 0.6 } },
      { t: 285, rate: 3.3, types: { noise: 1.8, glitch: 2.4, tank: 0.75 } },
    ],
    events: [
      { t: 120, name: { zh: '悪意累积 —— 恶意化为怪异的潮水', en: 'Malice builds — the tide swells', ja: '悪意の蓄積——悪意が怪異の潮となる' }, surge: 14 },
    ],
  },
  {
    id: 'area2', boss: 'boss2', name: { zh: '弐番街', en: 'Area 2 · Pleasure Quarter', ja: '弐番街' },
    role: { zh: '歓楽街', en: 'Pleasure Quarter', ja: '歓楽街' },
    resident: 'harusaruhi',
    faction: { zh: '台風眼（派流率领的不良少年团／黑帮）', en: 'Taifūgan (Haru\'s gang)', ja: '台風眼（派流が率いる不良集団）' },
    src: 'regenerate',
    desc: { zh: '欢乐街。哀愁横丁、逆転横丁与灯火全灭的大言霊神社；派流的地盘「台風眼」在此。', en: 'A rowdy pleasure quarter of alleys — and a shrine whose lanterns never light. Haru\'s gang "Taifūgan" holds this turf.', ja: '歓楽街。灯の消えた大言霊神社。派流の「台風眼」の縄張り。' },
    chapter: { zh: '欲望 -Desire-', en: 'Desire', ja: '欲望 -Desire-' },
    hue: [295, 400], blocks: 145, win: 0.5, tone: 'rgba(26,10,30,0.92)', fog: 0.05,
    accent: '#ff7ad9',
    waves: [
      { t: 0,   rate: 1.2, types: { noise: 1.4 } },
      { t: 45,  rate: 2.0, types: { noise: 5, glitch: 0.8 } },
      { t: 105, rate: 2.5, types: { noise: 4, glitch: 1.2, tank: 0.15 } },
      { t: 165, rate: 2.9, types: { noise: 3.4, glitch: 1.4, tank: 0.35 } },
      { t: 225, rate: 3.3, types: { noise: 3, glitch: 1.6, tank: 0.5 } },
      { t: 285, rate: 3.6, types: { noise: 2.6, glitch: 1.8, tank: 0.65 } },
    ],
    events: [
      { t: 110, name: { zh: '欲望增殖 —— 怪異贪食着街区', en: 'Desire proliferates — the aberrations feast', ja: '欲望の増殖——怪異が街を貪る' }, surge: 18 },
    ],
  },
  {
    id: 'area3', boss: 'boss3', name: { zh: '参番街', en: 'Area 3 · Farmlands', ja: '参番街' },
    role: { zh: '農園地区（农园地区）', en: 'Farmlands', ja: '農園地区' },
    resident: 'isekaijoucho',
    faction: { zh: 'ヰ世界救済教団（奉世界为「活神」的魔女崇拝教団）', en: 'Issekai Salvation Order (worships Sekai as a living god)', ja: 'ヰ世界救済教団（世界を生き神とする魔女崇拝教団）' },
    src: 'regenerate',
    desc: { zh: '农园地区。巨大農園与アネモネ自然公園，季节性的浓雾封街；「ヰ世界救済教団」的据点。', en: 'Farmland: the great plantation and Anemone Park, sealed by seasonal fog — and the seat of the Issekai Salvation Order.', ja: '農園地区。巨大農園とアネモネ自然公園、季節の濃霧。ヰ世界救済教団の拠点。' },
    chapter: { zh: 'ファミリア -Familiar-', en: 'Familiar', ja: 'ファミリア -Familiar-' },
    hue: [80, 150], blocks: 58, win: 0.25, tone: 'rgba(10,28,22,0.92)', fog: 0.18,
    accent: '#7dff9a', theme: 'farm', // 温室／田垄
    waves: [
      { t: 0,   rate: 0.9, types: { noise: 1 } },
      { t: 45,  rate: 1.4, types: { noise: 3, glitch: 0.8 } },
      { t: 100, rate: 1.8, types: { noise: 2.4, glitch: 1, tank: 0.5 } },
      { t: 160, rate: 2.2, types: { noise: 2, glitch: 1.2, tank: 0.9 } },
      { t: 225, rate: 2.6, types: { noise: 1.8, glitch: 1.4, tank: 1.1 } },
      { t: 285, rate: 2.9, types: { noise: 1.6, glitch: 1.5, tank: 1.3 } },
    ],
    events: [
      { t: 100, name: { zh: 'ファミリアの影 —— 巨躯的影子接近', en: 'Shadows of the Familiar', ja: 'ファミリアの影——巨躯の影が迫る' }, surge: 6 },
    ],
  },
  {
    id: 'area4', boss: 'boss4', name: { zh: '肆番街', en: 'Area 4 · Science Research Zone', ja: '肆番街（しばんがい）' },
    role: { zh: '科学研究特区', en: 'Science Research Zone', ja: '科学研究特区' },
    resident: 'koko',
    faction: { zh: '復興課（彩季詩得＝CIEL 在此相遇）', en: 'Reconstruction Div. (where Shieru/CIEL is met)', ja: '復興課（彩季詩得＝CIEL と出会う街）' },
    src: 'regenerate',
    desc: { zh: '科学研究特区。灾害后仍留有大量废墟，宛如反乌托邦 SF；復興課的活动区域。', en: 'The science research zone: still half in ruins, like a dystopian SF set — the Reconstruction Division\'s ground.', ja: '科学研究特区。廃墟の残るディストピア SF の貌。復興課の活動区域。' },
    chapter: { zh: '現象 -Phenomenon-', en: 'Phenomenon', ja: '現象 -Phenomenon-' },
    hue: [195, 335], blocks: 152, win: 0.35, tone: 'rgba(14,12,30,0.94)', fog: 0.1,
    accent: '#b58cff', theme: 'ruins', // 锈迹骨架
    waves: [
      { t: 0,   rate: 1.1, types: { noise: 1 } },
      { t: 40,  rate: 1.9, types: { noise: 2.6, glitch: 1.8 } },
      { t: 100, rate: 2.4, types: { noise: 2, glitch: 2.4, tank: 0.2 } },
      { t: 160, rate: 2.8, types: { noise: 1.8, glitch: 2.6, tank: 0.4 } },
      { t: 225, rate: 3.1, types: { noise: 1.6, glitch: 2.8, tank: 0.55 } },
      { t: 285, rate: 3.4, types: { noise: 1.4, glitch: 3, tank: 0.7 } },
    ],
    events: [
      { t: 110, name: { zh: '現象 —— 高速群发生', en: 'Phenomenon — a swarm manifests', ja: '現象——高速群が発生する' }, surge: 20 },
    ],
  },
  {
    id: 'area5', boss: 'boss5', name: { zh: '伍番街', en: 'Area 5 · Industrial (fan-made)', ja: '伍番街' },
    role: { zh: '工业地区（本作自创）', en: 'Industrial (original to this work)', ja: '工業地区（本作独自）' },
    resident: null,
    faction: { zh: '—（官方未给定位，本作自创）', en: '— (no official role; original to this work)', ja: '—（公式の定位なし・本作独自）' },
    src: 'narrative',
    desc: { zh: '工业地区。停工工厂、化学コンビナート与旧・眼裏町的废墟。（存在由 SINKA LIVE 副标题「神椿市伍番街」佐证，定位为本作自创）', en: 'Industry: idle plants, chemical complexes, and the ruins of old Meura-cho. (Its existence is attested by the SINKA LIVE subtitle "Kamitsubaki City Area 5"; the role here is original.)', ja: '工業地区。止まった工場と旧・眼裏町の廃墟。（存在は SINKA LIVE 副題「神椿市伍番街」で裏付け、定位は本作独自）' },
    chapter: { zh: 'ブラックアウト -Beginning of the end-', en: 'Blackout', ja: 'ブラックアウト -Beginning of the end-' },
    hue: [15, 60], blocks: 120, win: 0.5, tone: 'rgba(28,18,10,0.92)', fog: 0.22,
    accent: '#ffb25a', theme: 'industry', // 烟囱
    waves: [
      { t: 0,   rate: 0.9, types: { noise: 1 } },
      { t: 45,  rate: 1.4, types: { noise: 2.6, glitch: 1 } },
      { t: 105, rate: 1.8, types: { noise: 2, glitch: 1.2, tank: 0.55 } },
      { t: 165, rate: 2.2, types: { noise: 1.8, glitch: 1.4, tank: 0.85 } },
      { t: 225, rate: 2.5, types: { noise: 1.6, glitch: 1.6, tank: 1.1 } },
      { t: 285, rate: 2.8, types: { noise: 1.4, glitch: 1.8, tank: 1.3 } },
    ],
    events: [
      { t: 90, name: { zh: 'ブラックアウト —— 视野被夺走', en: 'Blackout — sight is stolen', ja: 'ブラックアウト——視界が奪われる' }, surge: 10, fog: 0.34, fogT: 7 },
    ],
  },
  {
    id: 'area6', boss: 'boss6', name: { zh: '陸番街', en: 'Area 6 · Restricted (fan-made)', ja: '陸番街' },
    role: { zh: '立入禁止区（本作自创）', en: 'Restricted Zone (original to this work)', ja: '立入禁止区画（本作独自）' },
    resident: null,
    faction: { zh: '—（官方未给定位，本作自创）', en: '— (no official role; original to this work)', ja: '—（公式の定位なし・本作独自）' },
    src: 'narrative',
    desc: { zh: '立入禁止区画。复兴完全未着手，几乎无建筑，只有雾与被遗弃的地面。（NARRATIVE CITYGUIDE 侧分区，本作沿用并标注）', en: 'Restricted zone. No reconstruction at all — only fog and abandoned ground. (From the NARRATIVE CITYGUIDE partition, reused with attribution.)', ja: '立入禁止区画。復興未着手、霧と放棄された地面だけ。（NARRATIVE CITYGUIDE 側の分区を出典明記で沿用）' },
    chapter: { zh: '再生 -Regenerate-', en: 'Regenerate', ja: '再生 -Regenerate-' },
    hue: [255, 300], blocks: 26, win: 0.05, tone: 'rgba(18,12,32,0.95)', fog: 0.35,
    accent: '#8f86c9', theme: 'restricted', // 雾＋残骸
    eliteTimes: [75, 135, 195], bossTime: 210, // 最后一关：精英与 Boss 提前
    waves: [
      { t: 0,   rate: 1.2, types: { noise: 1.2, glitch: 0.6 } },
      { t: 35,  rate: 2.0, types: { noise: 3, glitch: 1.8 } },
      { t: 90,  rate: 2.5, types: { noise: 2.4, glitch: 2.2, tank: 0.4 } },
      { t: 140, rate: 2.9, types: { noise: 2, glitch: 2.5, tank: 0.7 } },
      { t: 195, rate: 3.3, types: { noise: 1.8, glitch: 2.7, tank: 0.9 } },
      { t: 255, rate: 3.6, types: { noise: 1.6, glitch: 3, tank: 1.1 } },
    ],
    events: [
      { t: 100, name: { zh: '再生 -Regenerate- 前夜 —— 夺回一切', en: 'Eve of Regenerate — take it all back', ja: '再生の前夜——すべてを取り戻せ' }, surge: 24 },
    ],
  },
  /* ===== v0.13「治安战」：无尽关卡（本作模式，非官方番街）=====
   * 与番街的区别（全部由 `endless: true` 驱动）：
   *   - **没有败北**：HP 归零只表示「战斗结束」（结局文案/结算界面另走 order 分支）
   *   - **成绩独立**：最高记录写进 `META.orderBest`（点数/波次/存活/净化数），
   *     与番街 `best` 互不影响；不发復興率、不写通关次数、不落記憶の卵
   *   - **无常驻波次表**：波次/精英/Boss 由 `CONFIG.ENDLESS` 程序化生成 */
  {
    id: 'order', boss: 'boss0', endless: true, glyph: '∞',
    name: { zh: '治安战', en: 'Order War', ja: '治安戦' },
    role: { zh: '无尽战斗（本作模式）', en: 'Endless battle (original mode)', ja: '無限戦闘（本作モード）' },
    resident: null,
    faction: { zh: '復興課・治安維持（本作设定）', en: 'Reconstruction Div. — keeping order (original to this work)', ja: '復興課・治安維持（本作設定）' },
    src: 'original',
    desc: { zh: '復興課的治安维持作战——怪异没有尽头地涌来。这里<b>没有败北</b>，只有「战斗结束」；成绩记入治安战最高记录。', en: 'The Reconstruction Division\'s order-keeping operation — aberrations pour in without end. There is <b>no defeat</b> here, only "battle over"; your score is kept as the Order War record.', ja: '復興課の治安維持作戦——異形は際限なく押し寄せる。ここに<b>敗北はない</b>。「戦闘終了」と、治安戦の最高記録だけがある。' },
    chapter: { zh: '治安戦 -Order War-', en: 'Order War', ja: '治安戦 -Order War-' },
    hue: [40, 95], blocks: 110, win: 0.55, tone: 'rgba(24,16,34,0.92)', fog: 0.08,
    accent: '#ffd25a',
    waves: KUP.WAVES,   // 占位（endless 模式由 director 程序化生成，不读此表）
  },
];
KUP.AREA = id => KUP.AREAS.find(a => a.id === id) || KUP.AREAS[0];

/* 规则修正（「不可解空間」接口）——全部为**乘数**，默认为 1。
 * 官方设定：Q 把周围化为異界，内部由「无视物理法则的独自规则」支配，规则因个体而异。
 * 注意：「不可解」在官方有三层用法（花譜 LIVE 系列名／动画 OST 曲名／世界观名词）；
 *       「不可解空間」在世界观内**无官方定义**（lore §4.3），本作只借用其名做随机变异外壳，
 *       且**不得断言它与『Q』等价**。
 * 本表只承载**乘数**；非乘数型效果需另加字段与接线点，否则 modsFor 会把它当 1 处理。 */
KUP.MODS_KEYS = ['spawnRate', 'enemyHp', 'enemyDmg', 'enemySpeed', 'playerDmg', 'playerSpeed', 'cooldown', 'pickup', 'xpGain', 'dropRate'];
KUP.MODIFIERS = {
  none: { id: 'none', name: { zh: '安定空間', en: 'Stable Space', ja: '安定空間' }, desc: { zh: '无规则变异——标准的一局。', en: 'No anomaly — a standard run.', ja: '規則変異なし——標準の一局。' } },
};
KUP.MOD = id => KUP.MODIFIERS[id] || KUP.MODIFIERS.none;

/* 把修正表展开成完整乘数对象（缺项补 1） */
KUP.modsFor = id => {
  const m = KUP.MOD(id), out = {};
  for (const k of KUP.MODS_KEYS) out[k] = (m[k] !== undefined ? m[k] : 1);
  return out;
};
