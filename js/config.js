window.KUP = window.KUP || {};

/* ================= 全局配置 ================= */
KUP.CONFIG = {
  VERSION: '0.21.4',
  ARENA: 3000,            // 正方形竞技场边长
  PLAYER_R: 13,
  PLAYER_HIT_CD: 0.55,    // 玩家受击无敌帧
  PICKUP_BASE: 70,        // 基础拾取半径
  MAX_ENEMIES: 220,
  MAX_GEMS: 480,          // 片段**全局兜底**（真正生效的是下面按格的配额）
  GEM_CELL: 240,          // v0.18.1：片段按 240px 方格分格配额
  GEM_CELL_CAP: 160,      //   每格最多 160 个，超出后在本格内合并（不再新建）
  GEM_LIFE: 300,          //   5 分钟未拾取直接消失（不结算经验）
  MAX_TEXTS: 40,
  BOSS_TIME: 240,         // 4:00 Boss 出现（各番街可覆盖 area.bossTime）
  ENRAGE_TIME: 300,       // 5:00 Boss 暴走
  ELITE_TIMES: [90, 150, 210], // 各番街可覆盖 area.eliteTimes
  CAM_LERP: 6,
  /* 冲刺（Shift）：主动回避机制——位移 + 无敌帧，可躲开敌方预警攻击（v0.8） */
  DASH: { CHARGES: 2, CD: 3.4, DUR: 0.16, DIST: 190, IFRAME: 0.4 },
  /* ---------- 护盾（v0.14 重做：**减伤膜**，不是第二管血）----------
   * 旧版（v0.8）：护盾＝独立血条，先吃伤害、吃光后溢出到生命 —— 实际就是「第二管血」，
   * 而且 HUD 把护盾条画在血条**上方**，读起来像"血条上面又有一管"。
   * 新版定义：
   *   - 护盾（shield/AURA，受「防音护盾」被动与「防音の符」影响）＝**减伤**：
   *     按**伤害类型**给出不同减伤，只对生命结算，**从不作为独立血量被扣光**；
   *   - 膜层（membrane/TEMP，即「防音の符」）+60 是**临时追加的膜**，同样只减伤，
   *     到期自动消失 —— 因此「无护盾时直接 +60」也一定有可见来源与可见数字。
   * 能量（charge）单独一条：＝护盾最近挡下的伤害累计，**只用于显示、会衰减**，
   * 不是血量、不参与结算（人类 2026-10-17：「不应做成第二管血」）。
   * 各类型的减伤见 SHIELD.REDUCE：满值护盾下贴靠＝95%、音波 85%、毒区 75%、轰炸 70%、
   * 光束 50%；强度不足时按比例打折：**22 护盾（被动 1 级）贴靠约 1%、近满值才接近 95%**，
   * 所以「防音の符」的 60 膜层是有意义的补强；贴靠另需「持续贴靠」（挡一次后 0.45s 内失效）。 */
  SHIELD: {
    AURA_MAX: 100,        // 护盾总强度上限（＝满值，满值时贴靠减伤 95%）
    /* v0.18.4（人类 2026-10-21「护盾改为每级 +20 耐久，只是保护效率和原来的第四级相同，
     * 第五级耐久满、效率也提高」）：
     *   - **耐久**（DURA_VALUES）：1～5 级＝20/40/60/80/100，被打薄的是它；
     *   - **保护效率**（EFF_VALUES）：1～4 级一律＝原第 4 级的 88（贴靠 89%），
     *     第 5 级才升到 100（贴靠 95%）——等级先加"能扛多久"，满级再加"挡得多好"；
     *   - 强度曲线仍按效率换算（k＝效率/100），与旧曲线完全兼容。 */
    DURA_VALUES: [20, 40, 60, 80, 100],
    EFF_VALUES: [88, 88, 88, 88, 100],
    AURA_LEVEL: 20,       // 兼容旧引用（每级耐久基准值；实际以 DURA_VALUES 为准）
    CONSUME: 1,           // 每挡下 1 点伤害，耐久扣 1
    REGEN_DELAY: 3,       // 脱战（不再承受任何伤害）后多久开始恢复
    REGEN_TIME: 1.5,      // 从 0 恢复到满耐久所需的秒数（期间再次受伤则重新计时）
    TEMP_MAX: 60,         // 「防音の符」追加耐久的上限（+60 一次补满）
    TEMP_EFF: 12,         // 「防音の符」额外提供的保护效率（+12，封顶 100）
    TEMP_SECONDS: 30,     // 膜层存活时间（到期自动消失——临时追加，不是永久血条）
    DECAY_T: 4,           // 能量（显示用）在半衰期内衰减到 0
    /* ★ v0.18.5：删除旧门槛 `TOUCH_UNIT`（"耐久不足 20 就不挡"）。
     * ★ v0.20.3（人类 2026-10-24「怎么又是没满就不减伤了…比如 19/40」）：
     *   再删掉 `TOUCH_ARM`（贴靠挡一次后失效）与 `TAINT_T`（被光束/轰炸打穿后失灵）——
     *   它们都会在耐久还剩很多时制造"突然不减伤"的窗口。
     *   **现在的唯一规则：耐久 > 0 就按保护效率减伤，归零才没有。** */
    REDUCE: {             // 按**伤害类型**的减伤比例（满值时的基础值）
      contact: 0.95, ring: 0.85, field: 0.75, bomb: 0.7, beam: 0.5,
    },
    HARD_CAP: 0.95,       // 任何情况下减伤不超过 95%
    /* 效率曲线（v0.14 定稿，v0.18.4 起 k 取"效率"而非当前耐久）：
     *   base × (SCALE_OFF + SCALE_MUL × k)，k＝保护效率/100。
     *   效率 88（被动 1～4 级）→ 贴靠 89%／音波 80%／光束 47%；
     *   效率 100（被动 5 级，或 1～4 级＋防音の符）→ 贴靠 95%／音波 85%／毒区 75%／轰炸 70%／光束 50%。
     * 耐久被打薄**不会降低效率**，只会让护盾更快归零（归零后才失去减伤，且没有其它失灵窗口）。 */
    SCALE_MUL: 0.52, SCALE_OFF: 0.48,
  },
  /* ---------- 暴击「会心」（v0.18.3）----------
   * 每角色的会心率/倍率/特效写在 `KUP.CRIT`（js/data/char.js），这里只放**全局闸门**：
   *   RATE_CAP / MULT_CAP：任何加成都不能让会心突破这两条线（平衡兜底）；
   *   BOSS_MULT：Boss 身上会心倍率打折——Boss 血厚、一场要打很久，
   *     全额 2.1 倍会让「会心」变成唯一解，故统一 ×0.85；
   *   MIN_DMG：会心后仍按整数显示，避免 0 伤害跳字。 */
  CRIT: { RATE_CAP: 0.60, MULT_CAP: 3.0, BOSS_MULT: 0.85 },
  /* 旧的「护盾自动回复」参数已废弃（护盾现在是减伤比率，不存在"回血"），
   * 保留常量只为旧存档/调试脚本兼容，不再被任何逻辑读取。 */
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
   * LOOK   ：前视距离（叠加在自身半径之上）——**刻意取小**：只在快要贴上墙时才转向，
   *          否则敌人会在离墙老远就开始拐弯，看起来像撞上空气墙（人类 2026-10-16 反馈）。
   *          前视 3 段采样的最近一段仅 LOOK/3，加上判定半径 ⇒ 真正触发时离墙面还有
   *          十几像素（接触距离＝自身半径），配合角速度上限刚好转得过来。
   * STEP   ：兜底试探的偏角阶梯（弧度；≈31°/60°/89°/120°/152°），由小到大。
   * HOLD   ：选定绕行侧后的最短保持时间（秒）——墙面正交时的滞回，防左右横跳。
   * WOBBLE ：绕行期间横向摆动（原本的蛇行）的衰减系数（防把敌人摆进墙里）。
   * MIN_T  ：投影长度下限——低于它视为「正对墙面」，走切向 ＋ 滞回选侧。
   * SIDE_K ：换边的门槛——沿墙分量超过它才允许改绕另一侧（否则沿用 navSide）。
   * TURN   ：缺省角速度上限（度/秒）——敌人表未写 turn 时回落到它。
   * SPIN   ：防打转阈值（弧度）——朝向累计转过这么多而净位移不足一个半径，
   *          判定「卡在斜对角楼缝里」（投影方向逐帧翻转、朝向空转），
   *          改走最开阔方向逃逸 ESC_T 秒。 */
  NAV: { LOOK: 16, STEP: [0.55, 1.05, 1.55, 2.10, 2.65], HOLD: 0.4, WOBBLE: 0.25,
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
   *       ELITE_EVERY 秒一体精英；BOSS_FIRST 秒出第 1 体 Boss，之后每 BOSS_EVERY
   *       秒一体（7 体轮换，每轮血量 ×(1 + n×HP_STEP)），Boss 出生 BOSS_ENRAGE
   *       秒后暴走。⇒ 前期四分钟一体、后期两分钟一体；
   *       若前一体未被击破就又到点，会**同时存在多体**（各自独立行动，见
   *       director.updateBossBehavior）。 */
  ENDLESS: {
    WAVE_T: 30, RATE_BASE: 1.4, RATE_STEP: 0.32, RATE_MAX: 7.5,
    ELITE_EVERY: 45, BOSS_EVERY: 120, BOSS_FIRST: 240, HP_STEP: 0.35, BOSS_ENRAGE: 75,
  },
  /* ---------- 記憶の卵（v0.17：**局内「現象」卡**，不再是局外收集品）----------
   * 人类 2026-10-19：「重设记忆之卵定位。每局有最多一次机会（且概率很低）抽到名为
   *   『记忆之卵』的『现象』卡，允许玩家复活一次，同时小 aoe 和短暂无敌帧。
   *   不做局外物品……玩家胜利结局不能重生，治安战可重生多次（概率依然很低）」。
   * 规则：
   *   · 升级三选一时，按 CHANCE **额外**多出一张現象卡（不占普通卡池、不可封禁）；
   *   · 选中 ⇒ 获得 1 次復活充能（选择本身不附带其它成长 —— 用一次升级换一条命）；
   *   · **番街一局最多出现一次**（eggOffered 一旦为真就不再抽，哪怕你没选）；
   *   · **治安战**在充能用掉之后可以再次抽到 ⇒ 可復活多次，但每次仍受同一低概率限制；
   *   · 復活只在 `state === 'playing'` 时触发 —— **胜利结局 / 结算之后不再復活**。
   * 调参：CHANCE 是"每次升级"的概率（0.6% ⇒ 一局约 8–12% 见得到）；其余是復活的手感参数。 */
  EGG: {
    CHANCE: 0.006,
    HP_PCT: 0.5,      // 復活后生命比例
    AOE_R: 240,       // 小 AOE 半径（px）
    AOE_DMG: 80,      // AOE 伤害（结算时再乘玩家 dmgMult）
    KB: 300,          // AOE 击退
    IFRAME: 2.5,      // 復活无敌帧（秒）
  },
  /* ---------- 派生卡（v0.21：两把武器合并成一把）----------
   * 人类 2026-10-25：「按照玩家当前持有的武器，可能会抽到派生卡……玩家可以选择是否
   *   要合并两个武器（释放一个武器槽）获得一把较强大的合并武器……合并武器的等级随
   *   合并前等级较低的那一把」，并追加「注意是有中等几率抽到派生而不是必抽到」。
   * 规则：
   *   · 玩家**同时持有**某条派生表里的两把武器时，每次升级按 CHANCE 掷一次；
   *   · 命中 ⇒ 四选一里出现**一张**派生卡（占普通一格，不额外多给）；未命中就照常抽；
   *   · 同一等级内重掷 / 连升不重复掷（与記憶の卵同口径），避免刷派生；
   *   · 选中 ⇒ 两把合成一把（**释放 1 个武器槽**），等级取两者中较低的那把。
   * 调参：CHANCE 是"每次升级"的概率——0.45 表示条件满足后大约每两抽见得到一次；
   *   武器槽只有 5 个，派生是"把两把压成一把、腾出槽位"的取舍，所以不宜太低也不宜必出。 */
  DERIVED: {
    CHANCE: 0.45,
  },
  /* ---------- 不可解空間（v0.18）----------
   * 人类 2026-10-20：「研究接口，BOSS战时有几率进入『不可解空间』」。
   * 规则：**Boss 出现时**掷一次 CHANCE；命中则该场 Boss 战进入一处随机「不可解空間」，
   * 规则按 `KUP.SPACES` 临时改写（战斗/经济乘数 + 少量非乘数效果），
   * 直到**触发它的那体 Boss** 被击破（治安战多体并存时同理）。
   * 空间只借用世界观名词作随机规则变异外壳，**不得断言与『Q』等价**（lore §4.3）。 */
  SPACE: {
    CHANCE: 0.35,     // 每体 Boss 出现时进入不可解空間的概率
    DELAY: 1.6,       // Boss 横幅之后多久展开空間（秒）
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
  },
};

/* 升级所需片段（フラグメント）经验曲线 */
KUP.XP_NEXT = l => 3 + l * 3 + Math.floor(Math.pow(l, 1.6));

/* 随时间缩放的难度曲线 */
KUP.HP_SCALE = t => 1 + (t / 60) * 0.28 + Math.pow(t / 60, 2) * 0.01;
KUP.DMG_SCALE = t => 1 + (t / 600) * 0.5;

/* 全局波次表（零番街基线；按时间取最后一条满足的行） */
KUP.WAVES = [
  { t: 0,   rate: 1.0, types: { noise: 0.7, bird: 0.15, human_mob: 0.15 } },
  { t: 45,  rate: 1.5, types: { noise: 2.8, bird: 0.6, human_mob: 0.6, glitch: 1 } },
  { t: 105, rate: 2.0, types: { noise: 2.1, bird: 0.45, human_mob: 0.45, glitch: 1.4, tank: 0.18 } },
  { t: 165, rate: 2.4, types: { noise: 1.82, bird: 0.39, human_mob: 0.39, glitch: 1.6, tank: 0.4 } },
  { t: 225, rate: 2.8, types: { noise: 1.54, bird: 0.33, human_mob: 0.33, glitch: 1.8, tank: 0.55 } },
  { t: 285, rate: 3.1, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 2, tank: 0.7 } },
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
 *   ⇒ 前五区按官方定位命名；伍・陸番街官方页未给定位，取自 **NARRATIVE CITYGUIDE 侧分区**
 *     （世界观详录 §8.1；日语维基条目亦列有同七区）。
 * ★ 出处等级只记在**数据层**（`src` 字段）与本注释里，**不再在界面上显示**——
 *   人类 2026-10 决定：玩家只看得到「官方定位／势力／解锁条件」这类可玩信息。
 * 字段：
 *   role 官方定位；resident 居住的魔女之子 id（REGENERATE 官方）；faction 势力（每番街一组织）；
 *   src 'regenerate'（官方定位）| 'narrative'（NARRATIVE 侧，本作沿用）| 'original'（本作模式）；
 *   chapter 关卡章节名（动画各话副标题；**治安战属于 endless，不设章节名**，避免
 *          "治安戦 · 治安戦 -Order War-" 这种重复）；waves 独立波次表；events 章节演出；
 *   theme 地图主题；accent 界面强调色；hue/blocks/win/tone/fog 布景参数。
 * ★ 復興率（KUP.META.THRESHOLDS）解锁下一番街。 */
KUP.AREAS = [
  {
    id: 'area0', boss: 'boss0', name: { zh: '零番街', en: 'Area 0', ja: '零番街' },
    /* ★ 官方英/中文出自 srd「VIRTUAL REALITY」页（逐字摘录见 docs/lore/research/official_srd_en_cn.md）：
     *   `Area 0, the downtown area`／官方中文保留「零番街」不译、只译地区性质（下町）。
     *   ⚠️ 此前写的「Lower Town」**不是官方英文**（本仓库自译），已改。 */
    role: { zh: '下町', en: 'Downtown', ja: '下町' },
    resident: 'kaf',
    /* 観統衿架：官方英文 CAST 作 `Erika Midoh`、官方中文作「观统 衿架」（⇒ 観統＝姓，Midoh） */
    faction: { zh: '観統衿架（エリカ）', en: 'Her elder sister, Erika Midoh', ja: '観統衿架（化歩の姉／養育者）' },
    src: 'regenerate',
    desc: { zh: '高层建筑与复古下町共存，城市中枢的「塔」矗立于此。', en: 'High-rises stand over the old downtown, and the city\'s central "Tower" rises here.', ja: '高層ビル群とレトロな下町が共存し、街の中枢「塔」がそびえ立つ。' },
    chapter: { zh: '魔女の娘 -Witchling-', en: 'Witchling', ja: '魔女の娘 -Witchling-' },
    hue: [200, 300], blocks: 130, win: 0.6, tone: 'rgba(16,10,36,0.92)', fog: 0,
    accent: '#7dd4ff',
    waves: KUP.WAVES, // 零番街＝基线节奏
  },
  {
    id: 'area1', boss: 'boss1', name: { zh: '壱番街', en: 'Area 1', ja: '壱番街' },
    role: { zh: '办公区', en: 'Office District', ja: 'オフィス地区' },
    resident: 'rim',
    /* 谷置室長＝谷置 制磁：官方中文页直接写作「谷置 制磁」、官方英文作 `Seiji Tanioki`
     * （⇒ 制磁＝セイジ）。本仓库长期列为「待查证」的姓名，出处至此确定。 */
    faction: { zh: '谷置家／谷置 制磁（室長）', en: 'The Tanioki family / Seiji Tanioki', ja: '谷置家／谷置室長（課長）' },
    src: 'regenerate',
    desc: { zh: '面海的副都心与旧港町相邻——玻璃幕墙与再开发的明暗对比。', en: 'A seaside subcenter beside an old port town — glass towers against the patchwork of redevelopment.', ja: '海に接する副都心と旧港町が隣り合う——再開発の明暗。' },
    chapter: { zh: '悪意 -Malice-', en: 'Malice', ja: '悪意 -Malice-' },
    hue: [185, 235], blocks: 150, win: 0.75, tone: 'rgba(10,20,42,0.92)', fog: 0.06,
    accent: '#4ec8ff',
    waves: [
      { t: 0,   rate: 1.1, types: { noise: 0.7, bird: 0.15, human_mob: 0.15 } },
      { t: 40,  rate: 1.8, types: { noise: 2.24, bird: 0.48, human_mob: 0.48, glitch: 1.5 } },
      { t: 100, rate: 2.3, types: { noise: 1.82, bird: 0.39, human_mob: 0.39, glitch: 1.9, tank: 0.22 } },
      { t: 160, rate: 2.7, types: { noise: 1.54, bird: 0.33, human_mob: 0.33, glitch: 2.1, tank: 0.45 } },
      { t: 225, rate: 3.0, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 2.2, tank: 0.6 } },
      { t: 285, rate: 3.3, types: { noise: 1.26, bird: 0.27, human_mob: 0.27, glitch: 2.4, tank: 0.75 } },
    ],
    events: [
      { t: 120, name: { zh: '恶意累积 —— 恶意化为破维魔的潮水', en: 'Malice builds — the tide swells', ja: '悪意の蓄積——悪意がテセラクターの潮となる' }, surge: 14 },
    ],
  },
  {
    id: 'area2', boss: 'boss2', name: { zh: '弐番街', en: 'Area 2', ja: '弐番街' },
    /* 官方英文作 `the entertainment district`（非「Pleasure Quarter」，后者是本仓库自译）；官方中文作「欢乐街」 */
    role: { zh: '欢乐街', en: 'Entertainment District', ja: '歓楽街' },
    resident: 'harusaruhi',
    faction: { zh: '台風眼（派流率领的不良少年团／黑帮）', en: 'Taifūgan (Haru\'s gang)', ja: '台風眼（派流が率いる不良集団）' },
    src: 'regenerate',
    desc: { zh: '哀愁横丁、逆転横丁与灯火全灭的大言霊神社；治安最差、由居民自主管理——派流的地盘「台風眼」在此。', en: 'Alleys and a shrine whose lanterns never light. The worst-policed district, run by its own residents; Haru\'s gang "Taifūgan" holds this turf.', ja: '哀愁横丁・逆転横丁と、灯の消えた大言霊神社。治安は最も悪く、住民が自主管理する——派流の「台風眼」の縄張り。' },
    chapter: { zh: '欲望 -Desire-', en: 'Desire', ja: '欲望 -Desire-' },
    hue: [295, 400], blocks: 145, win: 0.5, tone: 'rgba(26,10,30,0.92)', fog: 0.05,
    accent: '#ff7ad9',
    waves: [
      { t: 0,   rate: 1.2, types: { noise: 0.98, bird: 0.21, human_mob: 0.21 } },
      { t: 45,  rate: 2.0, types: { noise: 3.5, bird: 0.75, human_mob: 0.75, glitch: 0.8 } },
      { t: 105, rate: 2.5, types: { noise: 2.8, bird: 0.6, human_mob: 0.6, glitch: 1.2, tank: 0.15 } },
      { t: 165, rate: 2.9, types: { noise: 2.38, bird: 0.51, human_mob: 0.51, glitch: 1.4, tank: 0.35 } },
      { t: 225, rate: 3.3, types: { noise: 2.1, bird: 0.45, human_mob: 0.45, glitch: 1.6, tank: 0.5 } },
      { t: 285, rate: 3.6, types: { noise: 1.82, bird: 0.39, human_mob: 0.39, glitch: 1.8, tank: 0.65 } },
    ],
    events: [
      { t: 110, name: { zh: '欲望增殖 —— 破维魔贪食着街区', en: 'Desire proliferates — Tesseracters feast', ja: '欲望の増殖——テセラクターが街を貪る' }, surge: 18 },
    ],
  },
  {
    id: 'area3', boss: 'boss3', name: { zh: '参番街', en: 'Area 3', ja: '参番街' },
    /* 官方英文作 `the agricultural area`（非「Farmlands」）；官方中文作「农园区」 */
    role: { zh: '农园区', en: 'Agricultural Area', ja: '農園地区' },
    resident: 'isekaijoucho',
    /* ★ 教団的官方英文＝`Isekai Salvation Cult`（同页另一处作 `Church of IIsekai Salvation`，官方自身不统一）；
     *   官方中文把性质译作「**崇巫教团**」（非「魔女崇拜教团」）；生き神 官方英文＝`living deity`。 */
    faction: { zh: 'ヰ世界救済教団（参番街的崇巫教团，奉世界为「活神」）', en: 'Isekai Salvation Cult (worships Sekai as a living deity)', ja: 'ヰ世界救済教団（世界を生き神とする魔女崇拝教団）' },
    src: 'regenerate',
    desc: { zh: '巨大農園与アネモネ自然公園，季节性的浓雾封街；「ヰ世界救済教団」的据点。', en: 'The great plantation and Anemone Park, sealed by seasonal fog — and the seat of the Isekai Salvation Cult.', ja: '巨大農園とアネモネ自然公園、季節の濃霧。ヰ世界救済教団の拠点。' },
    chapter: { zh: 'ファミリア -Familiar-', en: 'Familiar', ja: 'ファミリア -Familiar-' },
    hue: [80, 150], blocks: 58, win: 0.25, tone: 'rgba(10,28,22,0.92)', fog: 0.18,
    accent: '#7dff9a', theme: 'farm', // 温室／田垄
    waves: [
      { t: 0,   rate: 0.9, types: { noise: 0.7, bird: 0.15, human_mob: 0.15 } },
      { t: 45,  rate: 1.4, types: { noise: 2.1, bird: 0.45, human_mob: 0.45, glitch: 0.8 } },
      { t: 100, rate: 1.8, types: { noise: 1.68, bird: 0.36, human_mob: 0.36, glitch: 1, tank: 0.5 } },
      { t: 160, rate: 2.2, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 1.2, tank: 0.9 } },
      { t: 225, rate: 2.6, types: { noise: 1.26, bird: 0.27, human_mob: 0.27, glitch: 1.4, tank: 1.1 } },
      { t: 285, rate: 2.9, types: { noise: 1.12, bird: 0.24, human_mob: 0.24, glitch: 1.5, tank: 1.3 } },
    ],
    events: [
      /* ★ 章节名沿用动画第5話官方副标题「ファミリア」，但**不能把眷魔写成敌人**——
       *   lore §4.2／§11 行 22：全体眷魔都是「破维魔盟友」，与对应魔女可能有摩擦，
       *   **不存在完全敌对**。故这里只写「影子横过农园」，不写“眷魔来袭”。 */
      { t: 100, name: { zh: 'ファミリアの影 —— 巨躯的影子横过农园', en: 'Shadows of the Familiar — a giant shape crosses the fields', ja: 'ファミリアの影——巨躯の影が農地を横切る' }, surge: 6 },
    ],
  },
  {
    id: 'area4', boss: 'boss4', name: { zh: '肆番街', en: 'Area 4', ja: '肆番街（しばんがい）' },
    role: { zh: '科学研究特区', en: 'Science Research Zone', ja: '科学研究特区' },
    resident: 'koko',
    faction: { zh: '復興課（彩季詩得＝CIEL 在此相遇）', en: 'Reconstruction Div. (where Ciel Saiki is met)', ja: '復興課（彩季詩得＝CIEL と出会う街）' },
    src: 'regenerate',
    desc: { zh: '曾是学问与艺术之街，灾害后大半沦为废墟，宛如反乌托邦 SF；復興課的活动区域。', en: 'Once a district of learning and the arts, now largely ruins, like a dystopian SF set — the Reconstruction Division\'s ground.', ja: 'かつては学問と芸術の街、災害後は大半が廃墟となりディストピア SF の貌。復興課の活動区域。' },
    chapter: { zh: '現象 -Phenomenon-', en: 'Phenomenon', ja: '現象 -Phenomenon-' },
    hue: [195, 335], blocks: 152, win: 0.35, tone: 'rgba(14,12,30,0.94)', fog: 0.1,
    accent: '#b58cff', theme: 'ruins', // 锈迹骨架
    waves: [
      { t: 0,   rate: 1.1, types: { noise: 0.7, bird: 0.15, human_mob: 0.15 } },
      { t: 40,  rate: 1.9, types: { noise: 1.82, bird: 0.39, human_mob: 0.39, glitch: 1.8 } },
      { t: 100, rate: 2.4, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 2.4, tank: 0.2 } },
      { t: 160, rate: 2.8, types: { noise: 1.26, bird: 0.27, human_mob: 0.27, glitch: 2.6, tank: 0.4 } },
      { t: 225, rate: 3.1, types: { noise: 1.12, bird: 0.24, human_mob: 0.24, glitch: 2.8, tank: 0.55 } },
      { t: 285, rate: 3.4, types: { noise: 0.98, bird: 0.21, human_mob: 0.21, glitch: 3, tank: 0.7 } },
    ],
    events: [
      { t: 110, name: { zh: '現象 —— 高速群发生', en: 'Phenomenon — a swarm manifests', ja: '現象——高速群が発生する' }, surge: 20 },
    ],
  },
  {
    id: 'area5', boss: 'boss5', name: { zh: '伍番街', en: 'Area 5', ja: '伍番街' },
    /* 伍・陸番街：官方英/中文页都没给（官方 EN 页只到 Area 4）⇒ 沿用 zh/ja 命名规则自译，标注为沿用 */
    role: { zh: '工业地区', en: 'Industrial Area', ja: '工業地区' },
    resident: null,
    /* 官方页未给本区组织；NARRATIVE 侧亦无对应势力 ⇒ 留空（UI 会跳过该行，不显示「势力：—」） */
    faction: null,
    src: 'narrative',
    /* 出处：区名与「工業地区」定位取自 NARRATIVE CITYGUIDE 侧分区（世界观详录 §8.1；
     * 日语维基「舞台『神椿市』」条亦列有同七区）。存在另由 SINKA LIVE 副标题「神椿市伍番街」佐证。
     * ⚠️ 旧文案写「定位为本作自创」**有误**——本区不是自创，是沿用 NARRATIVE 分区。 */
    desc: { zh: '停工工厂、化学联合企业与旧・眼裏町的废墟。', en: 'Idle plants, chemical complexes, and the ruins of old Meura-chō.', ja: '止まった工場と化学コンビナート、旧・眼裏町の廃墟。' },
    chapter: { zh: 'ブラックアウト -Beginning of the end-', en: 'Blackout', ja: 'ブラックアウト -Beginning of the end-' },
    hue: [15, 60], blocks: 120, win: 0.5, tone: 'rgba(28,18,10,0.92)', fog: 0.22,
    accent: '#ffb25a', theme: 'industry', // 烟囱
    waves: [
      { t: 0,   rate: 0.9, types: { noise: 0.7, bird: 0.15, human_mob: 0.15 } },
      { t: 45,  rate: 1.4, types: { noise: 1.82, bird: 0.39, human_mob: 0.39, glitch: 1 } },
      { t: 105, rate: 1.8, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 1.2, tank: 0.55 } },
      { t: 165, rate: 2.2, types: { noise: 1.26, bird: 0.27, human_mob: 0.27, glitch: 1.4, tank: 0.85 } },
      { t: 225, rate: 2.5, types: { noise: 1.12, bird: 0.24, human_mob: 0.24, glitch: 1.6, tank: 1.1 } },
      { t: 285, rate: 2.8, types: { noise: 0.98, bird: 0.21, human_mob: 0.21, glitch: 1.8, tank: 1.3 } },
    ],
    events: [
      { t: 90, name: { zh: 'ブラックアウト —— 视野被夺走', en: 'Blackout — sight is stolen', ja: 'ブラックアウト——視界が奪われる' }, surge: 10, fog: 0.34, fogT: 7 },
    ],
  },
  {
    id: 'area6', boss: 'boss6', name: { zh: '陸番街', en: 'Area 6', ja: '陸番街' },
    role: { zh: '立入禁止区画', en: 'Restricted Zone', ja: '立入禁止区画' },
    resident: null,
    /* 同 area5：本区无对应组织（NARRATIVE 侧亦无），留空让 UI 跳过 */
    faction: null,
    src: 'narrative',
    /* 出处：区名与「立入禁止区画」定位取自 NARRATIVE CITYGUIDE 侧分区（世界观详录 §8.1）。
     * ⚠️ 旧文案写「本作自创」**有误**——本区不是自创，是沿用 NARRATIVE 分区。 */
    desc: { zh: '复兴完全未着手，几乎无建筑，只有雾与被遗弃的地面。', en: 'No reconstruction at all — only fog and abandoned ground.', ja: '復興未着手、霧と放棄された地面だけ。' },
    chapter: { zh: '再生 -Regenerate-', en: 'Regenerate', ja: '再生 -Regenerate-' },
    hue: [255, 300], blocks: 26, win: 0.05, tone: 'rgba(18,12,32,0.95)', fog: 0.35,
    accent: '#8f86c9', theme: 'restricted', // 雾＋残骸
    eliteTimes: [75, 135, 195], bossTime: 210, // 最后一关：精英与 Boss 提前
    waves: [
      { t: 0,   rate: 1.2, types: { noise: 0.84, bird: 0.18, human_mob: 0.18, glitch: 0.6 } },
      { t: 35,  rate: 2.0, types: { noise: 2.1, bird: 0.45, human_mob: 0.45, glitch: 1.8 } },
      { t: 90,  rate: 2.5, types: { noise: 1.68, bird: 0.36, human_mob: 0.36, glitch: 2.2, tank: 0.4 } },
      { t: 140, rate: 2.9, types: { noise: 1.4, bird: 0.3, human_mob: 0.3, glitch: 2.5, tank: 0.7 } },
      { t: 195, rate: 3.3, types: { noise: 1.26, bird: 0.27, human_mob: 0.27, glitch: 2.7, tank: 0.9 } },
      { t: 255, rate: 3.6, types: { noise: 1.12, bird: 0.24, human_mob: 0.24, glitch: 3, tank: 1.1 } },
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
    faction: { zh: '復興課・治安維持', en: 'Reconstruction Div. — keeping order', ja: '復興課・治安維持' },
    src: 'original',
    desc: { zh: '復興課的治安维持作战——破维魔没有尽头地涌来。这里<b>没有败北</b>，只有「战斗结束」；成绩记入治安战最高记录。', en: 'The Reconstruction Division\'s order-keeping operation — Tesseracters pour in without end. There is <b>no defeat</b> here, only "battle over"; your score is kept as the Order War record.', ja: '復興課の治安維持作戦——テセラクターは際限なく押し寄せる。ここに<b>敗北はない</b>。「戦闘終了」と、治安戦の最高記録だけがある。' },
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
/* 两组乘数相乘（基础修正 × 不可解空間）——缺项一律按 1 处理 */
KUP.combineMods = (a, b) => {
  const out = {};
  for (const k of KUP.MODS_KEYS) {
    const x = (a && a[k] !== undefined) ? a[k] : 1;
    const y = (b && b[k] !== undefined) ? b[k] : 1;
    out[k] = x * y;
  }
  return out;
};

/* ================= 不可解空間（v0.18）=================
 * 世界观依据：『Q』把周围化为「異界」，内部由「无视物理法则的独自规则」支配、**规则因个体而异**
 * （动画/官方游戏均出现该词；「不可解空間」在世界观内**无官方定义**，见 docs/lore/related-settings.md §4.3）。
 * 本作只把它当**随机规则变异**的叙事外壳：效果全部由乘数驱动，另有两个非乘数字段——
 *   · `fog`      追加雾浓度（复用 render 的雾气层）
 *   · `ultLock`  封印浄化の歌（HUD 充能条置灰）
 *   · `rotateEvery` 每隔 N 秒随机改写为另一条空间（錯乱空間）
 * 进入/退出时会**按比例同步活着敌人的 speed/dmg/maxhp**，所以不是"只影响新刷的怪"；
 * 玩家的 playerDmg/playerSpeed/cooldown/pickup 走 `Player.recompute()` 即时生效。 */
KUP.SPACES = [
  {
    id: 'dense', weight: 1,
    name: { zh: '過密空間', en: 'Overcrowded Space', ja: '過密空間' },
    desc: {
      zh: '破维魔成群涌来，但被空间压得更脆——片段掉落也更多。',
      en: 'Tesseracters swarm in, but the space makes them brittle — more fragments drop.',
      ja: 'テセラクターが群れで押し寄せるが、空間に押し潰されて脆い——フラグメントも増える。',
    },
    color: '#ff9a5a', mods: { spawnRate: 1.6, enemyHp: 0.85, dropRate: 1.15 },
  },
  {
    id: 'fog', weight: 1,
    name: { zh: '深霧空間', en: 'Deep-Fog Space', ja: '深霧空間' },
    desc: {
      zh: '浓雾吞没视野；作为补偿，拾取范围与经验获取提高。',
      en: 'Thick fog swallows your sight; pickup range and XP gain rise to compensate.',
      ja: '濃霧が視界を呑む。代わりに拾取範囲と獲得経験が上がる。',
    },
    color: '#9a90d6', mods: { enemySpeed: 0.9, pickup: 1.2, xpGain: 1.15 }, fog: 0.22,
  },
  {
    id: 'stiff', weight: 1,
    name: { zh: '硬直空間', en: 'Rigid Space', ja: '硬直空間' },
    desc: {
      zh: '身体像被灌了铅——移动变慢，但冷却缩短、伤害提高。',
      en: 'Your body feels leaden — slower movement, but shorter cooldowns and more damage.',
      ja: '身体が鉛のように重い——移動は遅いが、冷却短縮・与ダメージ上昇。',
    },
    color: '#8fd0ff', mods: { playerSpeed: 0.9, cooldown: 0.85, playerDmg: 1.1 },
  },
  {
    id: 'mute', weight: 1,
    name: { zh: '静音空間', en: 'Muted Space', ja: '静音空間' },
    desc: {
      zh: '声音被空间吞掉——伤害大幅提升，代价是**浄化の歌被封印**。',
      en: 'Sound is swallowed — damage surges, but the **Song of Purification is sealed**.',
      ja: '音が空間に呑まれる——与ダメージは大きく上がるが、**浄化の歌は封じられる**。',
    },
    color: '#ff5aa8', mods: { playerDmg: 1.3, enemyDmg: 1.15 }, ultLock: true,
  },
  {
    id: 'bloom', weight: 1,
    name: { zh: '豊穣空間', en: 'Abundant Space', ja: '豊穣空間' },
    desc: {
      zh: '片段如雨——拾取与经验大增，代价是敌人更快。',
      en: 'A rain of fragments — pickup and XP soar, but enemies move faster.',
      ja: 'フラグメントの雨——拾取と経験が大きく伸びるが、敵は速くなる。',
    },
    color: '#8affc9', mods: { pickup: 1.5, xpGain: 1.2, enemySpeed: 1.15 },
  },
  {
    id: 'heat', weight: 1,
    name: { zh: '高熱空間', en: 'Heat Space', ja: '高熱空間' },
    desc: {
      zh: '空间灼烧着双方——你的伤害与受到的伤害同时提高。',
      en: 'The space scalds both sides — your damage and the damage you take both rise.',
      ja: '空間が双方を灼く——与ダメージも被ダメージも上がる。',
    },
    color: '#ffd25a', mods: { playerDmg: 1.3, enemyDmg: 1.3 },
  },
  {
    id: 'chaos', weight: 1,
    name: { zh: '錯乱空間', en: 'Chaos Space', ja: '錯乱空間' },
    desc: {
      zh: '规则本身不稳定——每隔一段时间随机改写为另一条空间。',
      en: 'The rules themselves are unstable — every so often they rewrite into another space.',
      ja: '規則そのものが不安定——一定時間ごとに別の空間へ書き換わる。',
    },
    color: '#ffe89a', mods: {}, rotateEvery: 25,
  },
];
KUP.SPACE_DEF = id => KUP.SPACES.find(s => s.id === id) || null;
