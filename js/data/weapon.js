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
/* ---------- 武器模组注册表（v0.13.1）----------
 * **模组（behavior）＝ 玩法实现；具体武器（KUP.WEAPONS）＝ 数据。** 本表是两者的
 * 唯一对应处：一把武器只声明 `behavior`，实现与调参口径全部从这里取。
 *   - 一个模组可被多把武器共用（例：`bass` ＝ テラ・ドロップ ＋ 救済の鐘；
 *     `lance` ＝ 追唱の矢 ＋ 追唱の矢〈亜留〉），换武器不必改实现。
 *   - `base`  ：**模组级基准值**——等级表没写同名键时用它（原先散落在 game.js 分派里的
 *              写死常数；现在从这里调，加武器/改手感只动一处）。
 *   - `params`：该模组的等级表**可用参数键**（调参对照表；verify-run 会校验武器表的键
 *              不越界，写错键名会当场报错）。
 *   - `area`  ：**受「范围」(areaMult) 放大的键**——判定与外观一起放大；其余键（如光束
 *              宽度、音符存活时间）刻意不随范围变化，列在这里就是明确的口径。
 *   - `entity`：产出的实体类型（便于查「这把武器在场上生成什么」）。
 * 反向查询：KUP.MODULE(模组id) / KUP.MODULE_OF(武器id) / KUP.WEAPONS_OF(模组id)。 */
