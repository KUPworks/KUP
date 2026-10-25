/* ================= 武器数据域（js/data/weapon.js） =================
 * 模块 id：weapon
 * 内容：KUP.WEAPON_MODULES（模组＝玩法实现：base 基准值／params 参数白名单／area 范围生效面）
 *       → KUP.WEAPONS（具体武器：等级表／lvDesc／覚醒 evolved）。
 * 依赖：语义上依赖 char（owner 指向角色 id），运行时由 game.js 分派 behavior。
 * 纪律：一把武器只声明 behavior；几何与调参口径只写在模组里，不要在 game.js 里写死常数。
 * 加武器＝WEAPONS 加一条并指向已有模组；加模组＝WEAPON_MODULES 加一条 + game.js 注册分派。
 * ================================================================ */

window.KUP = window.KUP || {};

/* ---------- 武器（歌＝魔法） ----------
 * ★ v0.11「武装解锁」：owner ＝ 该武器的持有角色 id（KUP.CHARS）。
 *   - **未招募该角色前，这把武器不会进入升级卡池**（rollChoices 过滤，见 game.js）；
 *   - 招募后该角色的专属武器才会作为「新武器」出现在三选一里；
 *   - owner 为 null/undefined 的武器（通用组：滞留・投掷系等）任何角色都能抽到。
 * ★ v0.12「角度参数化」：等级表可带**角度／长度**参数，由行为分派消费：
 *   - slash：「近战·挥刀」——arc＝扇形角度（**度**）、len＝刀长（px）；
 *              Lv4+ 的 wave｛arc（度）/r/speed/dmgMul｝＝扇形冲击波（复用 Ring 的角度参数）。
 *   - bass ：「圆形波」——arc＝扇形角度（**度**，缺省 360＝整圆，既有武器不变）；
 *              传入 <360 即变为**定向扇形冲击波**（dir 取当前瞄准方向）。
 * ★ v0.13.1「模组化」：几何常数与「哪些参数随哪个 BUFF 放大」全部收进下面的
 *   KUP.WEAPON_MODULES（模组注册表），分派（js/game.js WeaponRuntime.update）
 *   不再写死数字。 */
/* ---------- 三层命名：武器 id ≠ 模组 id ≠ 模组族（v0.20）----------
 * 过去的表把「武器 id」和「模组 id」混在同一个命名空间里（`note` 既是武器又是模组、
 * `lance`/`bass`/`orbit` 同理），读代码时无法判断一个 id 指的是**哪首曲子**还是
 * **哪段行为**。v0.20 起明确拆成三层，**任何一层都不许和另一层重名**（audit 会拦）：
 *
 *   ① 武器 id（KUP.WEAPONS）        —— **数据**：一首歌／一位角色的武装。
 *                                      例：`note`＝私論理、`bass`＝テラ、`lance`＝the last bullet。
 *   ② 模组 id（KUP.WEAPON_MODULES） —— **行为**：一段可复用的玩法实现。
 *                                      例：`homing`＝追踪弹、`sniper`＝贯通狙击弹。
 *   ③ 模组族（KUP.WEAPON_FAMILIES） —— **大模组**：把同族行为收在一起。
 *                                      例：`projectile` 含 homing/sniper/machinegun/shotgun。
 *
 * 对应关系：武器.behavior → 模组.id；模组.family → 模组族.id。
 * 查询：KUP.MODULE(id) / KUP.MODULE_OF(武器id) / KUP.WEAPONS_OF(模组id)
 *       KUP.FAMILY(id) / KUP.MODULES_OF_FAMILY(族id) / KUP.FAMILY_OF_MODULE(模组id) / KUP.FAMILY_OF(武器id)
 *
 * 模组字段：
 *   - `base`  ：**模组级基准值**——等级表没写同名键时用它（加武器/改手感只动一处）。
 *   - `params`：该模组的等级表**可用参数键**（verify-run 与 audit 会校验武器表的键不越界）。
 *   - `area`  ：**受「范围」(areaMult) 放大的键**——判定与外观一起放大；其余键（如光束
 *              宽度、弹体存活时间）刻意不随范围变化，列在这里就是明确的口径。
 *   - `entity`：产出的实体类型（便于查「这把武器在场上生成什么」）。
 * 加武器＝WEAPONS 加一条并指向已有模组；加模组＝WEAPON_MODULES 加一条（声明 family）
 * ＋ game.js 注册分派；加模组族＝WEAPON_FAMILIES 加一条并把模组登记进 modules 清单。 */
KUP.WEAPON_FAMILIES = {
  projectile: {
    id: 'projectile', entity: 'Projectile',
    name: { zh: '弹道系', en: 'Projectile', ja: '弾道系' },
    desc: {
      zh: '把歌声装填成弹体的大模组：追踪弹、贯通狙击、连射、散弹都在这一族，共享「弹体命中」这一套判定。',
      en: 'The big projectile module: homing shots, piercing snipes, repeater fire and scatter pellets all share the same hit test.',
      ja: '歌を弾体に装填する大モジュール。追尾弾・貫通狙撃・連射・散弾が同じ命中判定を共有する。',
    },
    modules: ['homing', 'sniper', 'machinegun', 'shotgun', 'typhoon'],
  },
  orbit: {
    id: 'orbit', entity: 'WeaponRuntime.orbs',
    name: { zh: '环绕系', en: 'Orbit', ja: '周回系' },
    desc: { zh: '贴着玩家绕转、以球体本身接触判定的模组。', en: 'Orbs that circle close to the player and hit with their bodies.', ja: '自機の周りを回り、球体そのものの接触で当てるモジュール。' },
    modules: ['orbital'],
  },
  wave: {
    id: 'wave', entity: 'Ring',
    name: { zh: '波动系', en: 'Wave', ja: '波動系' },
    desc: { zh: '以玩家为中心向外扩散的冲击环（可收窄成扇形）。', en: 'Shock rings expanding from the player (optionally narrowed into a sector).', ja: '自機中心から広がる衝撃環（扇形にも窄められる）。' },
    modules: ['shock'],
  },
  melee: {
    id: 'melee', entity: 'Slash',
    name: { zh: '近战系', en: 'Melee', ja: '近接系' },
    desc: { zh: '朝瞄准方向挥出的扇形斩击。', en: 'Fan-shaped slashes swung toward your aim.', ja: '照準方向へ振る扇形の斬撃。' },
    modules: ['cleave'],
  },
  beam: {
    id: 'beam', entity: 'Beam',
    name: { zh: '光束系', en: 'Beam', ja: 'ビーム系' },
    desc: { zh: '瞬间贯穿的定向光束。', en: 'Instant piercing beams.', ja: '瞬時に貫く指向性ビーム。' },
    modules: ['beam'],
  },
  field: {
    id: 'field', entity: 'Toss → Zone',
    name: { zh: '区域系', en: 'Field', ja: '領域系' },
    desc: { zh: '投掷、空爆、地雷等「先在场上留下东西」的模组。', en: 'Thrown bricks, air raids and mines — anything that leaves something on the field.', ja: '投擲・空爆・地雷など「場に何かを残す」モジュール。' },
    modules: ['lob', 'blast', 'minefield'],
  },
  curse: {
    id: 'curse', entity: 'Zone（devour）／Beam（chain）',
    name: { zh: '咒缚系', en: 'Curse', ja: '呪縛系' },
    desc: { zh: '吞噬与连锁——聚拢敌人再引爆，或沿最近的敌人一路传过去。', en: 'Devour and chain: gather foes and detonate, or leap from the nearest foe to the next.', ja: '捕食と連鎖——敵を集めて炸裂させ、或いは最寄りから次へ伝う。' },
    modules: ['devour', 'chain'],
  },
  summon: {
    id: 'summon', entity: 'Summon',
    name: { zh: '召唤系', en: 'Summon', ja: '召喚系' },
    desc: { zh: '在场上留下会自行攻击的幻影（新的 Summon 实体）。', en: 'Leaves a phantasm on the field that attacks on its own (the new Summon entity).', ja: '場に自律攻撃する幻影を残す（新しい Summon 実体）。' },
    modules: ['summon'],
  },
  /* v0.21：**合奏系**——只有「派生（合并）武装」用的族。
   * 两把普通武器合成一把（占 1 槽）后，几何取自原来的两族，但每轮只按一套效率运转：
   * 「强于其中任意一把、弱于两把叠加」。 */
  duet: {
    id: 'duet', entity: 'Projectile／Ring／Zone／Beam（组合）',
    name: { zh: '合奏系', en: 'Duet', ja: '合奏系' },
    desc: {
      zh: '派生（合并）武装专用的大模组：两首歌合成一把，手感取自原来的两族，但每轮只按一套效率运转。',
      en: 'The big module for derived (merged) weapons: two songs become one, keeping both origins\' feel while running a single set of beats per cycle.',
      ja: '派生（合体）武装専用の大モジュール。二曲が一つになり、元の二族の手触りを残しつつ、一巡は一組の拍でしか動かない。',
    },
    modules: ['chorus', 'abyss', 'gale', 'scar', 'stigma'],
  },
};
KUP.FAMILY = id => KUP.WEAPON_FAMILIES[id] || null;
KUP.MODULES_OF_FAMILY = fid => {
  const f = KUP.WEAPON_FAMILIES[fid];
  return f ? (f.modules || []).map(id => KUP.WEAPON_MODULES[id]).filter(Boolean) : [];
};
KUP.FAMILY_OF_MODULE = mid => {
  const m = KUP.WEAPON_MODULES[mid];
  return m ? KUP.FAMILY(m.family) : null;
};
KUP.FAMILY_OF = wid => {
  const m = KUP.WEAPONS && KUP.WEAPONS[wid] ? KUP.WEAPON_MODULES[KUP.WEAPONS[wid].behavior] : null;
  return m ? KUP.FAMILY(m.family) : null;
};

