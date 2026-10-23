/* ================= 支援物品／同伴数据域（js/data/support.js） =================
 * 模块 id：support
 * 内容：KUP.COMPANIONS（同伴；v0.13.3 起彩季詩得 retired、数据保留）
 *       → KUP.SUPPORTS（一局带一件的支援物品）。
 * 依赖：语义上依赖 char（owner 记录顺序对应，不参与数值）。
 * 纪律：支援物品先不做差异化（五件 perk 同值）；改效果只改各自 perk。
 * ================================================================ */

window.KUP = window.KUP || {};

/* ---------- 可招募（同行支援，非可操作角色） ----------
 * ★ 2026-10 修正：同行支援层不再是自创角色，改用 **REGENERATE 官方页给出的既存角色**——
 *   「肆番街相遇的少女，**復興課課員**」**彩季 詩得（サイキ シエル＝CIEL）**【官方】。
 *   ⚠️ CIEL 本人出自平级企划（深脊界／空爽），**不并入本作世界观**；本作只取她在
 *      神椿市侧的官方化身（lore §3.5／§13.5／§15.6）。
 *   与魔女候補（aru／asu，见上方 KUP.CHARS）同属「招募式」——需通关肆番街后、
 *   并在瓦利斯支付 1 张市民票（v0.16：票由现金兑换），才能在选人界面带出。
 * perk 为同行效果；皮肤（KUP.FORMS kind='companion'）另加少量修正。 */
KUP.COMPANIONS = [
  {
    id: 'ciel',
    name: '彩季 詩得', nameEn: 'Ciel Saiki', reading: 'サイキ シエル', romaji: 'SAIKI SHIERU',
    cv: 'CIEL', cvEn: 'CIEL',
    faction: { zh: '復興課', en: 'Reconstruction Division', ja: '復興課' },
    rank: { zh: '復興課課員', en: 'Reconstruction Division staff', ja: '復興課課員' },
    color: '#5ad0ff', color2: '#1f4f8f',
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    desc: {
      zh: '在肆番街相遇的少女，<b>復興課課員</b>。以观测支援同行的歌声——拾取范围 +20%、经验 +15%。',
      en: 'A girl met in Area 4 and a <b>staff member of the Reconstruction Division</b>. Her observational support widens your song — pickup +20%, XP +15%.',
      ja: '肆番街で出会う少女、<b>復興課課員</b>。観測支援が歌声を支える——取得範囲 +20%、経験 +15%。',
    },
    /* 招募条件：通关肆番街（復興課的活动区域）＋ 1 张市民票（v0.16） */
    unlock: { area: 'area4', cost: 1, desc: { zh: '通关肆番街后加入', en: 'Joins after clearing Area 4', ja: '肆番街クリアで加入' } },
    /* v0.13.3：**彩季詩得先退出**（人类 2026-10-17 决定）——数据与 JK 皮肤全部保留，
     * retired 只表示「不在出击界面出现、不可被选」；以后想恢复只需去掉这个标记。
     * 同行支援的位置改由下面的「支援物品」承担（见 KUP.SUPPORTS）。 */
    retired: true,
  },
];
KUP.COMPANION = id => KUP.COMPANIONS.find(c => c.id === id) || null;
/* 兼容别名（旧调用） */
KUP.RECRUITS = KUP.COMPANIONS;
KUP.RECRUIT = KUP.COMPANION;
/* 在出击界面可见/可选的同伴（retired 的不算） */
KUP.companionsActive = () => KUP.COMPANIONS.filter(c => !c.retired);

/* ---------- 支援物品（v0.13.3：同行支援从「同伴角色」改为「物品」） ----------
 * 人类 2026-10-17：「彩季先退出，支援做成支援物品」——五件支援物**顺序对应五位魔女之子**
 * （花譜／理芽／異世界情緒／春猿火／幸祜），但**先不做差异化**：五件 `perk` 数值完全相同，
 * 以后要做差异化只改各自那条 perk 即可（结构已经就位）。
 *   - `owner`：该支援物对应的魔女之子 id（现在只作记录，不参与数值）。
 *   - `perk` ：支援效果；`type:'gather'` 的乘法项由 Player.recompute 结算，
 *             `type:'regen'` 由 game.update 周期结算（沿用旧同伴的两种机制）。
 *   - `unlock.cost`：**局外解锁**价（v0.16 起为**现金/元**，在瓦利斯的「培养・招募」页购买）。
 * 命名：冰淇淋／巧克力／糖果／泡芙／炸年糕果子（arare＝炸年糕果子，人类 2026-10-17 更正）。 */