KUP.WEAPON_MODULES = {
  note: {
    id: 'note', entity: 'Projectile',
    name: { zh: '追踪音符', en: 'Homing Note', ja: '追尾ノート' },
    desc: { zh: '朝最近敌人射出追踪弹体；尺寸随「范围」放大。', en: 'Homing shots at the nearest foe; size scales with Area.', ja: '最寄りへ追尾弾を放つ。大きさは「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'split'],
    base: { speed: 400, r: 7, life: 2.2, homing: 5.2, pierce: 0 },
    area: ['r'],
  },
  orbit: {
    id: 'orbit', entity: 'WeaponRuntime.orbs',
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
  bass: {
    id: 'bass', entity: 'Ring',
    name: { zh: '圆形波', en: 'Shock Ring', ja: '衝撃リング' },
    desc: { zh: '以玩家为中心扩散的冲击环（可定向成扇形）；扩散半径随「范围」放大。', en: 'A ring expanding from you (can be a sector); radius scales with Area.', ja: '自機中心に広がる衝撃環（扇形化も可）。半径は「範囲」で拡大。' },
    params: ['cd', 'dmg', 'r', 'double', 'arc'],
    base: { speed: 300, kb: 170, arc: 360, doubleSpeed: 220, doubleKb: 140, doubleDmgMul: 0.7 },
    area: ['r'],
  },
  slash: {
    id: 'slash', entity: 'Slash',
    name: { zh: '近战・挥刀', en: 'Melee Slash', ja: '近接・斬撃' },
    desc: { zh: '朝瞄准方向挥出的扇形斩击；**刀长**随「范围」放大，扇形角度由数据表指定。', en: 'A fan-shaped slash toward your aim; **blade length** scales with Area, angle comes from data.', ja: '照準方向への扇形斬撃。**刀長**は「範囲」で拡大、角度はデータ表で指定。' },
    params: ['cd', 'dmg', 'len', 'arc', 'kb', 'life', 'wave'],
    base: { arc: 100, kb: 180, life: 0.18, 'wave.r': 120, 'wave.arc': 120, 'wave.speed': 420, 'wave.dmgMul': 0.75 },
    area: ['len', 'wave.r'],
  },
  laser: {
    id: 'laser', entity: 'Beam',
    name: { zh: '贯穿光束', en: 'Piercing Beam', ja: '貫通ビーム' },
    desc: { zh: '瞬间贯穿的定向光束；**长度**随「范围」放大，宽度不随范围变化。', en: 'An instant piercing beam; **length** scales with Area, width does not.', ja: '瞬時に貫くビーム。**長さ**は「範囲」で拡大、太さは変わらない。' },
    params: ['cd', 'dmg', 'len', 'w', 'double', 'targets'],
    /* v0.14：double（第二条光束）改向**第二个不同的敌人**发射；只有一个目标时改发**对向**
     * （dir+π，即"前后"）。不再用 doubleAngle 张开 0.3rad 的夹角——那会让两条光束都打不中。 */
    base: { doubleAngle: 0, doubleDmgMul: 0.7, targets: 2, arc: { k: 0.5 } },
    area: ['len'],
  },
  lance: {
    id: 'lance', entity: 'Projectile',
    name: { zh: '穿透音枪', en: 'Piercing Lance', ja: '貫通ランス' },
    desc: { zh: '高速穿透弹体；命中半径随「范围」放大（飞行距离不变）。', en: 'A fast piercing shot; hit radius scales with Area (travel distance unchanged).', ja: '高速貫通弾。命中半径は「範囲」で拡大（飛距離は不変）。' },
    params: ['cd', 'dmg', 'count', 'pierce', 'spread', 'targets'],
    /* v0.14：齐射按「最近 N 个不同的敌人」分配方向（targets，缺省 2），
     * 多余的弹体才围绕基准方向补角；spread 从「张开一个大夹角」改为**很小的夹角**（≈5°）。 */
    base: { speed: 560, r: 8, life: 1.6, spread: 0.085, targets: 2 },
    area: ['r'],
  },
  toss: {
    id: 'toss', entity: 'Toss → Zone',
    name: { zh: '投掷・滞留音场', en: 'Thrown Field', ja: '投擲・残響音場' },
    desc: { zh: '抛物线**分别投向最近 N 个不同敌人**（缺省 2），落点生成滞留音场；投掷距离与音场半径随「范围」放大。', en: 'Arcs toward **the nearest N different foes** (2 by default), each leaving a lingering field; throw range and field radius scale with Area.', ja: '最寄りの**別々の敵 N 体**へ放物線で投擲（既定 2）。着地点に残響音場。投擲距離と半径が「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'r', 'range', 'fly', 'life', 'targets'],
    /* v0.14：count 个投掷物**各向最近的不同敌人之一**（targets 决定"最近两个"的分配），
     * 不再是对着同一个最近敌人按 spread 撒开 —— 那是"一下投掷两个"，不是"向两个敌人各投一个"。 */
    base: { fly: 0.4, tickRate: 0.4, spread: 0.42, slowMul: 0.55, slowSec: 0.4, targets: 2 },
    area: ['r', 'range'],
  },
  bomb: {
    id: 'bomb', entity: 'Zone（bomb）',
    name: { zh: '随机空爆', en: 'Random Blast', ja: 'ランダム空爆' },
    desc: { zh: '在自身周围随机落点、延迟引爆；**散布距离与爆炸半径**随「范围」放大。', en: 'Random delayed blasts around you; **scatter range and blast radius** scale with Area.', ja: '周囲のランダム地点で遅延起爆。**散布距離と爆発半径**が「範囲」で拡大。' },
    params: ['cd', 'dmg', 'count', 'r', 'range', 'fuse'],
    base: { fuse: 0.95, minRange: 30 },
    area: ['r', 'range'],
  },
  mine: {
    id: 'mine', entity: 'Zone（mine）',
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
    id: 'note', icon: '♪', color: '#4ee6ff', behavior: 'note', maxLv: 5, owner: 'kaf',
    name: { zh: '分形音符', en: 'Fractal Note', ja: 'フラクタル・ノート' },
    desc: {
      zh: '乐曲「わたしの声」化作追尾敌人的音符。森先化歩的初期武装。',
      en: 'The song "Watashi no Koe" becomes notes that chase down enemies. MORISAKI KAFU\'s starting weapon.',
      ja: '楽曲「わたしの声」が音符と化して敵を追尾する。森先化歩の初期武装。',
    },
    lvDesc: [
      { zh: '追尾音符 ×2，命中后消失。', en: '2 homing notes; they vanish on hit.', ja: '追尾音符 ×2。命中すると消える。' },
      { zh: '音符 ×3，射速提升。', en: '3 notes, faster fire.', ja: '音符 ×3、射速アップ。' },
      { zh: '命中时分裂出 2 枚小音符。', en: 'Splits into 2 mini notes on hit.', ja: '命中時に小音符 ×2 に分裂。' },
      { zh: '音符 ×4，追踪性能增强。', en: '4 notes, stronger homing.', ja: '音符 ×4、追尾性能強化。' },
      { zh: '音符 ×6 —— 歌声响彻神椿市。', en: '6 notes — the song resounds through Kamitsubaki City.', ja: '音符 ×6 —— 歌声が神椿市に響き渡る。' },
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
      name: { zh: 'わたしの声 -unison-', en: 'Watashi no Koe -Unison-', ja: 'わたしの声 -unison-' },
      desc: {
        zh: '覚醒——「わたしの声」化为八枚合唱般的追尾音符。',
        en: 'Awakened — "Watashi no Koe" becomes eight homing notes singing as one.',
        ja: '覚醒——「わたしの声」が合唱のような八つの追尾音符と化す。',
      },
      stats: { cd: 0.55, dmg: 24, count: 8, split: 1 },
    },
  },
  orbit: {
    id: 'orbit', icon: '◎', color: '#ff6bb5', behavior: 'orbit', maxLv: 5, owner: 'rim',
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
  bass: {
    id: 'bass', icon: '低', color: '#ffb25a', behavior: 'bass', maxLv: 5, owner: 'harusaruhi',
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
  lance: {
    id: 'lance', icon: '槍', color: '#b06bff', behavior: 'lance', maxLv: 5, owner: 'koko',
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
  laser: {
    id: 'laser', icon: '光', color: '#7aa0ff', behavior: 'laser', maxLv: 5, owner: 'isekaijoucho',
    name: { zh: '消失光束', en: 'Vanish Beam', ja: 'ヴァニッシュ・ビーム' },
    desc: {
      zh: '描摹乐曲「キミ消失セカイ」的贯穿光束。夜河世界的初期武装。',
      en: 'A piercing beam tracing the song "Kimi Shometsu Sekai". YORUKAWA SEKAI\'s starting weapon.',
      ja: '楽曲「キミ消失セカイ」をなぞる貫通光束。夜河世界の初期武装。',
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
      name: { zh: 'キミ消失セカイ -vanish-', en: 'Kimi Shometsu Sekai -Vanish-', ja: 'キミ消失セカイ -vanish-' },
      desc: {
        zh: '覚醒——「キミ消失セカイ」的双重光束，消失于世界的彼端。',
        en: 'Awakened — twin beams tracing "Kimi Shometsu Sekai", vanishing beyond the world.',
        ja: '覚醒——「キミ消失セカイ」の二連光束、世界の彼端へ消える。',
      },
      stats: { cd: 1.6, dmg: 44, len: 900, w: 30, double: true },
    },
  },
  /* ===== 招募角色（魔女候補）的初期武装 =====
   * ⚠ 这两把官方乐曲名（存流／明透的代表曲未在 lore 中列出）——
   *   为本作同人命名，取自「ヰ世界救済教団」的祈祷意象（教団用语见 lore §4.7）。 */
  prayer: {
    id: 'prayer', icon: '鐘', color: '#8fa8ff', behavior: 'bass', maxLv: 5, owner: 'aru',
    name: { zh: '救済之钟', en: 'Bell of Salvation', ja: '救済の鐘' },
    desc: {
      zh: '教团的祈祷化作钟声冲击环。天祢亜留的初期武装。',
      en: 'The order\'s prayer becomes a bell-like shockwave. AMANE ARU\'s starting weapon.',
      ja: '教団の祈りが鐘の衝撃環となる。天祢亜留の初期武装。',
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
      name: { zh: '救済の鐘 -requiem-', en: 'Bell of Salvation -Requiem-', ja: '救済の鐘 -requiem-' },
      desc: {
        zh: '覚醒——钟声化为镇魂的双重冲击，为街区献上安魂。',
        en: 'Awakened — the bell becomes a twin requiem quake.',
        ja: '覚醒——鐘は鎮魂の二重衝撃となり、街に安魂を捧げる。',
      },
      stats: { cd: 1.6, dmg: 44, r: 230, double: true },
    },
  },
  follow: {
    id: 'follow', icon: '矢', color: '#7de0c8', behavior: 'lance', maxLv: 5, owner: 'asu',
    name: { zh: '追唱之矢', en: 'Arrows of the Refrain', ja: '追唱の矢' },
    desc: {
      zh: '追随的歌声化作贯穿之矢。地邑阿栖的初期武装。',
      en: 'A following song becomes piercing arrows. CHIMURA ASU\'s starting weapon.',
      ja: '追従の歌が貫通の矢となる。地邑阿栖の初期武装。',
    },
    lvDesc: [
      { zh: '朝最近的破维魔射出 2 支贯穿之矢（夹角很小，主要打同一个）。', en: 'Fires 2 piercing arrows at the nearest foe (tight spread).', ja: '最寄りへ貫通の矢 ×2（狭い角度）。' },
      { zh: '之矢 ×3。', en: '3 arrows.', ja: '矢 ×3。' },
      { zh: '贯穿数 +1。', en: 'Pierce +1.', ja: '貫通数 +1。' },
      { zh: '之矢 ×4（分射最近两个破维魔）。', en: '4 arrows (the two nearest foes get one each).', ja: '矢 ×4（最寄り 2 体へ）。' },
      { zh: '之矢 ×5，贯穿数 +1 —— 合唱不止。', en: '5 arrows, pierce +1 — the chorus never ends.', ja: '矢 ×5、貫通数 +1 —— 合唱は止まない。' },
    ],
    levels: [
      { cd: 1.25, dmg: 13, count: 2, pierce: 1 },
      { cd: 1.2, dmg: 14, count: 3, pierce: 1 },
      { cd: 1.15, dmg: 16, count: 3, pierce: 2 },
      { cd: 1.1, dmg: 18, count: 4, pierce: 2 },
      { cd: 1.0, dmg: 21, count: 5, pierce: 3 },
    ],
    evolved: {
      name: { zh: '追唱の矢 -chorus-', en: 'Arrows of the Refrain -Chorus-', ja: '追唱の矢 -chorus-' },
      desc: {
        zh: '覚醒——六连追唱，矢列如合唱般贯穿。',
        en: 'Awakened — six arrows fly as one chorus.',
        ja: '覚醒——六連の追唱、矢列は合唱のように貫く。',
      },
      stats: { cd: 0.8, dmg: 25, count: 6, pierce: 4 },
    },
  },

  /* ===== 新武器组：滞留・投掷系（2026-10 追加；全部为本作同人命名与机制）=====
   * 三把武器共用新的「区域（Zone）」实体：
   *   - toss 残留音块：自动**投掷**到最近敌人处，落点留下**滞留**音场
   *   - bomb 随机空爆：在自身周围**随机**落点、延迟引爆
   *   - mine 音之地雷：在身后**放置**滞留雷，敌人触碰即引爆 */
  toss: {
    id: 'toss', icon: '塊', color: '#ffd25a', behavior: 'toss', maxLv: 5,
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
    id: 'bomb', icon: '爆', color: '#ff7a4d', behavior: 'bomb', maxLv: 5,
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
    id: 'mine', icon: '雷', color: '#7de0c8', behavior: 'mine', maxLv: 5,
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
    id: 'slash', icon: '斬', color: '#ff8a5a', behavior: 'slash', maxLv: 5,
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
};

/* 具体武器查询（v0.19 新增接口；与 KUP.MODULE_OF / KUP.WEAPONS_OF 配套） */
KUP.WEAPON = id => KUP.WEAPONS[id] || null;