KUP.WEAPON_MODULES = {
  homing: {
    id: 'homing', family: 'projectile', entity: 'Projectile',
    name: { zh: '追踪弹', en: 'Homing Shot', ja: '追尾弾' },
    desc: { zh: '朝最近敌人射出追踪弹体；尺寸随「范围」放大。', en: 'Homing shots at the nearest foe; size scales with Area.', ja: '最寄りへ追尾弾を放つ。大きさは「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'split'],
    base: { speed: 400, r: 7, life: 2.2, homing: 5.2, pierce: 0 },
    area: ['r'],
  },
  orbital: {
    id: 'orbital', family: 'orbit', entity: 'WeaponRuntime.orbs',
    name: { zh: '环绕音球', en: 'Resonant Orbs', ja: 'レゾナンス・オーブ' },
    desc: {
      zh: '音球**紧贴玩家**绕转，只有球体本身接触才算命中；环绕半径与球体体积随「范围」放大，转速随「冷却」提升。',
      en: 'Orbs circle **close to you**; only the orb body itself deals contact damage. Orbit radius and orb size scale with Area, spin with Cooldown.',
      ja: '音球は**自機のすぐ周り**を周回し、球体そのものの接触のみが命中。周回半径と球体サイズは「範囲」、回転速度は「クールダウン」で伸びる。',
    },
    /* v0.15.1：**取消径向呼吸**，改为把球拉近玩家（半径 88→50 起）。
     * 设计口径（半圈律）：普通破维魔 noise（移速 62）走过球体直径 2×orbR 的时间
     * t＝2·orbR/62，武器在这段时间里恰好转半圈 ⇒ spin ≈ 97.4/orbR。
     * 球体逐级变大，所以角速度逐级略降（线速度基本不变）；「冷却」仍按比例放大转速。
     * orbR 11→20（球体更大）、hitCd 0.45→0.30（同一目标更快再命中）——这两项是判定
     * 改回"球体本身"后的强度补偿（口径见 verify-run 的 orbit 强度预算断言）。 */
    params: ['dmg', 'count', 'r', 'spin', 'orbR', 'hitCd'],
    base: { r: 50, spin: 4.8, orbR: 20, hitCd: 0.3 },
    area: ['r', 'orbR'],
  },
  shock: {
    id: 'shock', family: 'wave', entity: 'Ring',
    name: { zh: '圆形波', en: 'Shock Ring', ja: '衝撃リング' },
    desc: { zh: '以玩家为中心扩散的冲击环（可定向成扇形）；扩散半径随「范围」放大。', en: 'A ring expanding from you (can be a sector); radius scales with Area.', ja: '自機中心に広がる衝撃環（扇形化も可）。半径は「範囲」で拡大。' },
    params: ['cd', 'dmg', 'r', 'double', 'arc', 'kb'],
    base: { speed: 300, kb: 170, arc: 360, doubleSpeed: 220, doubleKb: 140, doubleDmgMul: 0.7 },
    area: ['r'],
  },
  cleave: {
    id: 'cleave', family: 'melee', entity: 'Slash',
    name: { zh: '近战・挥刀', en: 'Melee Slash', ja: '近接・斬撃' },
    desc: { zh: '朝瞄准方向挥出的扇形斩击；**刀长**随「范围」放大，扇形角度由数据表指定。', en: 'A fan-shaped slash toward your aim; **blade length** scales with Area, angle comes from data.', ja: '照準方向への扇形斬撃。**刀長**は「範囲」で拡大、角度はデータ表で指定。' },
    params: ['cd', 'dmg', 'len', 'arc', 'kb', 'life', 'wave'],
    base: { arc: 100, kb: 180, life: 0.18, 'wave.r': 120, 'wave.arc': 120, 'wave.speed': 420, 'wave.dmgMul': 0.75 },
    area: ['len', 'wave.r'],
  },
  beam: {
    id: 'beam', family: 'beam', entity: 'Beam',
    name: { zh: '贯穿光束', en: 'Piercing Beam', ja: '貫通ビーム' },
    desc: { zh: '瞬间贯穿的定向光束；**长度**随「范围」放大，宽度不随范围变化。', en: 'An instant piercing beam; **length** scales with Area, width does not.', ja: '瞬時に貫くビーム。**長さ**は「範囲」で拡大、太さは変わらない。' },
    params: ['cd', 'dmg', 'len', 'w', 'double', 'targets'],
    /* v0.14：double（第二条光束）改向**第二个不同的敌人**发射；只有一个目标时改发**对向**
     * （dir+π，即"前后"）。不再用 doubleAngle 张开 0.3rad 的夹角——那会让两条光束都打不中。 */
    base: { doubleAngle: 0, doubleDmgMul: 0.7, targets: 2, arc: { k: 0.5 } },
    area: ['len'],
  },
  sniper: {
    id: 'sniper', family: 'projectile', entity: 'Projectile',
    name: { zh: '穿透音枪', en: 'Piercing Lance', ja: '貫通ランス' },
    desc: { zh: '高速穿透弹体；命中半径随「范围」放大（飞行距离不变）。', en: 'A fast piercing shot; hit radius scales with Area (travel distance unchanged).', ja: '高速貫通弾。命中半径は「範囲」で拡大（飛距離は不変）。' },
    params: ['cd', 'dmg', 'count', 'pierce', 'spread', 'targets'],
    /* v0.14：齐射按「最近 N 个不同的敌人」分配方向（targets，缺省 2），
     * 多余的弹体才围绕基准方向补角；spread 从「张开一个大夹角」改为**很小的夹角**（≈5°）。 */
    base: { speed: 560, r: 8, life: 1.6, spread: 0.085, targets: 2 },
    area: ['r'],
  },
  /* v0.20：**连射**——有弹夹（mag）与换弹（reload）参数；打空后停火换弹。
   *   cd＝两发之间的间隔（秒）；mag＝弹夹容量（发）；reload＝换弹时间（秒）；
   *   count＝每次扣扳机同时射出的弹数（Lv4 起 2 发，仍只消耗 1 发弹药）。
   * 与 sniper 的分工：sniper「慢、准、贯通」，machinegun「快、密、不贯通」。 */
  machinegun: {
    id: 'machinegun', family: 'projectile', entity: 'Projectile',
    name: { zh: '连射', en: 'Repeater', ja: '連射' },
    desc: {
      zh: '高射速弹体，**有弹夹**：打空后进入换弹，换弹期间停火。命中半径随「范围」放大。',
      en: 'High-rate bullets with a **magazine**: fire until empty, then reload. Hit radius scales with Area.',
      ja: '高射速の弾体。**弾倉**を持ち、撃ち切ると装填に入る。命中半径は「範囲」で拡大。',
    },
    params: ['cd', 'dmg', 'count', 'mag', 'reload', 'spread', 'pierce'],
    base: { speed: 780, r: 4.5, life: 1.0, spread: 0.05, mag: 16, reload: 1.5, pierce: 0 },
    area: ['r'],
  },
  /* v0.20：**散弹**——一次多枚弹丸，spread＝总散布角（弧度），弹丸均分在扇形内。 */
  shotgun: {
    id: 'shotgun', family: 'projectile', entity: 'Projectile',
    name: { zh: '散弹', en: 'Scatter', ja: '散弾' },
    desc: {
      zh: '一次射出多枚弹丸，**以 spread（弧度）为总散布角**呈扇形展开；单枚伤害低，贴脸全中才痛。命中半径随「范围」放大。',
      en: 'Fires many pellets in one pull, spread over **spread radians** in a fan; each pellet is weak, so point-blank hits hurt. Hit radius scales with Area.',
      ja: '一度に多数の弾丸を**spread（ラジアン）の扇角**で放つ。1 発は弱く、至近距離で全弾当ててこそ痛い。命中半径は「範囲」で拡大。',
    },
    params: ['cd', 'dmg', 'count', 'spread', 'life', 'pierce'],
    base: { speed: 700, r: 5, life: 0.4, spread: 0.55, pierce: 0 },
    area: ['r'],
  },
  /* v0.20：**重弹**——体积大、飞得慢、击退强；用来表达「台风之子」这类巨物。 */
  typhoon: {
    id: 'typhoon', family: 'projectile', entity: 'Projectile',
    name: { zh: '重弹', en: 'Heavy Shot', ja: '重弾' },
    desc: {
      zh: '又大又慢的弹体，**击退极强**、可贯穿多个敌人；命中半径随「范围」放大。',
      en: 'A big, slow projectile with **heavy knockback** that pierces several foes; hit radius scales with Area.',
      ja: '大きく遅い弾体。**ノックバックが極めて強く**、複数の敵を貫く。命中半径は「範囲」で拡大。',
    },
    params: ['cd', 'dmg', 'count', 'r', 'pierce', 'kb'],
    base: { speed: 250, r: 26, life: 2.8, pierce: 3, homing: 0.7, kb: 3.0 },
    area: ['r'],
  },
  /* v0.20：**吞噬**——先聚怪、再群伤（Zone kind='devour'）。 */
  devour: {
    id: 'devour', family: 'curse', entity: 'Zone（devour）',
    name: { zh: '吞噬', en: 'Devour', ja: '捕食' },
    desc: {
      zh: '在最近敌人处张开吞噬领域：持续把范围内的敌人**拖向中心**，收束时一并炸开——先聚怪，再群伤。',
      en: 'Opens a devouring field on the nearest foe: foes inside are **dragged toward the center**, then the field bursts — gather first, then AoE.',
      ja: '最寄りの敵に捕食領域を開く。範囲内の敵を**中心へ引き寄せ**、収束時に炸裂——集めてから薙ぎ払う。',
    },
    params: ['cd', 'dmg', 'count', 'r', 'pull', 'life'],
    base: { pull: 320, life: 0.7 },
    area: ['r'],
  },
  /* v0.20：**连锁**——由最近怪搜索「下一个最近怪」，有跳跃距离与段数上限。 */
  chain: {
    id: 'chain', family: 'curse', entity: 'Beam（chain）',
    name: { zh: '连锁', en: 'Chain', ja: '連鎖' },
    desc: {
      zh: '从最近的敌人起跳，每次只搜索**比当前更近的下一个**（跳跃距离上限 jump），最多跳 jumps 段；每段都造成伤害。',
      en: 'Starts at the nearest foe and leaps to **the next nearest within jump range**, up to jumps links; every link deals damage.',
      ja: '最寄りの敵から始まり、**jump 以内で次に近い敵**へ最大 jumps 段まで連鎖。各段がダメージを与える。',
    },
    params: ['cd', 'dmg', 'range', 'jump', 'jumps'],
    base: { range: 560, jump: 240, jumps: 4 },
    area: ['range', 'jump'],
  },
  /* v0.20：**召唤**——留下会自行攻击的幻影（新实体 KUP.Summon）。 */
  summon: {
    id: 'summon', family: 'summon', entity: 'Summon',
    name: { zh: '召唤', en: 'Summon', ja: '召喚' },
    desc: {
      zh: '在身边留下**会自行索敌射击**的幻影，持续一段时间；幻影的弹体也吃角色的伤害加成。',
      en: 'Leaves a phantasm beside you that **seeks and shoots on its own** for a while; its shots also scale with your damage.',
      ja: '自機のそばに**自律して敵を狙う幻影**を残す。幻影の弾も自身のダメージ強化を受ける。',
    },
    params: ['cd', 'dmg', 'count', 'life', 'fireCd'],
    base: { r: 13, speed: 420, life: 5, fireCd: 0.65, homing: 4.5 },
    area: ['r'],
  },
  /* ===== v0.21 合奏系模组（派生／合并武装专用）=====
   * 派生武装＝**两把普通武器合成一把**（释放 1 个武器槽），所以强度口径是
   *   「强于其中任意一把·弱于两把叠加」——做法不是简单相加，而是保留两族的
   * **核心手感**、把每一轮压成一套节奏：
   *   chorus＝环绕音球（orbit）＋ 由球体轮流齐射的追踪音符（homing）
   *   abyss ＝吞噬领域（devour）＋ 收束时自中心贯穿的双光束（beam）
   *   gale  ＝正面窄扇风压（shock 窄扇）＋ 推进去的巨大重弹（typhoon）
   *   scar  ＝整圈冲击环（shock 全圆）＋ 环内落下的延迟空爆（blast）
   *   stigma＝穿透音枪齐射（sniper）＋ 同一目标脚下的滞留宝光（lob）
   * 这些模组只服务派生武装，**不会给普通武器使用**（audit 会校验）。 */
  chorus: {
    id: 'chorus', family: 'duet', entity: 'WeaponRuntime.orbs + Projectile',
    name: { zh: '环唱', en: 'Round Chorus', ja: '環唱' },
    desc: {
      zh: '音球贴着玩家绕转并造成接触伤害，同时**轮流从球体位置射出追踪音符**。',
      en: 'Orbs circle close to you dealing contact damage while **taking turns firing homing notes** from their positions.',
      ja: '音球が自機の周りを回り接触ダメージを与えつつ、**順番に球体から追尾音符を放つ**。',
    },
    params: ['cd', 'dmg', 'count', 'orbCount', 'r', 'orbR', 'orbDmg', 'hitCd', 'spin', 'pr', 'speed', 'homing', 'life'],
    base: { speed: 380, pr: 7, life: 2.0, homing: 5.2, spin: 4.6 },
    area: ['r', 'orbR', 'pr'],
  },
  abyss: {
    id: 'abyss', family: 'duet', entity: 'Zone（devour）+ Beam',
    name: { zh: '深渊', en: 'Abyss', ja: '深淵' },
    desc: {
      zh: '在最近敌人处张开吞噬领域把敌人拖向中心，**收束时从中心贯穿双光束**。',
      en: 'Opens a devouring field on the nearest foe, dragging foes in — then **two beams pierce out from its center** when it bursts.',
      ja: '最寄りの敵に捕食領域を開いて引き寄せ、**収束時に中心から二条のビームが貫く**。',
    },
    params: ['cd', 'dmg', 'count', 'r', 'pull', 'life', 'beamDmg', 'beamLen', 'beamW', 'beams'],
    base: { beams: 2 },
    area: ['r', 'beamLen'],
  },
  gale: {
    id: 'gale', family: 'duet', entity: 'Ring（扇形）+ Projectile',
    name: { zh: '风压重弹', en: 'Gale & Weight', ja: '風圧重弾' },
    desc: {
      zh: '先朝正面吹出一道**窄扇风压**推开敌人，再推进一枚巨大重弹——先清道，再碾过。',
      en: 'First a **narrow fan of wind pressure** shoves the front open, then a huge heavy shot rolls through — clear the lane, then flatten it.',
      ja: 'まず正面へ**狭い扇の風圧**を吹いて押し開き、続いて巨大な重弾が進む——道を空けてから轢く。',
    },
    params: ['cd', 'dmg', 'count', 'r', 'life', 'pierce', 'kb', 'speed', 'ringR', 'ringArc', 'ringKb', 'ringDmg', 'ringSpeed'],
    base: { speed: 250, life: 2.6, ringArc: 70, ringSpeed: 320 },
    area: ['r', 'ringR'],
  },
  scar: {
    id: 'scar', family: 'duet', entity: 'Ring（全圆）+ Zone（bomb）',
    name: { zh: '旧伤环爆', en: 'Scar Ring', ja: '旧傷環爆' },
    desc: {
      zh: '一圈**整圆冲击环**向外推开敌人，同时环内落下数枚**延迟白爆**，在四面上留下旧伤。',
      en: 'A **full shock ring** pushes everything out while **delayed bursts** fall inside it, leaving old scars on every side.',
      ja: '**全周の衝撃環**が敵を押し出し、同時に環の内側へ**遅延爆発**が落ちて四方に旧傷を残す。',
    },
    params: ['cd', 'dmg', 'count', 'r', 'range', 'fuse', 'minRange', 'ringR', 'ringKb', 'ringDmg', 'ringSpeed'],
    base: { minRange: 30, ringR: 180, ringSpeed: 340 },
    area: ['r', 'range', 'ringR'],
  },
  stigma: {
    id: 'stigma', family: 'duet', entity: 'Projectile + Zone（field）',
    name: { zh: '圣痕枪光', en: 'Stigma Shot', ja: '聖痕槍光' },
    desc: {
      zh: '向最近敌人齐射**穿透音枪**，并在同一目标脚下留下**滞留宝光**持续切割。',
      en: 'Fires a volley of **piercing lances** at the nearest foe and leaves **lingering gem-light** under that same target.',
      ja: '最寄りへ**貫通音槍**を斉射し、同じ目標の足元に**残る宝光**を残して切り続ける。',
    },
    params: ['cd', 'dmg', 'count', 'spread', 'pierce', 'fieldDmg', 'fieldR', 'fieldLife', 'tickRate'],
    base: { spread: 0.085, tickRate: 0.4 },
    area: ['fieldR'],
  },
  lob: {
    id: 'lob', family: 'field', entity: 'Toss → Zone',
    name: { zh: '投掷・滞留音场', en: 'Thrown Field', ja: '投擲・残響音場' },
    desc: { zh: '抛物线**分别投向最近 N 个不同敌人**（缺省 2），落点生成滞留音场；投掷距离与音场半径随「范围」放大。', en: 'Arcs toward **the nearest N different foes** (2 by default), each leaving a lingering field; throw range and field radius scale with Area.', ja: '最寄りの**別々の敵 N 体**へ放物線で投擲（既定 2）。着地点に残響音場。投擲距離と半径が「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'r', 'range', 'fly', 'life', 'targets'],
    /* v0.14：count 个投掷物**各向最近的不同敌人之一**（targets 决定"最近两个"的分配），
     * 不再是对着同一个最近敌人按 spread 撒开 —— 那是"一下投掷两个"，不是"向两个敌人各投一个"。 */
    base: { fly: 0.4, tickRate: 0.4, spread: 0.42, slowMul: 0.55, slowSec: 0.4, targets: 2 },
    area: ['r', 'range'],
  },
  blast: {
    id: 'blast', family: 'field', entity: 'Zone（bomb）',
    name: { zh: '随机空爆', en: 'Random Blast', ja: 'ランダム空爆' },
    desc: { zh: '在自身周围随机落点、延迟引爆；**散布距离与爆炸半径**随「范围」放大。', en: 'Random delayed blasts around you; **scatter range and blast radius** scale with Area.', ja: '周囲のランダム地点で遅延起爆。**散布距離と爆発半径**が「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'r', 'range', 'fuse'],
    base: { fuse: 0.95, minRange: 30 },
    area: ['r', 'range'],
  },
  minefield: {
    id: 'minefield', family: 'field', entity: 'Zone（mine）',
    name: { zh: '放置・音之地雷', en: 'Placed Mine', ja: '設置・音の地雷' },
    desc: {
      zh: '在身后放置滞留雷：敌人踏进**触发半径**即引爆，爆炸覆盖更大的**击杀半径**；起爆瞬间会画出向外推的两道圆。作用半径随「范围」放大。',
      en: 'Plants a lingering mine: a foe entering the **trigger radius** sets it off, and the blast covers the larger **kill radius** — two rings push outward on detonation. Radius scales with Area.',
      ja: '背後に残響地雷を設置：敵が**起爆半径**に入ると炸裂し、爆発はより広い**撃破半径**を覆う。起爆時に外向きの二重の輪が走る。半径は「範囲」で拡大。',
    },
    /* v0.15.1：触发半径 = r × triggerMul（缺省 0.6）——"踩到"与"被炸到"不再是同一件事；
     * 真正的爆炸范围由起爆瞬间的 Shockwave 推出来（地雷本体按武器表 vis 画得很小）。 */
    params: ['cd', 'dmg', 'count', 'r', 'life', 'max', 'triggerMul'],
    base: { dropBack: 22, dropJitter: 26, triggerMul: 0.6 },
    area: ['r'],
  },
};
KUP.MODULE = id => KUP.WEAPON_MODULES[id] || null;
/* 模组 → 具体武器（唯一真值仍是每把武器的 behavior，这里只是反向查询） */
KUP.WEAPONS_OF = moduleId => Object.keys(KUP.WEAPONS).filter(id => KUP.WEAPONS[id].behavior === moduleId).map(id => KUP.WEAPONS[id]);
/* 具体武器 → 模组 */
KUP.MODULE_OF = weaponId => { const w = KUP.WEAPONS[weaponId]; return w ? KUP.MODULE(w.behavior) : null; };

KUP.WEAPONS = {
  note: {
    id: 'note', icon: '♪', color: '#4ee6ff', behavior: 'homing', maxLv: 5, owner: 'kaf',
    name: { zh: '私論理', en: 'Watashi Ronri', ja: '私論理' },
    desc: {
      zh: '乐曲「私論理」化作追尾敌人的音符。森先化歩的初期武装。',
      en: 'The song "Watashi Ronri" becomes notes that chase down enemies. MORISAKI KAFU\'s starting weapon.',
      ja: '楽曲「私論理」が音符と化して敵を追尾する。森先化歩の初期武装。',
    },
    lvDesc: [
      { zh: '追尾音符 ×2，命中后消失。', en: '2 homing notes; they vanish on hit.', ja: '追尾音符 ×2。命中すると消える。' },
      { zh: '音符 ×3，射速提升。', en: '3 notes, faster fire.', ja: '音符 ×3、射速アップ。' },
      { zh: '命中时分裂出 2 枚小音符。', en: 'Splits into 2 mini notes on hit.', ja: '命中時に小音符 ×2 に分裂。' },
      { zh: '音符 ×4，追踪性能增强。', en: '4 notes, stronger homing.', ja: '音符 ×4、追尾性能強化。' },
      { zh: '音符 ×6 —— 私論理响彻神椿市。', en: '6 notes — Watashi Ronri rings through Kamitsubaki City.', ja: '音符 ×6 —— 私論理が神椿市に響き渡る。' },
    ],
    levels: [
      { cd: 1.05, dmg: 10, count: 2, split: 0 },
      { cd: 0.95, dmg: 12, count: 3, split: 0 },
      { cd: 0.95, dmg: 13, count: 3, split: 1 },
      { cd: 0.85, dmg: 15, count: 4, split: 1 },
      { cd: 0.72, dmg: 18, count: 6, split: 1 },
    ],
    /* 覚醒（進化形態）★ REGENERATE「魔女の娘へと覚醒する場面」：满级后觉醒，武器化为乐曲名的进化形态 */
    evolved: {
      name: { zh: '私論理 -theory-', en: 'Watashi Ronri -Theory-', ja: '私論理 -theory-' },
      desc: {
        zh: '覚醒——「私論理」化为八枚合唱般的追尾音符。',
        en: 'Awakened — "Watashi Ronri" becomes eight homing notes singing as one.',
        ja: '覚醒——「私論理」が合唱のような八つの追尾音符と化す。',
      },
      stats: { cd: 0.55, dmg: 24, count: 8, split: 1 },
    },
  },
  /* ===== 花譜的第二、第三武装（v0.20）=====
   * 初始仍是「私論理」（武器 note，模组 homing）；另两把分别对应
   * 「過去を喰らう」（新模组 devour＝聚怪群伤）与「不可解」（新模组 chain＝最近怪连锁）。 */
  kuu: {
    id: 'kuu', icon: '喰', color: '#8b6cff', behavior: 'devour', maxLv: 5, owner: 'kaf',
    name: { zh: '過去を喰らう', en: 'Devouring the Past', ja: '過去を喰らう' },
    desc: {
      zh: '乐曲「過去を喰らう」化作吞噬领域——先把范围内的破维魔**拖向中心**，收束时一并嚼碎。森先化歩的第二武装。',
      en: 'The song "Kako wo Kurau" becomes a devouring field: foes inside are **dragged to the center**, then crushed at once. MORISAKI KAFU\'s second weapon.',
      ja: '楽曲「過去を喰らう」が捕食領域となる。範囲内の敵を**中心へ引き寄せ**、収束時にまとめて噛み砕く。森先化歩の第二武装。',
    },
    lvDesc: [
      { zh: '在最近敌人处张开吞噬领域，短暂拖拽后炸开。', en: 'Opens a devouring field on the nearest foe, dragging then bursting.', ja: '最寄りの敵に捕食領域を開き、引き寄せてから炸裂。' },
      { zh: '领域扩大，拖拽力增强。', en: 'Wider field, stronger pull.', ja: '領域拡大、引き寄せ強化。' },
      { zh: '伤害与收束时间提升。', en: 'More damage, longer gather.', ja: 'ダメージと収束時間アップ。' },
      { zh: '同时张开 2 个领域。', en: '2 fields at once.', ja: '同時に領域 ×2。' },
      { zh: '领域 ×2，拖拽力大幅提升 —— 过去被一口吞下。', en: '2 fields with a much stronger pull — the past is swallowed whole.', ja: '領域 ×2、引き寄せ大幅強化 —— 過去を一口で呑み込む。' },
    ],
    levels: [
      { cd: 4.6, dmg: 18, count: 1, r: 110, pull: 240, life: 0.6 },
      { cd: 4.2, dmg: 22, count: 1, r: 125, pull: 280, life: 0.65 },
      { cd: 3.8, dmg: 26, count: 1, r: 140, pull: 320, life: 0.7 },
      { cd: 3.4, dmg: 32, count: 2, r: 155, pull: 370, life: 0.8 },
      { cd: 3.0, dmg: 38, count: 2, r: 170, pull: 420, life: 0.9 },
    ],
    evolved: {
      name: { zh: '過去を喰らう -oblivion-', en: 'Devouring the Past -Oblivion-', ja: '過去を喰らう -oblivion-' },
      desc: {
        zh: '覚醒——吞噬领域撕开两处，过去与现在一同沉入 oblivion。',
        en: 'Awakened — two devouring fields tear open; past and present sink into oblivion.',
        ja: '覚醒——捕食領域が二つに裂け、過去も現在も oblivion へ沈む。',
      },
      stats: { cd: 2.2, dmg: 56, count: 2, r: 200, pull: 520, life: 1.0 },
    },
  },
  fukakai: {
    id: 'fukakai', icon: '鎖', color: '#ff4d6d', behavior: 'chain', maxLv: 5, owner: 'kaf',
    name: { zh: '不可解', en: 'Fukakai', ja: '不可解' },
    desc: {
      zh: '乐曲「不可解」化作连锁：从最近的破维魔起跳，一路搜索**下一个更近的**（有跳跃距离上限）。森先化歩的第三武装。',
      en: 'The song "Fukakai" becomes a chain: starting from the nearest foe, it leaps to **the next nearest** within range. MORISAKI KAFU\'s third weapon.',
      ja: '楽曲「不可解」が連鎖となる。最寄りの敵から、**次に近い敵**へ範囲内で飛び移る。森先化歩の第三武装。',
    },
    lvDesc: [
      { zh: '从最近敌人起跳，最多连锁 3 段。', en: 'Leaps from the nearest foe, up to 3 links.', ja: '最寄りの敵から最大 3 段連鎖。' },
      { zh: '伤害提升，搜索距离扩大。', en: 'More damage, longer search.', ja: 'ダメージと探索距離アップ。' },
      { zh: '连锁 4 段。', en: '4 links.', ja: '4 段連鎖。' },
      { zh: '跳跃距离与伤害提升。', en: 'Longer jumps, more damage.', ja: '跳躍距離とダメージアップ。' },
      { zh: '连锁 5 段 —— 不可解没有尽头。', en: '5 links — Fukakai has no end.', ja: '5 段連鎖 —— 不可解に終わりはない。' },
    ],
    levels: [
      { cd: 3.4, dmg: 20, range: 520, jump: 220, jumps: 3 },
      { cd: 3.1, dmg: 24, range: 540, jump: 240, jumps: 3 },
      { cd: 2.8, dmg: 28, range: 560, jump: 260, jumps: 4 },
      { cd: 2.5, dmg: 33, range: 600, jump: 280, jumps: 4 },
      { cd: 2.2, dmg: 38, range: 640, jump: 300, jumps: 5 },
    ],
    evolved: {
      name: { zh: '不可解 -infinite-', en: 'Fukakai -Infinite-', ja: '不可解 -infinite-' },
      desc: {
        zh: '覚醒——连锁六段，不可解沿着整条街传到尽头。',
        en: 'Awakened — six links; Fukakai runs down the whole street.',
        ja: '覚醒——六段の連鎖、不可解が街の果てまで伝う。',
      },
      stats: { cd: 1.5, dmg: 52, range: 700, jump: 340, jumps: 6 },
    },
  },
  orbit: {
    id: 'orbit', icon: '◎', color: '#ff6bb5', behavior: 'orbital', maxLv: 5, owner: 'rim',
    name: { zh: '暴食音球', en: 'Carnivorous Bit', ja: 'カーニヴォラス・ビット' },
    desc: {
      zh: '乐曲「食虫植物」般环绕捕食的音球。谷置狸眼的初期武装。<br><span class="cv-note">球体接触判定 · 体积随「范围」、转速随「冷却」成长</span>',
      en: 'Orbs that orbit and devour like "Shokuchuu Shokubutsu". TANIOKI RIME\'s starting weapon.<br><span class="cv-note">Orb-body contact · radius & size scale with Area, spin with Cooldown</span>',
      ja: '楽曲「食虫植物」の如く敵を捕らえる音球。谷置狸眼の初期武装。<br><span class="cv-note">球体接触判定 · 旋回半径と大きさは「範囲」、回転速度は「クールダウン」で伸びる</span>',
    },
    lvDesc: [
      { zh: '音球 ×2，接触伤害并击退。', en: '2 orbs; contact damage and knockback.', ja: '音球 ×2、接触ダメージとノックバック。' },
      { zh: '音球 ×3，球体变大。', en: '3 orbs, bigger bodies.', ja: '音球 ×3、球体が大きくなる。' },
      { zh: '音球 ×3，旋转范围与转速提升。', en: '3 orbs, wider and faster orbit.', ja: '音球 ×3、旋回範囲と回転速度アップ。' },
      { zh: '音球 ×4，伤害与体积提升。', en: '4 orbs, more damage and size.', ja: '音球 ×4、ダメージと体積アップ。' },
      { zh: '音球 ×6 —— 捕食领域全面展开。', en: '6 orbs — the predatory field unfolds.', ja: '音球 ×6 —— 捕食領域が全面展開。' },
    ],
    /* v0.15.1：球体贴着玩家转（半径 46–58），转速按**半圈律**标定：
     *   `spin ≈ π×62／(2×orbR) ＝ 97.4／orbR`  —— 普通破维魔走过球体直径的这点时间里，
     *   武器恰好转半圈；它会在接触窗口内吃到 2–3 次命中，因此**能被打死**。
     * 球体逐级变大所以角速度逐级略降（19→24 对应 5.13→4.06），线速度基本不变。 */
    levels: [
      { dmg: 16, count: 2, r: 46, spin: 5.13, orbR: 19 },
      { dmg: 17, count: 3, r: 48, spin: 4.87, orbR: 20 },
      { dmg: 19, count: 3, r: 50, spin: 4.64, orbR: 21 },
      { dmg: 20, count: 4, r: 52, spin: 4.43, orbR: 22 },
      { dmg: 22, count: 6, r: 54, spin: 4.24, orbR: 23 },
    ],
    evolved: {
      name: { zh: '食虫植物 -devour-', en: 'Shokuchuu Shokubutsu -Devour-', ja: '食虫植物 -devour-' },
      desc: {
        zh: '覚醒——「食虫植物」的捕食领域全面张開，八枚音球环噬。',
        en: 'Awakened — the carnivorous field unfolds; eight orbs devour all.',
        ja: '覚醒——「食虫植物」の捕食領域が全面展開、八つの音球が环噬する。',
      },
      stats: { dmg: 28, count: 8, r: 58, spin: 4.06, orbR: 24 },
    },
  },
  horagai: {
    id: 'horagai', icon: '螺', color: '#c9a24d', behavior: 'shock', maxLv: 5, owner: 'rim',
    name: { zh: '法螺話', en: 'Horagai', ja: '法螺話' },
    desc: {
      zh: '乐曲「法螺話」化作一记**又窄又远**的法螺——伤害不高，但把正面一条扇形内的破维魔**狠狠推开**。谷置狸眼的第二武装。',
      en: 'The song "Horagai" becomes a narrow, far-reaching horn blast: low damage, but it **shoves everything** in a thin fan away. TANIOKI RIME\'s second weapon.',
      ja: '楽曲「法螺話」が**狭く遠い**法螺の一撃となる。ダメージは低いが、正面の扇形にいる敵を**強く押し返す**。谷置狸眼の第二武装。',
    },
    lvDesc: [
      { zh: '正面 70° 扇形，击退 380、伤害很低。', en: 'A 70° fan; 380 knockback, very low damage.', ja: '正面 70° の扇形、ノックバック 380、ダメージは低い。' },
      { zh: '扇形略宽，击退增强。', en: 'Slightly wider fan, stronger shove.', ja: '扇角が少し広がり、押し返し強化。' },
      { zh: '范围扩大，伤害小幅提升。', en: 'Wider range, a little more damage.', ja: '範囲拡大、ダメージ小幅アップ。' },
      { zh: '击退 440，冷却缩短。', en: '440 knockback, shorter cooldown.', ja: 'ノックバック 440、冷却短縮。' },
      { zh: '正面 80° —— 一吹即散。', en: 'An 80° front — one blast clears it.', ja: '正面 80° —— 一吹きで散らす。' },
    ],
    levels: [
      { cd: 2.8, dmg: 8, r: 170, arc: 70, kb: 380, double: false },
      { cd: 2.6, dmg: 9, r: 185, arc: 72, kb: 400, double: false },
      { cd: 2.4, dmg: 11, r: 200, arc: 74, kb: 420, double: false },
      { cd: 2.2, dmg: 12, r: 220, arc: 76, kb: 440, double: false },
      { cd: 2.0, dmg: 14, r: 240, arc: 80, kb: 460, double: false },
    ],
    evolved: {
      name: { zh: '法螺話 -gale-', en: 'Horagai -Gale-', ja: '法螺話 -gale-' },
      desc: {
        zh: '覚醒——法螺声化为 90° 的狂风，正面被整片吹开。',
        en: 'Awakened — the horn becomes a 90° gale that blows the whole front open.',
        ja: '覚醒——法螺の音は 90° の疾風となり、正面を丸ごと吹き飛ばす。',
      },
      stats: { cd: 1.4, dmg: 20, r: 280, arc: 90, kb: 520, double: true },
    },
  },
  bass: {
    id: 'bass', icon: '低', color: '#ffb25a', behavior: 'shock', maxLv: 5, owner: 'harusaruhi',
    name: { zh: '泰拉坠击', en: 'Terra Drop', ja: 'テラ・ドロップ' },
    desc: {
      zh: '令大地震颤的低音冲击波，取自乐曲「テラ」。朝主派流的初期武装。',
      en: 'A bass shockwave that quakes the earth, from the song "Terra". ASANUSHI HARU\'s starting weapon.',
      ja: '大地を震わせる低音衝撃波、楽曲「テラ」より。朝主派流の初期武装。',
    },
    lvDesc: [
      { zh: '以自身为中心释放冲击环。', en: 'Releases a shock ring around you.', ja: '自身を中心に衝撃環を放つ。' },
      { zh: '伤害与范围提升。', en: 'More damage and range.', ja: 'ダメージと範囲アップ。' },
      { zh: '释放间隔缩短。', en: 'Shorter interval.', ja: '発射間隔短縮。' },
      { zh: '范围大幅扩大。', en: 'Much wider range.', ja: '範囲が大幅拡大。' },
      { zh: '冲击环 ×2 —— 重低音粉碎街区。', en: '2 rings — the bass smashes the streets.', ja: '衝撃環 ×2 —— 重低音が街を砕く。' },
    ],
    levels: [
      { cd: 3.2, dmg: 22, r: 150, double: false },
      { cd: 3.0, dmg: 28, r: 165, double: false },
      { cd: 2.5, dmg: 30, r: 165, double: false },
      { cd: 2.4, dmg: 36, r: 200, double: false },
      { cd: 2.6, dmg: 40, r: 200, double: true },
    ],
    evolved: {
      name: { zh: 'テラ -quake-', en: 'Terra -Quake-', ja: 'テラ -quake-' },
      desc: {
        zh: '覚醒——「テラ」令大地崩裂的双重低音冲击。',
        en: 'Awakened — "Terra" quakes and splits the earth.',
        ja: '覚醒——「テラ」が大地を崩落させる二重の低音衝撃。',
      },
      stats: { cd: 1.7, dmg: 46, r: 235, double: true },
    },
  },
  taifuu: {
    id: 'taifuu', icon: '颱', color: '#3fd0c9', behavior: 'typhoon', maxLv: 5, owner: 'harusaruhi',
    name: { zh: '台風之子', en: 'Child of the Typhoon', ja: '台風の子' },
    desc: {
      zh: '乐曲「台風の子」化作**巨大的弹体**：飞得慢、体积大、击退极强，能把整排破维魔推着走。朝主派流的第二武装。',
      en: 'The song "Taifuu no Ko" becomes a **huge projectile**: slow, big, with enormous knockback that pushes a whole line of foes. ASANUSHI HARU\'s second weapon.',
      ja: '楽曲「台風の子」が**巨大な弾体**となる。遅く、大きく、ノックバックは極大——敵の列ごと押し流す。朝主派流の第二武装。',
    },
    lvDesc: [
      { zh: '发射一枚巨大弹体，贯穿 3 体、强击退。', en: 'One huge shot; pierces 3 foes with heavy knockback.', ja: '巨大弾 ×1、3 体貫通、強ノックバック。' },
      { zh: '伤害与击退提升。', en: 'More damage and knockback.', ja: 'ダメージとノックバックアップ。' },
      { zh: '弹体更大，贯穿 4 体。', en: 'Bigger shot, pierces 4.', ja: '弾体拡大、4 体貫通。' },
      { zh: '同时发射 2 枚。', en: '2 shots at once.', ja: '同時に ×2。' },
      { zh: '弹体 ×2、击退 3.6 倍 —— 台风过境。', en: '2 shots with 3.6× knockback — the typhoon passes.', ja: '弾体 ×2、ノックバック 3.6 倍 —— 台風が過ぎる。' },
    ],
    levels: [
      { cd: 2.8, dmg: 26, count: 1, r: 26, pierce: 3, kb: 2.8 },
      { cd: 2.6, dmg: 30, count: 1, r: 28, pierce: 3, kb: 3.0 },
      { cd: 2.4, dmg: 34, count: 1, r: 30, pierce: 4, kb: 3.2 },
      { cd: 2.2, dmg: 38, count: 2, r: 32, pierce: 4, kb: 3.4 },
      { cd: 2.0, dmg: 42, count: 2, r: 34, pierce: 5, kb: 3.6 },
    ],
    evolved: {
      name: { zh: '台風の子 -eye-', en: 'Child of the Typhoon -Eye-', ja: '台風の子 -eye-' },
      desc: {
        zh: '覚醒——两枚巨弹卷成台风之眼，沿途的街区被连根拔起。',
        en: 'Awakened — twin shots spin into the typhoon\'s eye, tearing the street up as they pass.',
        ja: '覚醒——二つの巨弾が台風の眼をなし、通った街路を根こそぎさらう。',
      },
      stats: { cd: 1.5, dmg: 60, count: 2, r: 42, pierce: 6, kb: 4.2 },
    },
  },
  lance: {
    id: 'lance', icon: '槍', color: '#b06bff', behavior: 'sniper', maxLv: 5, owner: 'koko',
    name: { zh: '终末枪音', en: 'Last Bullet', ja: 'ラスト・バレット' },
    desc: {
      zh: '贯穿敌列的音之枪击，取自乐曲「the last bullet」。輪廻此処的初期武装。',
      en: 'Piercing sonic gunfire from the song "the last bullet". RINNE KOKO\'s starting weapon.',
      ja: '楽曲「the last bullet」より、敵列を貫く音の銃撃。輪廻此処の初期武装。',
    },
    lvDesc: [
      { zh: '朝最近的破维魔射出 2 发贯穿音枪（夹角很小，主要打同一个）。', en: 'Fires 2 piercing lances at the nearest foe (tight spread).', ja: '最寄りへ貫通音槍 ×2（狭い角度）。' },
      { zh: '音枪 ×3。', en: '3 lances.', ja: '音槍 ×3。' },
      { zh: '贯穿数 +1。', en: 'Pierce +1.', ja: '貫通数 +1。' },
      { zh: '音枪 ×4（分射最近两个破维魔）。', en: '4 lances (the two nearest foes get one each).', ja: '音槍 ×4（最寄り 2 体へ）。' },
      { zh: '音枪 ×5，贯穿数 +1 —— 最后的一击。', en: '5 lances, pierce +1 — the final shot.', ja: '音槍 ×5、貫通数 +1 —— 最後の一撃。' },
    ],
    levels: [
      { cd: 1.3, dmg: 14, count: 2, pierce: 1 },
      { cd: 1.25, dmg: 15, count: 3, pierce: 1 },
      { cd: 1.2, dmg: 17, count: 3, pierce: 2 },
      { cd: 1.15, dmg: 19, count: 4, pierce: 2 },
      { cd: 1.05, dmg: 22, count: 5, pierce: 3 },
    ],
    evolved: {
      name: { zh: 'the last bullet -finale-', en: 'The Last Bullet -Finale-', ja: 'the last bullet -finale-' },
      desc: {
        zh: '覚醒——「the last bullet」六连贯穿，最后的一击。',
        en: 'Awakened — six piercing rounds; the final shot.',
        ja: '覚醒——六連装の貫通弾、最後の一撃。',
      },
      stats: { cd: 0.85, dmg: 26, count: 6, pierce: 4 },
    },
  },
  hakuchuumu: {
    id: 'hakuchuumu', icon: '夢', color: '#ffffff', behavior: 'blast', maxLv: 5, owner: 'koko',
    /* 白色空爆＋**极浅紫**的起爆前摇（默认橙色太"危险"，与白昼夢的梦感不合）。 */
    warnColor: '#d8c8ff',
    name: { zh: '白昼夢', en: 'Daydream', ja: '白昼夢' },
    desc: {
      zh: '乐曲「白昼夢」化作**白色的空爆**：在自身周围随机落下，短暂延迟后无声炸开。輪廻此処的第二武装。',
      en: 'The song "Hakuchuumu" becomes **white air-bursts**: they fall at random around you and detonate after a short fuse. RINNE KOKO\'s second weapon.',
      ja: '楽曲「白昼夢」が**白い空爆**となる。周囲のランダムな地点に落ち、短い信管の後に静かに炸ける。輪廻此処の第二武装。',
    },
    lvDesc: [
      { zh: '每轮落下 1 枚白色空爆（信管 0.9 秒）。', en: '1 white blast per cycle (0.9s fuse).', ja: '白い空爆 ×1（信管 0.9 秒）。' },
      { zh: '爆炸范围扩大。', en: 'Wider blast.', ja: '爆発範囲拡大。' },
      { zh: '每轮 2 枚，范围再扩。', en: '2 blasts, wider still.', ja: '×2、さらに拡大。' },
      { zh: '每轮 2 枚，信管缩短。', en: '2 blasts, shorter fuse.', ja: '×2、信管短縮。' },
      { zh: '每轮 3 枚 —— 白昼的梦覆盖整条街。', en: '3 blasts — the daydream covers the street.', ja: '×3 —— 白昼の夢が街を覆う。' },
    ],
    levels: [
      { cd: 3.2, dmg: 24, count: 1, r: 90, range: 220, fuse: 0.9 },
      { cd: 3.0, dmg: 28, count: 1, r: 96, range: 240, fuse: 0.85 },
      { cd: 2.8, dmg: 32, count: 2, r: 106, range: 260, fuse: 0.8 },
      { cd: 2.6, dmg: 36, count: 2, r: 114, range: 280, fuse: 0.7 },
      { cd: 2.4, dmg: 42, count: 3, r: 124, range: 300, fuse: 0.65 },
    ],
    evolved: {
      name: { zh: '白昼夢 -daybreak-', en: 'Daydream -Daybreak-', ja: '白昼夢 -daybreak-' },
      desc: {
        zh: '覚醒——五枚白色空爆同时落下，白昼的梦在街区炸成一片。',
        en: 'Awakened — five white bursts fall at once; the daydream blooms across the district.',
        ja: '覚醒——五つの白い空爆が同時に落ち、白昼の夢が街に咲き乱れる。',
      },
      stats: { cd: 1.8, dmg: 56, count: 5, r: 140, range: 330, fuse: 0.55 },
    },
  },
  laser: {
    id: 'laser', icon: '光', color: '#7aa0ff', behavior: 'beam', maxLv: 5, owner: 'isekaijoucho',
    name: { zh: 'シリウスの心臓', en: "Sirius's Heart", ja: 'シリウスの心臓' },
    desc: {
      zh: '乐曲「シリウスの心臓」化作贯穿光束。夜河世界的初期武装。',
      en: 'The song "Sirius no Shinzou" becomes a piercing beam. YORUKAWA SEKAI\'s starting weapon.',
      ja: '楽曲「シリウスの心臓」が貫通光束となる。夜河世界の初期武装。',
    },
    lvDesc: [
      { zh: '朝最近的破维魔发射贯穿光束。', en: 'Fires a piercing beam at the nearest Tesseracter.', ja: '最寄りのテセラクターへ貫通ビームを発射。' },
      { zh: '光束加宽，伤害提升。', en: 'Wider beam, more damage.', ja: 'ビームが太くなり、ダメージアップ。' },
      { zh: '光束延长。', en: 'Longer beam.', ja: 'ビームが長くなる。' },
      { zh: '伤害大幅提升。', en: 'Much more damage.', ja: 'ダメージが大幅アップ。' },
      { zh: '光束 ×2 —— 分射最近的两个破维魔（只有一个时前后对穿）。', en: '2 beams — one for each of the two nearest foes (front & back when only one).', ja: 'ビーム ×2 —— 最寄りの 2 体へそれぞれ（1 体時は前後に）。' },
    ],
    levels: [
      { cd: 2.6, dmg: 20, len: 560, w: 16, double: false },
      { cd: 2.5, dmg: 26, len: 560, w: 22, double: false },
      { cd: 2.4, dmg: 28, len: 700, w: 22, double: false },
      { cd: 2.2, dmg: 34, len: 700, w: 26, double: false },
      { cd: 2.3, dmg: 38, len: 760, w: 26, double: true },
    ],
    evolved: {
      name: { zh: 'シリウスの心臓 -pulse-', en: "Sirius's Heart -Pulse-", ja: 'シリウスの心臓 -pulse-' },
      desc: {
        zh: '覚醒——「シリウスの心臓」的双重光束，如星核搏动。',
        en: 'Awakened — twin beams of "Sirius no Shinzou", pulsing like a stellar core.',
        ja: '覚醒——「シリウスの心臓」の二連光束、星核のように脈打つ。',
      },
      stats: { cd: 1.6, dmg: 44, len: 900, w: 30, double: true },
    },
  },
  housekitan: {
    id: 'housekitan', icon: '寶', color: '#7de0ff', behavior: 'lob', maxLv: 5, owner: 'isekaijoucho',
    name: { zh: 'ヰ世界の宝石譚', en: 'Gem Tale of the Otherworld', ja: 'ヰ世界の宝石譚' },
    desc: {
      zh: '乐曲「ヰ世界の宝石譚」化作投掷的宝石：落点留下**滞留的宝光**，持续切割其中的破维魔。夜河世界的第二武装。',
      en: 'The song "Isekai no Housekitan" becomes thrown gems: each impact leaves a **lingering gem-light** that keeps cutting foes inside. YORUKAWA SEKAI\'s second weapon.',
      ja: '楽曲「ヰ世界の宝石譚」が投擲される宝石となる。着地点に**残る宝光**が範囲内の敵を切り続ける。夜河世界の第二武装。',
    },
    lvDesc: [
      { zh: '向最近敌人投出 1 枚宝石，落点滞留 2.8 秒。', en: 'Throws 1 gem at the nearest foe; the light lingers 2.8s.', ja: '最寄りへ宝石 ×1、着地点に 2.8 秒の宝光。' },
      { zh: '范围与伤害提升。', en: 'Wider field, more damage.', ja: '範囲とダメージアップ。' },
      { zh: '投掷 2 枚。', en: '2 gems.', ja: '宝石 ×2。' },
      { zh: '滞留时间延长，冷却缩短。', en: 'Longer lingering, shorter cooldown.', ja: '持続延長、冷却短縮。' },
      { zh: '宝石 ×3 —— 整条街铺满宝光。', en: '3 gems — the street is paved with gem-light.', ja: '宝石 ×3 —— 街が宝光で埋まる。' },
    ],
    levels: [
      { cd: 2.4, dmg: 10, count: 1, r: 58, range: 280, fly: 0.45, life: 2.8 },
      { cd: 2.2, dmg: 12, count: 1, r: 64, range: 300, fly: 0.42, life: 3.0 },
      { cd: 2.0, dmg: 14, count: 2, r: 70, range: 320, fly: 0.40, life: 3.4 },
      { cd: 1.8, dmg: 16, count: 2, r: 76, range: 340, fly: 0.37, life: 3.8 },
      { cd: 1.6, dmg: 18, count: 3, r: 84, range: 360, fly: 0.34, life: 4.2 },
    ],
    evolved: {
      name: { zh: 'ヰ世界の宝石譚 -prism-', en: 'Gem Tale of the Otherworld -Prism-', ja: 'ヰ世界の宝石譚 -prism-' },
      desc: {
        zh: '覚醒——四枚宝石同时落下，折射出的宝光铺满街区。',
        en: 'Awakened — four gems fall at once; their refracted light floods the district.',
        ja: '覚醒——四つの宝石が同時に落ち、屈折した宝光が街を満たす。',
      },
      stats: { cd: 1.2, dmg: 26, count: 4, r: 96, range: 400, fly: 0.32, life: 5.0 },
    },
  },
  /* ===== 招募角色（魔女候補）的初期武装 =====
   * 曲名与年份取自 docs/lore/discography.md：あおいゆめ（2022）／オレンジ（2023）；
   * 第二武装 さよなら（2021）／虚言（2022）见下方同组条目。 */
  prayer: {
    id: 'prayer', icon: '鐘', color: '#8fa8ff', behavior: 'shock', maxLv: 5, owner: 'aru',
    name: { zh: 'あおいゆめ', en: 'Aoi Yume', ja: 'あおいゆめ' },
    desc: {
      zh: '乐曲「あおいゆめ」化作钟声般的冲击环。天祢亜留的初期武装。',
      en: 'The song "Aoi Yume" becomes a bell-like shockwave. AMANE ARU\'s starting weapon.',
      ja: '楽曲「あおいゆめ」が鐘の衝撃環となる。天祢亜留の初期武装。',
    },
    lvDesc: [
      { zh: '以自身为中心敲响钟声冲击环。', en: 'Rings a shockwave around you.', ja: '自身を中心に鐘の衝撃環を鳴らす。' },
      { zh: '伤害与范围提升。', en: 'More damage and range.', ja: 'ダメージと範囲アップ。' },
      { zh: '敲响间隔缩短。', en: 'Shorter interval.', ja: '発動間隔短縮。' },
      { zh: '范围大幅扩大。', en: 'Much wider range.', ja: '範囲が大幅拡大。' },
      { zh: '钟声 ×2 —— 救济的余音不散。', en: '2 bells — the requiem lingers.', ja: '鐘 ×2 —— 救済の余音は消えない。' },
    ],
    levels: [
      { cd: 3.0, dmg: 20, r: 145, double: false },
      { cd: 2.8, dmg: 26, r: 160, double: false },
      { cd: 2.4, dmg: 28, r: 160, double: false },
      { cd: 2.2, dmg: 34, r: 195, double: false },
      { cd: 2.4, dmg: 38, r: 195, double: true },
    ],
    evolved: {
      name: { zh: 'あおいゆめ -requiem-', en: 'Aoi Yume -Requiem-', ja: 'あおいゆめ -requiem-' },
      desc: {
        zh: '覚醒——「あおいゆめ」的钟声化为镇魂的双重冲击，为街区献上安魂。',
        en: 'Awakened — the bells of "Aoi Yume" become a twin requiem quake.',
        ja: '覚醒——「あおいゆめ」の鐘は鎮魂の二重衝撃となり、街に安魂を捧げる。',
      },
      stats: { cd: 1.6, dmg: 44, r: 230, double: true },
    },
  },
  sayonara: {
    id: 'sayonara', icon: '別', color: '#b8b8ff', behavior: 'shotgun', maxLv: 5, owner: 'aru',
    name: { zh: 'さよなら', en: 'Sayonara', ja: 'さよなら' },
    desc: {
      zh: '乐曲「さよなら」化作一次**扇形散开的告别**：多枚弹丸同时离手，贴脸全中才痛。天祢亜留的第二武装。',
      en: 'The song "Sayonara" becomes a **fan of farewells**: many pellets leave your hand at once; only point-blank hits hurt. AMANE ARU\'s second weapon.',
      ja: '楽曲「さよなら」が**扇形に散る別れ**となる。多数の弾丸が同時に放たれ、至近距離で全弾当ててこそ痛い。天祢亜留の第二武装。',
    },
    lvDesc: [
      { zh: '弹丸 ×6，总散布角约 26°。', en: '6 pellets over a ~26° fan.', ja: '弾丸 ×6、扇角およそ 26°。' },
      { zh: '弹丸 ×7，伤害提升。', en: '7 pellets, more damage.', ja: '弾丸 ×7、ダメージアップ。' },
      { zh: '弹丸 ×8，散布更宽。', en: '8 pellets, wider spread.', ja: '弾丸 ×8、散布拡大。' },
      { zh: '弹丸 ×9，冷却缩短。', en: '9 pellets, shorter cooldown.', ja: '弾丸 ×9、冷却短縮。' },
      { zh: '弹丸 ×10 —— 一句再见，扫清正面。', en: '10 pellets — one goodbye clears the front.', ja: '弾丸 ×10 —— ひとつの別れが正面を薙ぐ。' },
    ],
    levels: [
      { cd: 1.7, dmg: 8, count: 6, spread: 0.45, life: 0.36 },
      { cd: 1.6, dmg: 9, count: 7, spread: 0.48, life: 0.38 },
      { cd: 1.5, dmg: 10, count: 8, spread: 0.52, life: 0.40 },
      { cd: 1.35, dmg: 12, count: 9, spread: 0.56, life: 0.42 },
      { cd: 1.2, dmg: 14, count: 10, spread: 0.60, life: 0.44 },
    ],
    evolved: {
      name: { zh: 'さよなら -adieu-', en: 'Sayonara -Adieu-', ja: 'さよなら -adieu-' },
      desc: {
        zh: '覚醒——十二枚弹丸同时道别，正面再没有站着的破维魔。',
        en: 'Awakened — twelve pellets say goodbye at once; nothing stays standing in front.',
        ja: '覚醒——十二の弾丸が同時に別れを告げ、正面に立つ敵はない。',
      },
      stats: { cd: 0.9, dmg: 18, count: 12, spread: 0.68, life: 0.48 },
    },
  },
  follow: {
    id: 'follow', icon: '橙', color: '#ff9a3c', behavior: 'machinegun', maxLv: 5, owner: 'asu',
    name: { zh: 'オレンジ', en: 'Orange', ja: 'オレンジ' },
    desc: {
      zh: '乐曲「オレンジ」化作**连珠般的橙色弹雨**：有弹夹，打空后换弹。地邑阿栖的初期武装。',
      en: 'The song "Orange" becomes a **hail of orange bullets**: it has a magazine and reloads when empty. CHIMURA ASU\'s starting weapon.',
      ja: '楽曲「オレンジ」が**橙色の弾雨**となる。弾倉を持ち、撃ち切ると装填する。地邑阿栖の初期武装。',
    },
    lvDesc: [
      { zh: '橙色连射，弹夹 18 发，打空换弹。', en: 'Orange repeater; 18-round magazine, reloads when empty.', ja: '橙色の連射、弾倉 18 発、撃ち切ると装填。' },
      { zh: '弹夹 22 发，伤害提升。', en: '22 rounds, more damage.', ja: '弾倉 22 発、ダメージアップ。' },
      { zh: '弹夹 26 发，换弹加快。', en: '26 rounds, faster reload.', ja: '弾倉 26 発、装填短縮。' },
      { zh: '弹夹 30 发，射速提升。', en: '30 rounds, faster fire.', ja: '弾倉 30 発、射速アップ。' },
      { zh: '弹夹 34 发 —— 橙色弹雨不停。', en: '34 rounds — the orange rain never stops.', ja: '弾倉 34 発 —— 橙色の弾雨は止まらない。' },
    ],
    levels: [
      { cd: 0.17, dmg: 6, count: 1, mag: 18, reload: 1.6, spread: 0.05 },
      { cd: 0.16, dmg: 7, count: 1, mag: 22, reload: 1.5, spread: 0.05 },
      { cd: 0.15, dmg: 8, count: 1, mag: 26, reload: 1.3, spread: 0.05 },
      { cd: 0.13, dmg: 9, count: 1, mag: 30, reload: 1.1, spread: 0.055 },
      { cd: 0.11, dmg: 10, count: 1, mag: 34, reload: 1.0, spread: 0.06 },
    ],
    evolved: {
      name: { zh: 'オレンジ -sunset-', en: 'Orange -Sunset-', ja: 'オレンジ -sunset-' },
      desc: {
        zh: '覚醒——44 发弹鼓与近乎无缝的换弹，橙色黄昏覆盖整条街。',
        en: 'Awakened — a 44-round drum and near-seamless reloads; an orange sunset covers the street.',
        ja: '覚醒——44 発の弾倉とほぼ途切れない装填、橙色の夕暮れが街を覆う。',
      },
      stats: { cd: 0.09, dmg: 12, count: 1, mag: 44, reload: 0.85, spread: 0.065 },
    },
  },
  kyogen: {
    id: 'kyogen', icon: '嘘', color: '#d8a7ff', behavior: 'summon', maxLv: 5, owner: 'asu',
    name: { zh: '虚言', en: 'Soragoto', ja: '虚言' },
    desc: {
      zh: '乐曲「虚言」化作**会自行索敌的幻影**：在身边留下虚像，替你说谎、替你开枪。地邑阿栖的第二武装。',
      en: 'The song "Soragoto" becomes a **phantasm that seeks on its own**: a lie left beside you that shoots for you. CHIMURA ASU\'s second weapon.',
      ja: '楽曲「虚言」が**自律索敵する幻影**となる。そばに虚像を残し、嘘をつき、弾を撃つ。地邑阿栖の第二武装。',
    },
    lvDesc: [
      { zh: '留下 1 个幻影，持续 5 秒、自动射击。', en: '1 phantasm for 5s, firing on its own.', ja: '幻影 ×1、5 秒間、自動射撃。' },
      { zh: '幻影伤害提升，射击更快。', en: 'Stronger, faster shots.', ja: '幻影のダメージと射速アップ。' },
      { zh: '幻影持续 6 秒。', en: 'Phantasm lasts 6s.', ja: '幻影の持続 6 秒。' },
      { zh: '同时留下 2 个幻影。', en: '2 phantasms at once.', ja: '同時に幻影 ×2。' },
      { zh: '幻影 ×2、持续 7 秒 —— 谎言满街。', en: '2 phantasms for 7s — lies fill the street.', ja: '幻影 ×2、7 秒持続 —— 嘘が街に満ちる。' },
    ],
    levels: [
      { cd: 7.0, dmg: 10, count: 1, life: 5, fireCd: 0.7 },
      { cd: 6.4, dmg: 12, count: 1, life: 5.5, fireCd: 0.65 },
      { cd: 5.8, dmg: 14, count: 1, life: 6, fireCd: 0.6 },
      { cd: 5.2, dmg: 16, count: 2, life: 6.5, fireCd: 0.55 },
      { cd: 4.6, dmg: 18, count: 2, life: 7, fireCd: 0.5 },
    ],
    evolved: {
      name: { zh: '虚言 -mirage-', en: 'Soragoto -Mirage-', ja: '虚言 -mirage-' },
      desc: {
        zh: '覚醒——三个幻影同时开口，虚言成了街区的实景。',
        en: 'Awakened — three phantasms speak at once; the lie becomes the district\'s reality.',
        ja: '覚醒——三つの幻影が同時に口を開き、虚言が街の実景となる。',
      },
      stats: { cd: 3.6, dmg: 24, count: 3, life: 8, fireCd: 0.42 },
    },
  },

  /* ===== 新武器组：滞留・投掷系（2026-10 追加；全部为本作同人命名与机制）=====
   * 三把武器共用新的「区域（Zone）」实体：
   *   - toss 残留音块：自动**投掷**到最近敌人处，落点留下**滞留**音场
   *   - bomb 随机空爆：在自身周围**随机**落点、延迟引爆
   *   - mine 音之地雷：在身后**放置**滞留雷，敌人触碰即引爆 */
  toss: {
    id: 'toss', icon: '塊', color: '#ffd25a', behavior: 'lob', maxLv: 5,
    name: { zh: '残留音块', en: 'Lingering Sound Brick', ja: '残響ブロック' },
    desc: {
      zh: '自动投掷音块到最近的破维魔，落点留下<b>滞留音场</b>持续伤害。近距离投掷物。',
      en: 'Auto-throws sound bricks at the nearest Tesseracter; the impact leaves a <b>lingering sound field</b> that keeps damaging. A short-range thrown weapon.',
      ja: '最寄りのテセラクターへ音塊を自動投擲し、着地点に<b>残響音場</b>を残して持続ダメージ。近距離投擲武器。',
    },
    lvDesc: [
      { zh: '投掷 1 块，落点滞留 2.5 秒。', en: 'Throws 1 brick; the field lingers 2.5s.', ja: '投擲 ×1、着地点に 2.5 秒の残響。' },
      { zh: '投掷 2 块。', en: 'Throws 2 bricks.', ja: '投擲 ×2。' },
      { zh: '滞留范围扩大、持续时间延长。', en: 'Wider, longer-lasting field.', ja: '残響の範囲と持続が拡大。' },
      { zh: '投掷间隔缩短，伤害提升。', en: 'Faster throws, more damage.', ja: '投擲間隔短縮、ダメージアップ。' },
      { zh: '投掷 3 块 —— 街区被残响填满。', en: '3 bricks — the streets fill with echoes.', ja: '投擲 ×3 —— 街は残響で満ちる。' },
    ],
    levels: [
      { cd: 2.2, dmg: 9, count: 1, r: 62, range: 260, fly: 0.42, life: 2.5 },
      { cd: 2.0, dmg: 11, count: 2, r: 66, range: 280, fly: 0.42, life: 2.6 },
      { cd: 1.9, dmg: 12, count: 2, r: 80, range: 300, fly: 0.4, life: 3.4 },
      { cd: 1.6, dmg: 14, count: 2, r: 84, range: 320, fly: 0.38, life: 3.6 },
      { cd: 1.5, dmg: 16, count: 3, r: 90, range: 340, fly: 0.36, life: 4.0 },
    ],
    evolved: {
      name: { zh: '残響ブロック -echo-', en: 'Lingering Sound Brick -Echo-', ja: '残響ブロック -echo-' },
      desc: {
        zh: '覚醒——四块残响同时落下，街区长久鸣响。',
        en: 'Awakened — four echoes fall at once; the district rings on.',
        ja: '覚醒——四つの残響が同時に落ち、街は長く鳴り続ける。',
      },
      stats: { cd: 1.15, dmg: 22, count: 4, r: 104, range: 380, fly: 0.34, life: 5.0 },
    },
  },
  bomb: {
    id: 'bomb', icon: '爆', color: '#ff7a4d', behavior: 'blast', maxLv: 5,
    name: { zh: '随机空爆', en: 'Random Air Raid', ja: 'ランダム空爆' },
    desc: {
      zh: '在自身周围<b>随机落点</b>降下音爆，短暂延迟后引爆。范围大、位置不可控。',
      en: 'Drops sound bombs at <b>random spots</b> around you, detonating after a short fuse. Wide area, no aim control.',
      ja: '自身の周囲の<b>無作為な地点</b>へ音爆を落とし、短い信管の後に起爆。広範囲・着弾は運任せ。',
    },
    lvDesc: [
      { zh: '每轮降下 1 枚音爆（信管 0.8 秒）。', en: 'Drops 1 bomb per cycle (0.8s fuse).', ja: '1 サイクルにつき音爆 ×1（信管 0.8 秒）。' },
      { zh: '每轮 2 枚。', en: '2 bombs per cycle.', ja: '1 サイクルにつき ×2。' },
      { zh: '爆炸范围扩大。', en: 'Wider blast.', ja: '爆発範囲が拡大。' },
      { zh: '每轮 3 枚，信管缩短。', en: '3 bombs, shorter fuse.', ja: '×3、信管短縮。' },
      { zh: '每轮 4 枚 —— 盲目轰炸整条街。', en: '4 bombs — carpet the whole street.', ja: '×4 —— 街全体を絨毯爆撃。' },
    ],
    levels: [
      { cd: 3.4, dmg: 26, count: 1, r: 90, range: 220, fuse: 0.8 },
      { cd: 3.1, dmg: 30, count: 2, r: 92, range: 240, fuse: 0.8 },
      { cd: 2.8, dmg: 34, count: 2, r: 112, range: 260, fuse: 0.75 },
      { cd: 2.4, dmg: 38, count: 3, r: 116, range: 280, fuse: 0.65 },
      { cd: 2.1, dmg: 44, count: 4, r: 124, range: 300, fuse: 0.6 },
    ],
    evolved: {
      name: { zh: '空爆 -carpet-', en: 'Air Raid -Carpet-', ja: '空爆 -carpet-' },
      desc: {
        zh: '覚醒——六连空爆覆盖视野，街区在音尘中沉寂。',
        en: 'Awakened — six bombs blanket the view; the district falls silent in sound-dust.',
        ja: '覚醒——六連の空爆が視界を覆い、街は音塵に沈む。',
      },
      stats: { cd: 1.7, dmg: 52, count: 6, r: 138, range: 330, fuse: 0.5 },
    },
  },
  mine: {
    id: 'mine', icon: '雷', color: '#7de0c8', behavior: 'minefield', maxLv: 5,
    /* vis ＝ **显示缩放**（判定与作用范围不受影响）：地雷只画一枚很小的核心 + 一圈淡虚线
     * （触发半径），免得整片雷区看起来像一堆大音场盖住地图。
     * v0.15.1：0.5 → **0.32**（面积约 1/10，人类 2026-10-18「地雷的 UI 做得更小」）；
     * 真实范围改由起爆瞬间的**向外推的圆**（触发半径 → 击杀半径）揭示。 */
    vis: 0.32,
    name: { zh: '音之地雷', en: 'Sound Mine', ja: '音の地雷' },
    desc: {
      zh: '在身后<b>放置</b>滞留音雷，破维魔触碰即引爆。适合边退边打。',
      en: 'Plants <b>lingering sound mines</b> behind you; they detonate when a Tesseracter touches them. Ideal while retreating.',
      ja: '後方に<b>残響の音雷</b>を設置し、テセラクターが触れると起爆。後退しながら戦うのに向く。',
    },
    lvDesc: [
      { zh: '每轮放置 1 枚（最多同时 4 枚）。', en: 'Plants 1 mine per cycle (max 4).', ja: '1 サイクルにつき ×1（同時最大 4）。' },
      { zh: '每轮 2 枚。', en: '2 mines per cycle.', ja: '×2。' },
      { zh: '爆炸范围扩大、存续延长。', en: 'Wider blast, longer life.', ja: '爆発範囲と持続が拡大。' },
      { zh: '最多同时 8 枚。', en: 'Up to 8 mines at once.', ja: '同時最大 8 枚。' },
      { zh: '每轮 3 枚 —— 退路即是雷区。', en: '3 mines — your retreat becomes a minefield.', ja: '×3 —— 退路がそのまま地雷原となる。' },
    ],
    levels: [
      { cd: 1.6, dmg: 30, count: 1, r: 70, life: 7, max: 4 },
      { cd: 1.5, dmg: 34, count: 2, r: 72, life: 8, max: 6 },
      { cd: 1.4, dmg: 40, count: 2, r: 86, life: 10, max: 6 },
      { cd: 1.2, dmg: 46, count: 2, r: 88, life: 12, max: 8 },
      { cd: 1.0, dmg: 54, count: 3, r: 94, life: 14, max: 10 },
    ],
    evolved: {
      name: { zh: '音の地雷 -minefield-', en: 'Sound Mine -Minefield-', ja: '音の地雷 -minefield-' },
      desc: {
        zh: '覚醒——四枚铺设，街区各处埋下终曲。',
        en: 'Awakened — four laid at once; the district is seeded with finales.',
        ja: '覚醒——四枚設置、街の各所に終曲を埋める。',
      },
      stats: { cd: 0.75, dmg: 66, count: 4, r: 108, life: 18, max: 12 },
    },
  },

  /* ===== 近战・挥刀系（v0.12 新武器模组；本作同人命名）=====
   * ★ 两个关键参数（每一级都可调）：
   *   arc ＝ **扇形角度（单位：度）** —— 挥砍覆盖的角度范围（90°→170°，覚醒 200°）
   *   len ＝ **刀长（单位：px）**     —— 扇形的半径（110→162，覚醒 188）
   * 判定实体＝KUP.Slash（扇形内逐帧判定、每敌人每次挥砍只吃一次伤害）。
   * Lv4 起额外释放**扇形冲击波**：复用「圆形波」Ring 的 arc/dir 参数
   * （wave.arc＝冲击波扇形角度（度）、wave.r＝半径、wave.dmgMul＝伤害系数）。 */
  slash: {
    id: 'slash', icon: '斬', color: '#ff8a5a', behavior: 'cleave', maxLv: 5,
    name: { zh: '斩音太刀', en: 'Sonic Blade', ja: '斬音の太刀' },
    desc: {
      zh: '挥出的歌声化作一振太刀——朝瞄准方向挥出<b>扇形斩击</b>，命中即击退。近战武器。',
      en: 'Your song sharpens into a single blade — a <b>fan-shaped slash</b> is swung toward your aim, knocking enemies back. A melee weapon.',
      ja: '歌が一振りの太刀となる——照準方向へ<b>扇形の斬撃</b>を放ち、命中した敵をノックバック。近接武器。',
    },
    lvDesc: [
      { zh: '扇形 90°・刀长 110 —— 基础的一闪。', en: '90° fan, 110 blade — a basic flash.', ja: '扇形 90°・刀長 110 —— 基本の一閃。' },
      { zh: '扇形 110°・刀长 122，伤害提升。', en: '110° fan, 122 blade, more damage.', ja: '扇形 110°・刀長 122、ダメージアップ。' },
      { zh: '扇形 130°・刀长 134，击退增强。', en: '130° fan, 134 blade, stronger knockback.', ja: '扇形 130°・刀長 134、ノックバック強化。' },
      { zh: '扇形 150°・刀长 148 —— <b>前进方向放出扇形冲击波</b>。', en: '150° fan, 148 blade — a <b>fan shockwave</b> bursts forward.', ja: '扇形 150°・刀長 148 —— <b>前方へ扇形の衝撃波</b>。' },
      { zh: '扇形 170°・刀长 162 —— 冲击波更宽更远。', en: '170° fan, 162 blade — a wider, longer wave.', ja: '扇形 170°・刀長 162 —— 衝撃波はより広く遠く。' },
    ],
    levels: [
      { cd: 0.90, dmg: 16, len: 110, arc: 90, kb: 180, life: 0.16 },
      { cd: 0.82, dmg: 20, len: 122, arc: 110, kb: 190, life: 0.16 },
      { cd: 0.76, dmg: 24, len: 134, arc: 130, kb: 200, life: 0.17 },
      { cd: 0.68, dmg: 28, len: 148, arc: 150, kb: 210, life: 0.17, wave: { arc: 120, r: 210, speed: 420, dmgMul: 0.75 } },
      { cd: 0.62, dmg: 32, len: 162, arc: 170, kb: 220, life: 0.18, wave: { arc: 150, r: 250, speed: 450, dmgMul: 0.85 } },
    ],
    evolved: {
      name: { zh: '斬音の太刀 -円舞-', en: 'Sonic Blade -Waltz-', ja: '斬音の太刀 -円舞-' },
      desc: {
        zh: '覚醒——刀身化为两百度的斩音圆舞，扇形冲击波随之而起。',
        en: 'Awakened — the blade becomes a 200° waltz of cutting sound, a fan shockwave rising with it.',
        ja: '覚醒——刀身は二百度の斬音円舞となり、扇形の衝撃波が呼応する。',
      },
      stats: { cd: 0.46, dmg: 44, len: 188, arc: 200, kb: 240, life: 0.20, wave: { arc: 190, r: 300, speed: 480, dmgMul: 1.0 } },
    },
  },

  /* ===== v0.21 派生（合并）武装：V.W.P《繁殖》对唱曲 =====
   * 规则（见 DESIGN.md「派生卡」）：
   *   - `derived.from` 是**两把具体武器**；两者同时在手时，升级卡池有**中等几率**
   *     出现对应的派生卡（KUP.CONFIG.DERIVED.chance，缺省 0.45）；
   *   - 选择后两把武器**合成一把**（释放 1 个武器槽），等级取两者中**较低**的那把；
   *   - 强度口径：强于其中任意一把、弱于两把叠加（合奏模组每轮只按一套效率运转）；
   *   - 合并后**没有覚醒形态**（合并本身就是觉醒），maxLv 仍是 5。
   * 曲名取自《繁殖》（派生曲 1st Album，20 曲）中**这两位角色**的对唱曲，
   * 出处：docs/lore/discography.md §2.6.1。本次只做 V.W.P 五人的试验批次。 */
  mahou: {
    id: 'mahou', icon: '魔', color: '#ff7ac6', behavior: 'chorus', maxLv: 5,
    derived: { from: ['note', 'orbit'], song: '魔法', pairing: ['kaf', 'rim'] },
    name: { zh: '魔法', en: 'Mahou', ja: '魔法' },
    desc: {
      zh: '派生——「私論理」与「暴食音球」同唱一曲：音球照旧绕身，<b>轮流从球体射出追踪音符</b>。森先化歩×谷置狸眼。',
      en: 'Derived — "Watashi Ronri" and the carnivorous orbs sing together: the orbs keep circling and <b>take turns firing homing notes</b>. MORISAKI KAFU × TANIOKI RIME.',
      ja: '派生——「私論理」と「食虫植物」の音球が同じ曲を歌う。球は周回したまま、<b>順番に追尾音符を放つ</b>。森先化歩×谷置狸眼。',
    },
    lvDesc: [
      { zh: '音球 ×2，每轮 2 枚追踪音符。', en: '2 orbs, 2 homing notes per cycle.', ja: '音球 ×2、毎巡 2 枚の追尾音符。' },
      { zh: '音球 ×3，音符伤害提升。', en: '3 orbs, stronger notes.', ja: '音球 ×3、音符のダメージアップ。' },
      { zh: '每轮 3 枚，接触伤害提升。', en: '3 notes per cycle, stronger contact.', ja: '毎巡 3 枚、接触ダメージアップ。' },
      { zh: '音球 ×4，每轮 4 枚。', en: '4 orbs, 4 notes per cycle.', ja: '音球 ×4、毎巡 4 枚。' },
      { zh: '音球 ×4、每轮 5 枚 —— 魔法在两首歌之间成立。', en: '4 orbs, 5 notes — magic takes hold between two songs.', ja: '音球 ×4、毎巡 5 枚 —— 二曲の間に魔法が成る。' },
    ],
    levels: [
      { cd: 1.5, dmg: 15, count: 2, orbCount: 2, r: 46, orbR: 18, orbDmg: 9, hitCd: 0.42, spin: 4.8 },
      { cd: 1.35, dmg: 17, count: 3, orbCount: 3, r: 48, orbR: 19, orbDmg: 10, hitCd: 0.40, spin: 4.7 },
      { cd: 1.2, dmg: 19, count: 3, orbCount: 3, r: 50, orbR: 20, orbDmg: 11, hitCd: 0.38, spin: 4.6 },
      { cd: 1.05, dmg: 21, count: 4, orbCount: 4, r: 52, orbR: 21, orbDmg: 12, hitCd: 0.36, spin: 4.5 },
      { cd: 0.95, dmg: 24, count: 5, orbCount: 4, r: 54, orbR: 22, orbDmg: 13, hitCd: 0.34, spin: 4.4 },
    ],
  },
  shinen: {
    id: 'shinen', icon: '淵', color: '#6a4dff', behavior: 'abyss', maxLv: 5,
    derived: { from: ['kuu', 'laser'], song: '深淵', pairing: ['kaf', 'isekaijoucho'] },
    name: { zh: '深淵', en: 'Shin\'en', ja: '深淵' },
    desc: {
      zh: '派生——「過去を喰らう」吞下敌人，「シリウスの心臓」在收束的瞬间从领域中心贯穿双光束。森先化歩×夜河世界。',
      en: 'Derived — the past is devoured, and at the instant the field closes, beams of "Sirius no Shinzou" pierce out from its center. MORISAKI KAFU × YORUKAWA SEKAI.',
      ja: '派生——「過去を喰らう」が敵を呑み、収束の瞬間に「シリウスの心臓」の光が領域中心から貫く。森先化歩×夜河世界。',
    },
    lvDesc: [
      { zh: '吞噬领域收束时从中心射出 1 道光束。', en: '1 beam pierces from the center when the field closes.', ja: '収束時に中心から 1 条のビーム。' },
      { zh: '领域与光束伤害提升。', en: 'More field and beam damage.', ja: '領域とビームのダメージアップ。' },
      { zh: '拖拽力增强，光束延长。', en: 'Stronger pull, longer beams.', ja: '引き寄せ強化、ビーム延長。' },
      { zh: '同时张开 2 个领域，每个 2 道光束。', en: '2 fields at once, 2 beams each.', ja: '領域 ×2、各 2 条のビーム。' },
      { zh: '领域 ×2、光束 ×2 —— 深渊没有底。', en: '2 fields, 2 beams — the abyss has no floor.', ja: '領域 ×2、ビーム ×2 —— 深淵に底はない。' },
    ],
    levels: [
      { cd: 4.2, dmg: 18, count: 1, r: 118, pull: 250, life: 0.62, beamDmg: 18, beamLen: 520, beamW: 16, beams: 1 },
      { cd: 3.9, dmg: 21, count: 1, r: 132, pull: 280, life: 0.68, beamDmg: 20, beamLen: 580, beamW: 18, beams: 1 },
      { cd: 3.6, dmg: 24, count: 1, r: 146, pull: 310, life: 0.74, beamDmg: 22, beamLen: 640, beamW: 20, beams: 1 },
      { cd: 3.3, dmg: 28, count: 2, r: 158, pull: 350, life: 0.82, beamDmg: 24, beamLen: 700, beamW: 22, beams: 2 },
      { cd: 3.0, dmg: 30, count: 2, r: 170, pull: 390, life: 0.92, beamDmg: 26, beamLen: 760, beamW: 22, beams: 2 },
    ],
  },
  honkai: {
    id: 'honkai', icon: '懐', color: '#5fc9a0', behavior: 'gale', maxLv: 5,
    derived: { from: ['horagai', 'taifuu'], song: '本懐', pairing: ['rim', 'harusaruhi'] },
    name: { zh: '本懐', en: 'Honkai', ja: '本懐' },
    desc: {
      zh: '派生——「法螺話」先把正面吹开一条道，「台風の子」随即碾过去。谷置狸眼×朝主派流。',
      en: 'Derived — "Horagai" blows the front open, then the child of the typhoon rolls through. TANIOKI RIME × ASANUSHI HARU.',
      ja: '派生——「法螺話」が正面を吹き開け、「台風の子」がそのまま轢いていく。谷置狸眼×朝主派流。',
    },
    lvDesc: [
      { zh: '扇风压 70° ＋ 巨大弹体 1 枚。', en: '70° wind fan + 1 heavy shot.', ja: '70° の風圧 ＋ 巨大弾 ×1。' },
      { zh: '弹体伤害与击退提升。', en: 'Stronger shot and knockback.', ja: '弾体のダメージとノックバックアップ。' },
      { zh: '扇风压加宽，弹体更大。', en: 'Wider fan, bigger shot.', ja: '扇角拡大、弾体拡大。' },
      { zh: '弹体 ×2，风压更强。', en: '2 shots, stronger wind.', ja: '弾体 ×2、風圧強化。' },
      { zh: '弹体 ×2、78° —— 本懐を遂げる。', en: '2 shots at 78° — the wish is fulfilled.', ja: '弾体 ×2、78° —— 本懐を遂げる。' },
    ],
    levels: [
      { cd: 2.9, dmg: 26, count: 1, r: 24, life: 2.4, pierce: 3, kb: 2.4, ringR: 175, ringArc: 70, ringKb: 350, ringDmg: 11 },
      { cd: 2.7, dmg: 29, count: 1, r: 26, life: 2.5, pierce: 3, kb: 2.5, ringR: 190, ringArc: 72, ringKb: 370, ringDmg: 13 },
      { cd: 2.5, dmg: 32, count: 1, r: 28, life: 2.6, pierce: 4, kb: 2.6, ringR: 205, ringArc: 74, ringKb: 390, ringDmg: 15 },
      { cd: 2.2, dmg: 36, count: 2, r: 30, life: 2.7, pierce: 4, kb: 2.8, ringR: 220, ringArc: 76, ringKb: 410, ringDmg: 16 },
      { cd: 1.95, dmg: 40, count: 2, r: 32, life: 2.8, pierce: 5, kb: 3.0, ringR: 235, ringArc: 78, ringKb: 430, ringDmg: 18 },
    ],
  },
  koshou: {
    id: 'koshou', icon: '傷', color: '#c96a7a', behavior: 'scar', maxLv: 5, warnColor: '#ffc2b8',
    derived: { from: ['bass', 'hakuchuumu'], song: '古傷', pairing: ['harusaruhi', 'koko'] },
    name: { zh: '古傷', en: 'Koshou', ja: '古傷' },
    desc: {
      zh: '派生——「テラ」的整圈冲击环向外推开敌人，环内同时落下白色的「白昼夢」空爆。朝主派流×輪廻此処。',
      en: 'Derived — a full "Terra" ring shoves everything out while white daydream bursts fall inside it. ASANUSHI HARU × RINNE KOKO.',
      ja: '派生——「テラ」の全周衝撃環が敵を押し出し、内側に白い「白昼夢」の空爆が落ちる。朝主派流×輪廻此処。',
    },
    lvDesc: [
      { zh: '冲击环 ＋ 1 枚延迟白爆。', en: 'Shock ring + 1 delayed burst.', ja: '衝撃環 ＋ 遅延爆発 ×1。' },
      { zh: '环与白爆伤害提升。', en: 'Stronger ring and bursts.', ja: '環と爆発のダメージアップ。' },
      { zh: '白爆 ×2。', en: '2 bursts.', ja: '爆発 ×2。' },
      { zh: '冷却缩短，信管加快。', en: 'Shorter cooldown and fuse.', ja: '冷却短縮、信管短縮。' },
      { zh: '白爆 ×3 —— 旧伤在四面八方同时裂开。', en: '3 bursts — old wounds split open on every side.', ja: '爆発 ×3 —— 旧傷が四方に裂ける。' },
    ],
    levels: [
      { cd: 3.6, dmg: 24, count: 1, r: 88, range: 200, fuse: 0.9, ringR: 155, ringKb: 180, ringDmg: 18 },
      { cd: 3.3, dmg: 28, count: 1, r: 94, range: 215, fuse: 0.85, ringR: 168, ringKb: 195, ringDmg: 21 },
      { cd: 3.0, dmg: 32, count: 2, r: 100, range: 235, fuse: 0.8, ringR: 180, ringKb: 210, ringDmg: 24 },
      { cd: 2.8, dmg: 36, count: 2, r: 108, range: 255, fuse: 0.72, ringR: 192, ringKb: 226, ringDmg: 28 },
      { cd: 2.6, dmg: 40, count: 3, r: 118, range: 280, fuse: 0.65, ringR: 205, ringKb: 240, ringDmg: 32 },
    ],
  },
  kokuin: {
    id: 'kokuin', icon: '印', color: '#9b8cff', behavior: 'stigma', maxLv: 5,
    derived: { from: ['lance', 'housekitan'], song: '刻印', pairing: ['koko', 'isekaijoucho'] },
    name: { zh: '刻印', en: 'Kokuin', ja: '刻印' },
    desc: {
      zh: '派生——「the last bullet」贯进目标的同时，「ヰ世界の宝石譚」在同一个脚下留下刻印般的宝光。輪廻此処×夜河世界。',
      en: 'Derived — the last bullet pierces the target while gem-light is stamped under the same foe like a seal. RINNE KOKO × YORUKAWA SEKAI.',
      ja: '派生——「the last bullet」が貫いた対象の足元に、「ヰ世界の宝石譚」の宝光が刻印のように残る。輪廻此処×夜河世界。',
    },
    lvDesc: [
      { zh: '音枪 ×2，目标脚下留下宝光。', en: '2 lances; gem-light lingers under the target.', ja: '音槍 ×2、対象の足元に宝光。' },
      { zh: '音枪 ×3，宝光伤害提升。', en: '3 lances, stronger light.', ja: '音槍 ×3、宝光のダメージアップ。' },
      { zh: '贯穿 +1，宝光范围扩大。', en: 'Pierce +1, wider light.', ja: '貫通 +1、宝光の範囲拡大。' },
      { zh: '音枪 ×4，宝光持续更久。', en: '4 lances, longer light.', ja: '音槍 ×4、宝光の持続延長。' },
      { zh: '音枪 ×5 —— 刻印钉进街区。', en: '5 lances — the seal is nailed into the district.', ja: '音槍 ×5 —— 刻印が街に打ち込まれる。' },
    ],
    levels: [
      { cd: 1.6, dmg: 14, count: 2, pierce: 1, fieldDmg: 9, fieldR: 58, fieldLife: 2.8 },
      { cd: 1.5, dmg: 16, count: 3, pierce: 1, fieldDmg: 10, fieldR: 64, fieldLife: 3.1 },
      { cd: 1.4, dmg: 18, count: 3, pierce: 2, fieldDmg: 11, fieldR: 70, fieldLife: 3.4 },
      { cd: 1.2, dmg: 21, count: 4, pierce: 2, fieldDmg: 12, fieldR: 76, fieldLife: 3.8 },
      { cd: 0.95, dmg: 24, count: 5, pierce: 3, fieldDmg: 14, fieldR: 82, fieldLife: 4.2 },
    ],
  },

  /* ===== v0.20 通用弹道：连射 / 散弹（通用组，无 owner）=====
   * 这两把同时是 projectile 大模组里 machinegun / shotgun 的**首个使用者**：
   *   mg  ：验证「弹夹 mag ＋ 换弹 reload ＋ 连射 cd」；
   *   shot：验证「总散布角 spread（弧度）＋ 多弹丸 count」。 */
  mg: {
    id: 'mg', icon: '連', color: '#9fe8ff', behavior: 'machinegun', maxLv: 5,
    name: { zh: '连符机关', en: 'Rondo Repeater', ja: '連符機関' },
    desc: {
      zh: '把乐句拆成连珠般的弹雨——<b>有弹夹</b>，打空后要换弹。通用连射武器。',
      en: 'A phrase shredded into a hail of bullets — it has a <b>magazine</b> and must reload when empty. A universal repeater.',
      ja: '楽句を連弾の弾雨に変える——<b>弾倉</b>を持ち、撃ち切ると装填が必要。汎用連射武器。',
    },
    lvDesc: [
      { zh: '弹夹 18 发，打空后换弹 1.6 秒。', en: '18-round magazine; 1.6s reload when empty.', ja: '弾倉 18 発、撃ち切ると 1.6 秒の装填。' },
      { zh: '弹夹 22 发，伤害提升。', en: '22 rounds, more damage.', ja: '弾倉 22 発、ダメージアップ。' },
      { zh: '弹夹 26 发，换弹加快。', en: '26 rounds, faster reload.', ja: '弾倉 26 発、装填が速くなる。' },
      { zh: '弹夹 30 发，射速提升。', en: '30 rounds, faster fire.', ja: '弾倉 30 発、射速アップ。' },
      { zh: '弹夹 34 发 —— 机关连符不停。', en: '34 rounds — the repeater never stops.', ja: '弾倉 34 発 —— 連符機関は止まらない。' },
    ],
    levels: [
      { cd: 0.17, dmg: 6, count: 1, mag: 18, reload: 1.6, spread: 0.05 },
      { cd: 0.16, dmg: 7, count: 1, mag: 22, reload: 1.5, spread: 0.05 },
      { cd: 0.15, dmg: 8, count: 1, mag: 26, reload: 1.3, spread: 0.05 },
      { cd: 0.13, dmg: 9, count: 1, mag: 30, reload: 1.1, spread: 0.055 },
      { cd: 0.11, dmg: 10, count: 1, mag: 34, reload: 1.0, spread: 0.06 },
    ],
    evolved: {
      name: { zh: '連符機関 -overdrive-', en: 'Rondo Repeater -Overdrive-', ja: '連符機関 -overdrive-' },
      desc: {
        zh: '覚醒——弹夹扩至 44 发，换弹几乎无缝，弹雨覆盖整条街。',
        en: 'Awakened — a 44-round drum and near-seamless reloads blanket the street.',
        ja: '覚醒——弾倉は 44 発、装填はほぼ途切れず、弾雨が街を覆う。',
      },
      stats: { cd: 0.09, dmg: 12, count: 1, mag: 44, reload: 0.85, spread: 0.065 },
    },
  },
  shot: {
    id: 'shot', icon: '散', color: '#ffb0c8', behavior: 'shotgun', maxLv: 5,
    name: { zh: '散弹和音', en: 'Scatter Chord', ja: '散弾和音' },
    desc: {
      zh: '一次奏响多枚弹丸，<b>以扇形散开</b>；贴脸全中才痛。通用散弹武器。',
      en: 'Many pellets ring out at once, <b>spread in a fan</b>; only point-blank hits hurt. A universal scattergun.',
      ja: '一度に多数の弾丸を<b>扇形に散らす</b>。至近距離で全弾当ててこそ痛い。汎用散弾武器。',
    },
    lvDesc: [
      { zh: '弹丸 ×5，扇形约 29°。', en: '5 pellets over a ~29° fan.', ja: '弾丸 ×5、扇角およそ 29°。' },
      { zh: '弹丸 ×6，伤害提升。', en: '6 pellets, more damage.', ja: '弾丸 ×6、ダメージアップ。' },
      { zh: '弹丸 ×7，射程延长。', en: '7 pellets, longer reach.', ja: '弾丸 ×7、射程延長。' },
      { zh: '弹丸 ×8，散布更宽。', en: '8 pellets, wider spread.', ja: '弾丸 ×8、散布拡大。' },
      { zh: '弹丸 ×9 —— 一和弦清空正面。', en: '9 pellets — one chord clears the front.', ja: '弾丸 ×9 —— 一和音で正面を薙ぎ払う。' },
    ],
    levels: [
      { cd: 1.6, dmg: 7, count: 5, spread: 0.5, life: 0.35 },
      { cd: 1.5, dmg: 8, count: 6, spread: 0.52, life: 0.36 },
      { cd: 1.4, dmg: 9, count: 7, spread: 0.55, life: 0.38 },
      { cd: 1.25, dmg: 10, count: 8, spread: 0.58, life: 0.4 },
      { cd: 1.15, dmg: 11, count: 9, spread: 0.6, life: 0.42 },
    ],
    evolved: {
      name: { zh: '散弾和音 -crescendo-', en: 'Scatter Chord -Crescendo-', ja: '散弾和音 -crescendo-' },
      desc: {
        zh: '覚醒——十一枚弹丸同时炸开，正面化作音墙。',
        en: 'Awakened — eleven pellets burst at once; the front becomes a wall of sound.',
        ja: '覚醒——十一の弾丸が同時に弾け、正面は音の壁となる。',
      },
      stats: { cd: 0.9, dmg: 14, count: 11, spread: 0.65, life: 0.46 },
    },
  },
};

/* 具体武器查询（v0.19 新增接口；与 KUP.MODULE_OF / KUP.WEAPONS_OF 配套） */
KUP.WEAPON = id => KUP.WEAPONS[id] || null;

/* ---------- 派生（合并）武装索引（v0.21）----------
 * 唯一真值仍是 KUP.WEAPONS 里每把武器的 `derived` 字段；这里只是按「来源武器」建反向索引，
 * 供 rollChoices 判断「玩家手里这两把能不能合并」。 */
KUP.DERIVED = {};
for (const _did in KUP.WEAPONS) {
  const _dw = KUP.WEAPONS[_did];
  if (_dw.derived) KUP.DERIVED[_did] = Object.assign({ id: _did }, _dw.derived);
}
/* 某把武器参与的所有派生（反向查询：这把武器能和谁合并） */
KUP.DERIVED_OF = wid => Object.keys(KUP.DERIVED)
  .filter(k => KUP.DERIVED[k].from.indexOf(wid) >= 0)
  .map(k => KUP.DERIVED[k]);