KUP.SUPPORTS = [
  {
    id: 'icecream', icon: '冰', color: '#8fd0ff',
    name: { zh: '冰淇淋', en: 'Ice Cream', ja: 'アイスクリーム' },
    /* 顺序 1／5 ↔ 花譜（魔女之子 カフ） */
    owner: 'kaf',
    desc: {
      zh: '冰凉的支援——观测支援化作一口甜。<b>拾取范围 +20%、经验 +15%</b>。',
      en: 'A cool reinforcement — observational support in a scoop. <b>Pickup +20%, XP +15%</b>.',
      ja: '冷たい支援——観測支援はひとくちの甘さに。<b>取得範囲 +20%、経験 +15%</b>。',
    },
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    unlock: { cost: 400 },
  },
  {
    id: 'chocolate', icon: '巧', color: '#c98a6b',
    name: { zh: '巧克力', en: 'Chocolate', ja: 'チョコレート' },
    /* 顺序 2／5 ↔ 理芽（魔女之子 リメ） */
    owner: 'rim',
    desc: {
      zh: '苦涩回甘的支援——观测支援化作一块可可。<b>拾取范围 +20%、经验 +15%</b>。',
      en: 'Bittersweet reinforcement — observational support in a square of cocoa. <b>Pickup +20%, XP +15%</b>.',
      ja: 'ほろ苦い支援——観測支援はひとかけのカカオに。<b>取得範囲 +20%、経験 +15%</b>。',
    },
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    unlock: { cost: 400 },
  },
  {
    id: 'candy', icon: '糖', color: '#ff8ac4',
    name: { zh: '糖果', en: 'Candy', ja: 'キャンディ' },
    /* 顺序 3／5 ↔ 異世界情緒（魔女之子 セカイ） */
    owner: 'isekaijoucho',
    desc: {
      zh: '含在口中的支援——观测支援化作一颗硬糖。<b>拾取范围 +20%、经验 +15%</b>。',
      en: 'A candy held on the tongue — observational support, hard and bright. <b>Pickup +20%, XP +15%</b>.',
      ja: '口に含む支援——観測支援はひと粒の飴に。<b>取得範囲 +20%、経験 +15%</b>。',
    },
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    unlock: { cost: 400 },
  },
  {
    id: 'puff', icon: '芙', color: '#ffd98a',
    name: { zh: '泡芙', en: 'Cream Puff', ja: 'シュークリーム' },
    /* 顺序 4／5 ↔ 春猿火（魔女之子 ハル） */
    owner: 'harusaruhi',
    desc: {
      zh: '蓬松的支援——观测支援化作一只奶油泡芙。<b>拾取范围 +20%、经验 +15%</b>。',
      en: 'A fluffy reinforcement — observational support in choux pastry. <b>Pickup +20%, XP +15%</b>.',
      ja: 'ふわりとした支援——観測支援はシュークリームに。<b>取得範囲 +20%、経験 +15%</b>。',
    },
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    unlock: { cost: 400 },
  },
  {
    id: 'arare', icon: '炸', color: '#ffb25a',
    name: { zh: '炸年糕果子', en: 'Fried Rice-Cake Bits', ja: 'あられ' },
    /* 顺序 5／5 ↔ 幸祜（魔女之子 ココ） */
    owner: 'koko',
    desc: {
      zh: '香脆的支援——观测支援化作一把炸年糕果子（arare）。<b>拾取范围 +20%、经验 +15%</b>。',
      en: 'A crisp reinforcement — observational support as fried rice-cake bits (arare). <b>Pickup +20%, XP +15%</b>.',
      ja: '香ばしい支援——観測支援はあられに。<b>取得範囲 +20%、経験 +15%</b>。',
    },
    perk: { type: 'gather', pickup: 1.2, xp: 1.15 },
    unlock: { cost: 400 },
  },
];
KUP.SUPPORT = id => KUP.SUPPORTS.find(s => s.id === id) || null;
