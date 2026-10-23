/* ================= 皮肤（形态）数据域（js/data/skin.js） =================
 * 模块 id：skin
 * 内容：KUP.FORM_SERIES（系列共同字段）→ KUP.FORMS（每条只写差异）→ build 补齐
 *       → KUP.NO_FORM（内部占位）→ 查询／分组接口（defaultForm／formFits／formsFor／
 *       formsOfChar／formGroups／charKind）。
 * 依赖：语义上依赖 char（char／kinds 绑定）；build 段必须在本文件末尾之前执行。
 * 纪律：不要改已有形态 id（已写入存档 run.form）；数值政策＝只有覚醒／戦闘形態带 mods。
 * 加形态＝FORMS 加一行（系列承载说明/配色/配件/出处）；加系列＝FORM_SERIES 加一条。
 * ================================================================ */

window.KUP = window.KUP || {};

/* ---------- 皮肤＝「形態」（★ 官方命名法：「（魔女）特殊歌唱用形態 ○○」） ----------
 * 官方 LIVE 的服装/形态命名实例：「特殊歌唱用形態 星鴉」「魔女特殊歌唱用形態 花魁鳥」（粉丝 wiki 转引官方命名）
 *   —— 出处等级【粉丝 wiki 转引】，故 `ouranchou.src` 如实写「粉丝 wiki 转引」。
 * ⚠️ 泛称「歌唱形態」**不是官方术语**（萌百仅 2 处编者自拟小节标题）；本作一律用「（魔女）特殊歌唱用形態 ○○」。
 * ⚠️ `src` 字段**只作数据层的出处记录**（verify-run 会校验它存在，见 tools/verify-run.js）；
 *    **界面不再显示出处行**（ui.js 里对应的渲染已注释掉）。
 * 本批形态（2026-10）：
 *   - 魔女之子（kinds:['witch']）：花魁鳥／姬連雀 —— 本批共用；★ 姬連雀出自
 *     **V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」**（2026-02-28 公布；人类 2026-10-21 指正，
 *     此前误标「本作同人命名」——旧标法与粉丝 wiki/官方 SRD 的同期记录一致，属**来源时间差**，非臆造）
 *   - 可招募角色·魔女候補（kinds:['recruit']）：黑／白 —— 本作暂定名；后续每位分别定制
 *   - 同伴（kinds:['companion']）：JK 制服（夏／冬）—— 本作设定，后续为每位同伴定制
 * 实现方式：
 *   accent: plume 羽饰 / crest 冠羽 / veil 面纱 / halo 光晕 / sailor 水手领 / blazer 西装外套
 *          / sparrow_wing 青雀翼羽 / star_ring 银环 / koi_sash 鲤纹带 / flower_crown 花冠 / star_tiara 星冕
 *          / none
 *   → 比纯颜色更可辨（轮廓差异），且：
 *     只需在 Player._accent 与同伴绘制处按 form.accent 分支，或改读 form.sprite。 */
/* ---------- 形态系列（KUP.FORM_SERIES）----------
 * v0.13.5：把采集稿里的形态**全部**实现时，为避免每条形态重复写说明/配色/出处，
 * 把**系列共同字段**放在这里；每条形态只写自己的差异（id／系列／名字／可选覆盖），
 * 载入后由 `KUP.FORMS` 之后的那段补齐（见「形态系列 → 形态」的 build 段）。
 *   - `char`：系列自带的专属角色（形态可用自己的 `char` 覆盖；null ＝ 通用/共用）
 *   - `accent`/`color`/`color2`：该系列默认的轮廓配件与配色（形态可覆盖）
 *   - `desc`：系列说明（玩家可见）——形态自己的说明放 `note`，两者拼接
 *   - `src` ：出处（**不显示给玩家**，只作记录；形态可覆盖）
 * 依据：docs/lore/research/vwp_forms_and_mascots.md（逐项带出典等级）：
 *   §2.1 官方花譜 WORDS 全表／§2.2 非公式 wiki 衣装节／§2.5 官方 FINDME STORE 全店穷举
 *   （2025–2026 的新衣装只有商品页才有：梟・銀兜・金兜・Dr.Futurity）。
 * ⚠️ 采集稿的两条纪律照抄：①「命名母题」是**本作观察**、官方从未这样表述；
 *   ②「未找到」不等于不存在（落后来源的否证无效）——故本表只写有出处的名字。 */
KUP.FORM_SERIES = [
  {
    id: 'kaf_singing', char: 'kaf', accent: 'bird_plume', color: '#5ad0ff', color2: '#123a63',
    short: { zh: '化歩', en: 'Kafu', ja: '化歩' },
    name: { zh: '特殊歌唱用形態（化歩）', en: 'Special Singing Forms (Kafu)', ja: '特殊歌唱用形態（花譜）' },
    desc: {
      zh: '化歩的形态序列——官方命名线**全部取自鸟名**（「第○形態」与「特殊歌唱用形態」是两条并行线）。形态名为官方，服装为本作设计。',
      en: 'Kafu\'s form line — every official name is a **bird** ("Nth Form" and "Special Singing Form" run in parallel). Names are official; costumes are designed for this work.',
      ja: '化歩の形態系列——公式の命名は**全て鳥名**（「第○形態」と「特殊歌唱用形態」は並行する二系統）。名称は公式、衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝官方（花譜 公式サイト WORDS「歌唱形態」全表 ＋ 官方 FINDME STORE 商品页的 2025–2026 新衣装 梟／梟黒）',
      en: 'Form names: official (Kafu official site WORDS full list + the 2025–2026 costumes 梟/梟黒 from the official FINDME STORE listings)',
      ja: '形態名＝公式（花譜 公式サイト WORDS「歌唱形態」一覧 ＋ 公式 FINDME STORE 商品ページの 2025–2026 新衣装 梟／梟黒）',
    },
  },
  {
    id: 'rim_meta', char: 'rim', accent: 'sf_visor', color: '#e8ecf6', color2: '#5b6480',
    short: { zh: '狸眼', en: 'Rime', ja: '狸眼' },
    name: { zh: 'Metamorphose 系列（狸眼）', en: 'Metamorphose series (Rime)', ja: 'Metamorphose 系列（狸眼）' },
    desc: {
      zh: '狸眼的衣装系列——命名走**英文 SF 小説**风格（其中数部与 P. K. Dick 作品同名，此项为本作观察）。形态名为官方商品／非公式 wiki 整理，服装为本作设计。',
      en: 'Rime\'s costume series — names in **English SF-novel** style (several share titles with P. K. Dick; our reading). Names from official listings/fan-wiki records; costumes designed for this work.',
      ja: '狸眼の衣装系列——命名は**英語 SF 小説**風（P. K. Dick と同名の作が複数。本作の見立て）。名称は公式商品／非公式 wiki の整理、衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝官方（FINDME STORE「歴代衣装」系列商品名 ＋ 官方 YouTube 社区帖的 UBIK）＋ 非公式 wiki 整理（各项带名称出典）',
      en: 'Form names: official (FINDME STORE "successive costumes" product titles + the official YouTube post for UBIK) + fan-wiki compilation (each with a stated source)',
      ja: '形態名＝公式（FINDME STORE「歴代衣装」シリーズ商品名 ＋ 公式 YouTube コミュニティ投稿の UBIK）＋ 非公式 wiki の整理（各項に名称出典）',
    },
  },
  {
    id: 'haru_matoi', char: 'harusaruhi', accent: 'koi_sash', color: '#ff8a4e', color2: '#3b1030',
    short: { zh: '派流', en: 'Haru', ja: '派流' },
    name: { zh: '纏 系列与新衣装（派流）', en: 'Matōi series & new costumes (Haru)', ja: '纏 系列と新衣装（派流）' },
    desc: {
      zh: '派流的衣装——「纏 其ノ○」系列命名取自**锦鲤品种**（此项为本作观察），另有 2025–2026 的新衣装「銀兜」「金兜」。服装为本作设计。',
      en: 'Haru\'s costumes — the "Matōi" series is named after **koi breeds** (our reading), plus the 2025–2026 costumes 銀兜/金兜. Costumes designed for this work.',
      ja: '派流の衣装——「纏 其ノ○」は**鯉の品種**に由来（本作の見立て）。ほかに 2025–2026 の新衣装「銀兜」「金兜」。衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝非公式 wiki 整理（衣装节）＋ 官方 FINDME STORE 商品页（銀兜／金兜，2025–2026）',
      en: 'Form names: fan-wiki compilation (costume section) + official FINDME STORE listings (銀兜/金兜, 2025–2026)',
      ja: '形態名＝非公式 wiki の整理（衣装節）＋ 公式 FINDME STORE 商品ページ（銀兜／金兜、2025–2026）',
    },
  },
  {
    id: 'sekai_anima', char: 'isekaijoucho', accent: 'flower_crown', color: '#c9a6ff', color2: '#3a2350',
    short: { zh: '世界', en: 'Sekai', ja: '世界' },
    name: { zh: '普遍体・変異体（世界）', en: 'Universal / Variant forms (Sekai)', ja: '普遍体・変異体（世界）' },
    desc: {
      zh: '世界的衣装——命名取自**花名**。「普遍体」是日常形象，「変異体」是演唱会等特殊场合的形象。服装为本作设计。',
      en: 'Sekai\'s costumes — named after **flowers**. "Universal" is the everyday look; "Variant" appears on special stages. Costumes designed for this work.',
      ja: '世界の衣装——命名は**花名**。「普遍体」は日常の姿、「変異体」は特別な舞台の姿。衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝非公式 wiki 整理 ＋ 萌娘百科（各项带名称出典：「Anima」系列 LIVE パンフレット）',
      en: 'Form names: fan-wiki compilation + Moegirl (each with a stated source: the "Anima" live pamphlets)',
      ja: '形態名＝非公式 wiki の整理 ＋ 萌娘百科（各項に名称出典：「Anima」ライブパンフレット）',
    },
  },
  {
    id: 'koko_type', char: 'koko', accent: 'star_tiara', color: '#9fe8ff', color2: '#1b2f5e',
    short: { zh: '此処', en: 'Koko', ja: '此処' },
    name: { zh: 'type- 系列（此処）', en: 'type- series (Koko)', ja: 'type- 系列（此処）' },
    desc: {
      zh: '此処的衣装系列——命名取自**恒星**。形态名为官方 WORDS／非公式 wiki 整理，服装为本作设计。',
      en: 'Koko\'s costume series — named after **stars**. Names from official WORDS / fan-wiki records; costumes designed for this work.',
      ja: '此処の衣装系列——命名は**恒星**。名称は公式 WORDS／非公式 wiki の整理、衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝官方 WORDS ＋ 非公式 wiki 整理（各项带名称出典）',
      en: 'Form names: official WORDS + fan-wiki compilation (each with a stated source)',
      ja: '形態名＝公式 WORDS ＋ 非公式 wiki の整理（各項に名称出典）',
    },
  },
  {
    id: 'vwp_shared', char: null, accent: 'plume', color: '#ff7ad9', color2: '#8a1f52',
    short: { zh: '共用', en: 'Shared', ja: '共用' },
    name: { zh: '魔女特殊歌唱用形態（五人共用）', en: 'Witch Special Singing Forms (shared)', ja: '魔女特殊歌唱用形態（五人共用）' },
    desc: {
      zh: '五人共用的形态——官方明记「花魁鳥 (Revolutions) 是为 V.W.P 特别准备的魔女们の特殊歌唱形態」，故**五位魔女之子都可用**（官方商品亦为五人各出一件）。形态名为官方，服装为本作设计。',
      en: 'Shared by all five — the official glossary states this line was "prepared especially for V.W.P", and the official goods list one item per member. Available to **every witchling**. Names official; costumes designed for this work.',
      ja: '五人共用の形態——公式に「V.W.P のために特別に用意された、魔女たちの特殊歌唱形態」と明記され、公式商品も五人分が各一件。**五人の魔女の娘全員が装備できる**。名称は公式、衣装は本作デザイン。',
    },
    src: {
      zh: '形态名＝官方（花魁鳥 (Revolutions) 词条／官方 VR 曲目表「変身／花魁鳥」＝Witches Awakening／官方商品页／姬連雀＝V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」）',
      en: 'Form names: official (the Oiran-chō (Revolutions) entry / official VR tracklist "Witches Awakening" / official product pages / Hime-renjaku = V.W.P 4th ONE-MAN LIVE "Phenomenon IV -Hanten Unmei-")',
      ja: '形態名＝公式（花魁鳥 (Revolutions) の項目／公式 VR 曲目表「変身／花魁鳥」＝Witches Awakening／公式商品ページ／姫連雀＝V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」）',
    },
  },
  {
    id: 'legacy', char: null, accent: 'crest', color: '#8affc9', color2: '#0f6b52',
    short: { zh: '自创', en: 'Original', ja: '本作' },
    name: { zh: '本作自创形态', en: 'Forms original to this work', ja: '本作オリジナルの形態' },
    desc: {
      zh: '本作同人命名的形态（官方**无**此形态名）——留作本作自创服装的位置。',
      en: 'Forms named by this work (there is **no** official form of this name).',
      ja: '本作の同人命名による形態（公式にこの形態名は**ない**）。',
    },
    src: { zh: '本作自创（官方无此形态名）', en: 'Original to this work (no official form of this name)', ja: '本作オリジナル（公式にこの形態名はない）' },
  },
];
KUP.FORMS = [
  /* ---- 魔女之子（witch） ---- */
  {
    id: 'ouranchou', kinds: ['witch'], series: 'vwp_shared', accent: 'plume',
    name: { zh: '花魁鳥', en: 'Oiran-chō', ja: '花魁鳥' },
    label: { zh: '魔女特殊歌唱用形態 花魁鳥', en: 'Witch Special Singing Form: Oiran-chō', ja: '魔女特殊歌唱用形態 花魁鳥' },
    desc: { zh: '华美的花魁之羽——舞台中心的高歌。<br>攻击范围 +15%、冷却 -8%，最大生命 -8%。', en: 'The gorgeous plumage of the oiran — a song for center stage.<br>Area +15%, cooldown -8%, max HP -8%.', ja: '華やかな花魁の羽——舞台中央の高歌。<br>範囲 +15%、クールタイム -8%、最大生命 -8%。' },
    mods: { area: 1.15, cd: 0.92, hp: 0.92 },
    color: '#ff7ad9', color2: '#8a1f52',
    src: { zh: '官方 LIVE 形态命名（粉丝 wiki 转引）', en: 'Official live-form naming (fan-wiki transcript)', ja: '公式 LIVE の形態命名（ファンwiki 転引）' },
  },
  {
    id: 'himerenjaku', kinds: ['witch'], series: 'vwp_shared', accent: 'crest',
    name: { zh: '姬連雀', en: 'Hime-renjaku', ja: '姫連雀' },
    label: { zh: '魔女特殊歌唱用形態 姬連雀', en: 'Witch Special Singing Form: Hime-renjaku', ja: '魔女特殊歌唱用形態 姫連雀' },
    desc: { zh: '轻盈的连雀之羽——游走的低语。<br>移动速度 +12%、拾取范围 +20%、经验 +8%，攻击 -5%。', en: 'The light plumage of the waxwing — a wandering whisper.<br>Move speed +12%, pickup +20%, XP +8%, Atk -5%.', ja: '軽やかな連雀の羽——遊走の囁き。<br>移動速度 +12%、取得 +20%、経験 +8%、攻撃 -5%。' },
    mods: { speed: 1.12, pickup: 1.2, xp: 1.08, dmg: 0.95 },
    color: '#8affc9', color2: '#0f6b52',
    /* v0.18.1 出处更正（人类 2026-10-21）：姬連雀 并非本作自创，而是
     * **V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」（2026-02-28）公布**的形态名。
     * 与 花魁鳥（2021 不可解弐Q2／V.W.P 1st「現象」Revolutions）同属
     * 「魔女特殊歌唱用形態」这条五人共用线，故并入 vwp_shared。 */
    src: { zh: '形态名＝官方（V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」公布）；服装设计＝本作', en: 'Form name: official (unveiled at V.W.P 4th ONE-MAN LIVE "Phenomenon IV -Hanten Unmei-"); costume design: this work', ja: '形態名＝公式（V.W.P 4th ONE-MAN LIVE「現象Ⅳ-反転運命-」で発表）。衣装デザイン＝本作' },
  },
  /* ---- 全形态清单（v0.13.5：把采集稿里**有名有姓**的形态全部做出来） ------------------
   * 写法：**系列承载共同字段**（说明/配色/轮廓配件/出处），这里一条形态只写自己的差异，
   *   载入后由 KUP.FORMS 之后那段补齐 label/desc/accent/color/mods/src —— 加形态＝加一行。
   * 数值策略（人类 2026-10-17「参数可以适当少调一些」）：**只有覚醒／戦闘形態带数值**
   *   （五人的覚醒名 ＋ 共用的花魁鳥系／八咫烏），其余形态**纯外观**。
   * ⚠️ 人类 2026-10-17 的两条取舍：① **花魁鳥・八咫烏算共用**（只列一次，五位都能穿）；
   *   ② **仅用数字或括号区分的变体不做** —— 故跳过：燕(壊)／燕(想)／軍鶏(想)／雉(怪)／
   *   花魁鳥（戒）／八咫烏（解）／梟（巡）／AnemoneⅡ／NemophiraⅡ／「parallel canvasⅡ」衣装。
   * ⚠️ 采集稿标「名称不明」的按原样写「名称不明」，**不替它取名**。 */
  /* 花譜（化歩）：官方 WORDS 全表 ＋ 2025-2026 新衣装 梟／梟黒 */
  { id: 'hinadori', series: 'kaf_singing', name: { zh: '雏鸟', en: 'Hinadori', ja: '雛鳥（ひなどり）' }, accent: 'sparrow_wing', color: '#7fe0c0' },
  // 2026-10-21 人类要求「注释掉雏鸟黑」——本批不上线（内容一字未删，恢复只需去掉 //）
  // { id: 'hinadori_kuro', series: 'kaf_singing', name: { zh: '雏鸟黑', en: 'Hinadori Kuro', ja: '雛鳥黑（ひなどり くろ）' }, accent: 'sparrow_wing', color: '#4a4a63' },
  { id: 'hoshigarasu', series: 'kaf_singing', name: { zh: '星鸦', en: 'Hoshigarasu', ja: '星鴉（ほしがらす）' } },
  { id: 'ruribitaki', series: 'kaf_singing', name: { zh: '琉璃鹟', en: 'Ruribitaki', ja: '瑠璃鶲（るりびたき）' }, color: '#5ec8d8' },
  {
    id: 'aogara', series: 'kaf_singing', name: { zh: '青雀', en: 'Aogara · Blue Sparrow', ja: '青雀（あおがら）' },
    accent: 'sparrow_wing', color: '#5ad0ff',
    note: {
      zh: '化歩的觉醒形态——蓝青羽织配背上的青雀翼羽，袖口一线白。<br>攻击 <b>+10%</b>、范围 <b>+6%</b>，最大生命 <b>−5%</b>。',
      en: 'Kafu\'s awakened form — a deep-blue haori with sparrow wing feathers at the back and a white cuff line.<br>Atk <b>+10%</b>, area <b>+6%</b>, max HP <b>−5%</b>.',
      ja: '化歩の覚醒形態——藍青の羽織に背の青雀の翼羽、袖口に白の一線。<br>攻撃 <b>+10%</b>、範囲 <b>+6%</b>、最大生命 <b>−5%</b>。',
    },
    mods: { playerDmg: 1.10, area: 1.06, hp: 0.95 },
  },
  { id: 'hayabusa', series: 'kaf_singing', name: { zh: '隼', en: 'Hayabusa', ja: '隼（はやぶさ）' }, accent: 'bird_tail', color: '#cfe8ff' },
  {
    id: 'kanaria', series: 'kaf_singing', name: { zh: '金丝雀', en: 'Kanaria', ja: '金糸雀（かなりあ）' }, color: '#ffd98a',
    note: {
      zh: '衣装颜色可在**黄绿↔藏青**之间转换（官方记载）。',
      en: 'The costume shifts between **chartreuse and navy** (per official records).',
      ja: '衣装の色は**黄緑↔蔵青**の間で変化する（公式の記載）。',
    },
  },
  // { id: 'aogara_kuro', series: 'kaf_singing', name: { zh: '青雀黑', en: 'Aogara Kuro', ja: '青雀黑（あおがら くろ）' }, accent: 'sparrow_wing', color: '#2f4f6f' },
  // { id: 'kinkei', series: 'kaf_singing', name: { zh: '金鸡', en: 'Kinkei', ja: '金鶏（きんけい）' }, color: '#ffb25a' },
  { id: 'tsubame', series: 'kaf_singing', name: { zh: '燕', en: 'Tsubame', ja: '燕（つばめ）' }, accent: 'bird_tail', color: '#8fb8ff' },
  // { id: 'shamo', series: 'kaf_singing', name: { zh: '军鸡', en: 'Shamo', ja: '軍鶏（しゃも）' }, color: '#e04a3f' },
  { id: 'kiji', series: 'kaf_singing', name: { zh: '雉', en: 'Kiji', ja: '雉（きじ）' }, accent: 'bird_tail', color: '#ff8a4e' },
  { id: 'raichou', series: 'kaf_singing', name: { zh: '雷鸟', en: 'Raichō', ja: '雷鳥（らいちょう）' }, color: '#e8ecf6' },
  { id: 'saichou', series: 'kaf_singing', name: { zh: '犀鸟', en: 'Saichō', ja: '犀鳥（さいちょう）' }, color: '#c9a6ff' },
  // { id: 'ougibato', series: 'kaf_singing', name: { zh: '扇鸠', en: 'Ōgibato', ja: '扇鳩（おうぎばと）' }, color: '#ffd98a' },
  {
    id: 'fukurou', series: 'kaf_singing', name: { zh: '枭', en: 'Fukurō', ja: '梟（ふくろう）' }, color: '#b58cff',
    note: {
      zh: '官方商品页称其为「花譜の**最新衣装**」（2026-03 起）——兜帽造型另有衍生周边。',
      en: 'The official store calls this Kafu\'s **latest costume** (from 2026-03); its hood design spawned its own merchandise.',
      ja: '公式商品ページは「花譜の**最新衣装**」とする（2026-03 より）。フードデザインの派生グッズもある。',
    },
  },
  /* 理芽（狸眼）：Metamorphose 系列（官方「歴代衣装」商品名 ＋ UBIK 官方帖） */
  { id: 'nightwings', series: 'rim_meta', name: { zh: 'Nightwings', en: 'Nightwings', ja: '1st Metamorphose「Nightwings」' } },
  {
    id: 'childhoods_end', series: 'rim_meta', name: { zh: 'Childhood\'s End', en: "Childhood's End", ja: '「Childhood\'s End」' },
    accent: 'star_ring', color: '#e8ecf6',
    note: {
      zh: '又名「幼年期の終わり」——官方 VR 曲目表 `変身／幼年期の終わり`＝Rime\'s Awakening。拾取范围 <b>+25%</b>、经验 <b>+10%</b>、移动速度 <b>+5%</b>，最大生命 <b>−8%</b>。',
      en: 'Also known as 幼年期の終わり — the official VR tracklist maps it to Rime\'s Awakening.Pickup <b>+25%</b>, XP <b>+10%</b>, move speed <b>+5%</b>, max HP <b>−8%</b>.',
      ja: '別名「幼年期の終わり」——公式 VR 曲目表の `変身／幼年期の終わり`＝Rime\'s Awakening。取得 <b>+25%</b>、経験 <b>+10%</b>、移動速度 <b>+5%</b>、最大生命 <b>−8%</b>。',
    },
    mods: { pickup: 1.25, xp: 1.10, speed: 1.05, hp: 0.92 },
  },
  { id: 'cosmic_puppets', series: 'rim_meta', name: { zh: 'The Cosmic Puppets', en: 'The Cosmic Puppets', ja: '2nd Metamorphose「The Cosmic Puppets」' }, color: '#b9c2d9' },
  { id: 'crack_in_space', series: 'rim_meta', name: { zh: 'The Crack in Space', en: 'The Crack in Space', ja: '3rd Metamorphose「The Crack in Space」' }, color: '#d6c8ff' },
  { id: 'counter_clock', series: 'rim_meta', name: { zh: 'Counter-Clock World', en: 'Counter-Clock World', ja: 'Special Metamorphose「Counter-Clock World」' }, accent: 'star_ring', color: '#cfe0ff' },
  {
    id: 'dr_futurity', series: 'rim_meta', name: { zh: 'Dr.Futurity', en: 'Dr.Futurity', ja: '4th Metamorphose「Dr.Futurity」' }, color: '#cfd8e8',
    note: {
      // ——**非公式 wiki 与官方 WORDS 都还没有**（2026-09 商品页才点名）
      zh: '官方「歴代衣装」商品系列的第 4 件。',
      en: 'The 4th entry in the official "successive costumes" goods line.',
      ja: '公式「歴代衣装」商品シリーズの 4 件目',
    },
  },
  {
    id: 'ubik', series: 'rim_meta', name: { zh: 'UBIK', en: 'UBIK', ja: 'UBIK' }, accent: 'star_ring', color: '#f2f0ff',
    note: {
      zh: '官方一手发布（理芽官方 YouTube 社区帖）：「理芽の新衣装「UBIK」が公開されました。」；官方商品页作 **4th ONE-MAN LIVE「NEUROMANCE Ⅳ」新衣装**。',
      en: 'Announced first-hand (Rime\'s official YouTube community post): "理芽の新衣装「UBIK」が公開されました。"; the official store lists it as the **4th ONE-MAN LIVE "NEUROMANCE Ⅳ"** costume.',
      ja: '公式の一次発信（理芽 公式 YouTube コミュニティ投稿）：「理芽の新衣装「UBIK」が公開されました。」。公式商品ページでは **4th ONE-MAN LIVE「NEUROMANCE Ⅳ」新衣装**。',
    },
  },
  /* 春猿火（派流）：纏 系列 ＋ 2025-2026 新衣装 銀兜／金兜 */
  { id: 'matoi_tanchou', series: 'haru_matoi', name: { zh: '纏 其ノ壱 -丹頂-', en: 'Matōi I · Tanchō', ja: '纏 其ノ壱 -丹頂-（たんちょう）' } },
  { id: 'matoi_asagi', series: 'haru_matoi', name: { zh: '纏 其ノ弐 -浅黄-', en: 'Matōi II · Asagi', ja: '纏 其ノ弐 -浅黄-（あさぎ）' }, color: '#5ec8d8' },
  {
    id: 'kumonryu', series: 'haru_matoi', name: { zh: '纏 其ノ特 -九紋龍-', en: 'Matōi · Kumonryū', ja: '纏 其ノ特 -九紋龍-（くもんりゅう）' },
    note: {
      zh: '派流的觉醒形态——黑地的长着「纏」束以红金龙纹之带，肩头一片鲤鳞。<br>最大生命 <b>+15%</b>、范围 <b>+8%</b>，移动速度 <b>−5%</b>。',
      en: 'Haru\'s awakened form — a black "matōi" robe tied with a crimson-and-gold dragon sash, koi scales at the shoulder.<br>Max HP <b>+15%</b>, area <b>+8%</b>, move speed <b>−5%</b>.',
      ja: '派流の覚醒形態——黒地の「纏」に紅金の龍紋帯、肩に鯉の鱗。<br>最大生命 <b>+15%</b>、範囲 <b>+8%</b>、移動速度 <b>−5%</b>。',
    },
    mods: { hp: 1.15, area: 1.08, speed: 0.95 },
  },
  { id: 'matoi_ochiba', series: 'haru_matoi', name: { zh: '纏 其ノ参 -落葉-', en: 'Matōi III · Ochiba', ja: '纏 其ノ参 -落葉-（おちば）' }, accent: 'koi_scales' },
  { id: 'matoi_showa', series: 'haru_matoi', name: { zh: '纏 其ノ肆 -昭和三色-', en: 'Matōi IV · Shōwa Sanshoku', ja: '纏 其ノ肆 -昭和三色-（しょうわさんしょく）' }, accent: 'koi_scales', color: '#f2c14e' },
  { id: 'matoi_goshiki', series: 'haru_matoi', name: { zh: '纏 其ノ特 -五色-', en: 'Matōi · Goshiki', ja: '纏 其ノ特 -五色-（ごしき）' }, color: '#e04a3f' },
  {
    id: 'ginkabuto', series: 'haru_matoi', name: { zh: '银兜', en: 'Ginkabuto', ja: '銀兜（ぎんかぶと）' }, accent: 'koi_scales', color: '#cfe0ff',
    note: {
      zh: '2025–2026 的新衣装——官方商品页原文「春猿火の**衣装「銀兜」**」（另有同系列「金兜」）。',
      en: 'A 2025–2026 costume — the official store\'s wording is "Haru\'s **costume 銀兜**" (with 金兜 as its sibling).',
      ja: '2025–2026 の新衣装——公式商品ページ原文「春猿火の**衣装「銀兜」**」（同系列に「金兜」）。',
    },
  },
  { id: 'kinakabuto', series: 'haru_matoi', name: { zh: '金兜', en: 'Kinakabuto', ja: '金兜（きんかぶと）' }, accent: 'koi_scales', color: '#ffd98a' },
  /* ヰ世界情緒（世界）：普遍体・変異体（花名） */
  { id: 'anemone_1', series: 'sekai_anima', name: { zh: '普遍体 AnemoneⅠ', en: 'Universal Anemone I', ja: '普遍体 AnemoneⅠ' }, color: '#efe0ff' },
  { id: 'nemophira_1', series: 'sekai_anima', name: { zh: '普遍体 NemophiraⅠ', en: 'Universal Nemophira I', ja: '普遍体 NemophiraⅠ' }, accent: 'flower_veil', color: '#9f7ad6' },
  {
    id: 'heliotrope', series: 'sekai_anima', name: { zh: '変異体 Heliotrope', en: 'Variant Heliotrope', ja: '変異体：Heliotrope（ヘリオトロープ）' },
    note: {
      zh: '世界的觉醒形态——淡紫的汉宁帽缀一圈天芥菜花冠，胸前一枚花饰。<br>冷却 <b>−10%</b>、范围 <b>+8%</b>，最大生命 <b>−5%</b>。',
      en: 'Sekai\'s awakened form — a pale violet hennin crowned with heliotrope blossoms, a single flower at the breast.<br>Cooldown <b>−10%</b>, area <b>+8%</b>, max HP <b>−5%</b>.',
      ja: '世界の覚醒形態——淡紫のヘニン帽にヘリオトロープの花冠、胸元に花飾り。<br>クールタイム <b>−10%</b>、範囲 <b>+8%</b>、最大生命 <b>−5%</b>。',
    },
    mods: { cd: 0.90, area: 1.08, hp: 0.95 },
  },
  { id: 'calla_lily', series: 'sekai_anima', name: { zh: '変異体 Calla lily', en: 'Variant Calla Lily', ja: '変異体：Calla lily（カラーリリー）' }, color: '#f6f1ff' },
  {
    id: 'pc_1', series: 'sekai_anima', name: { zh: '「parallel canvas」衣装', en: '"parallel canvas" costume', ja: '「parallel canvas」での衣装' },
    accent: 'flower_veil', color: '#b9c2d9',
    note: {
      zh: '采集稿在此项标注「**名称不明**」——本作**不替它取名**，只按原样保留「是哪场演出的衣装」。',
      en: 'The source marks this one "**name unknown**" — we do not invent a name, only record which show it appeared in.',
      ja: '出典はこの項目に「**名称不明**」と明記——本作は名前を**作らない**。どの公演の衣装かだけを残す。',
    },
  },
  /* 幸祜（此処）：type- 系列（恒星名） */
  { id: 'bellatrix', series: 'koko_type', name: { zh: 'type-1st Bellatrix', en: 'type-1st Bellatrix', ja: 'type-1st Bellatrix' }, color: '#cfe8ff' },
  {
    id: 'alnair', series: 'koko_type', name: { zh: 'type-real Alnair', en: 'type-real Alnair', ja: 'type-real Alnair（アルナイル）' },
    note: {
      zh: '此処的觉醒形态——蓝白星光外套配星冕，衣摆拖出一道星屑。<br>移动速度 <b>+12%</b>、攻击 <b>+6%</b>，冷却 <b>+4%</b>。',
      en: 'Koko\'s awakened form — a blue-white starlight coat with a star tiara, a trail of stardust at the hem.<br>Move speed <b>+12%</b>, Atk <b>+6%</b>, cooldown <b>+4%</b>.',
      ja: '此処の覚醒形態——藍白のスターライトコートに星のティアラ、裾に星屑の尾。<br>移動速度 <b>+12%</b>、攻撃 <b>+6%</b>、クールタイム <b>+4%</b>。',
    },
    mods: { speed: 1.12, playerDmg: 1.06, cd: 1.04 },
  },
  { id: 'zeta_capricorni', series: 'koko_type', name: { zh: 'type-2nd ζ Capricorni', en: 'type-2nd ζ Capricorni', ja: 'type-2nd ζ Capricorni' }, accent: 'star_orbit', color: '#7fb6ff' },
  { id: 'betelgeuse', series: 'koko_type', name: { zh: 'type-real Betelgeuse', en: 'type-real Betelgeuse', ja: 'type-real Betelgeuse' }, accent: 'star_orbit', color: '#ff9f8a' },
  // /* 五人共用（人类 2026-10-17：花魁鳥・八咫烏算共用） */
  // {
  //   id: 'ouranchou_rev', series: 'vwp_shared', name: { zh: '花魁鳥 Revolutions', en: 'Oiran-chō Revolutions', ja: '花魁鳥 Revolutions（えとぴりか れぼりゅーしょんず）' },
  //   note: {
  //     zh: '五人共用的战斗形态（2022 V.W.P 1st ONE-MAN LIVE「現象」）——花魁鳥的强化版。<br>范围 <b>+18%</b>、冷却 <b>−10%</b>，最大生命 <b>−12%</b>。',
  //     en: 'The shared battle form (2022 V.W.P 1st ONE-MAN LIVE "現象") — a reinforced Oiran-chō.<br>Area <b>+18%</b>, cooldown <b>−10%</b>, max HP <b>−12%</b>.',
  //     ja: '五人共用の戦闘形態（2022 V.W.P 1st ONE-MAN LIVE「現象」）——花魁鳥の強化版。<br>範囲 <b>+18%</b>、クールタイム <b>−10%</b>、最大生命 <b>−12%</b>。',
  //   },
  //   mods: { area: 1.18, cd: 0.90, hp: 0.88 },
  // },
  {
    id: 'yatagarasu', series: 'vwp_shared', name: { zh: '八咫烏', en: 'Yatagarasu', ja: '八咫烏（やたがらす）' }, accent: 'crest', color: '#d94fb0',
    note: {
      zh: '五人共用的形态（2024「現象Ⅱ -魔女拡成-」，官方商品为五人各出一件）。<br>攻击 <b>+8%</b>、范围 <b>+10%</b>，最大生命 <b>−8%</b>。',
      en: 'The shared form from 2024\'s "現象Ⅱ -魔女拡成-" (official goods list one per member).<br>Atk <b>+8%</b>, area <b>+10%</b>, max HP <b>−8%</b>.',
      ja: '五人共用の形態（2024「現象Ⅱ -魔女拡成-」。公式商品は五人分が各一件）。<br>攻撃 <b>+8%</b>、範囲 <b>+10%</b>、最大生命 <b>−8%</b>。',
    },
    mods: { playerDmg: 1.08, area: 1.10, hp: 0.92 },
  },
  /* ---- 可招募角色（魔女候補）与同伴：皮肤暂定「黑」「白」 ---- */
  {
    id: 'kuro', kinds: ['recruit'], accent: 'veil',
    name: { zh: '黑', en: 'Black', ja: '黒' },
    label: { zh: '皮肤「黑」（暂定）', en: 'Skin "Black" (tentative)', ja: '皮膚「黒」（暫定）' },
    desc: { zh: '夜之装束——歌声更加锐利。<br>攻击 +6%。', en: 'Night vestment — a sharper song.<br>Atk +6%.', ja: '夜の装い——歌はより鋭く。<br>攻撃 +6%。' },
    mods: { playerDmg: 1.06 },
    color: '#4a4a63', color2: '#12121c',
    src: { zh: '本作暂定皮肤（黑／白）', en: 'Tentative skin (Black/White) original to this work', ja: '本作の暫定皮膚（黒／白）' },
  },
  {
    id: 'shiro', kinds: ['recruit'], accent: 'halo',
    name: { zh: '白', en: 'White', ja: '白' },
    label: { zh: '皮肤「白」（暂定）', en: 'Skin "White" (tentative)', ja: '皮膚「白」（暫定）' },
    desc: { zh: '昼之装束——歌声更易牵引フラグメント。<br>拾取范围 +15%。', en: 'Day vestment — a song that gathers fragments.<br>Pickup +15%.', ja: '昼の装い——歌がフラグメントを引き寄せる。<br>取得 +15%。' },
    mods: { pickup: 1.15 },
    color: '#f2f0ff', color2: '#a9b6d8',
    src: { zh: '本作暂定皮肤（黑／白）', en: 'Tentative skin (Black/White) original to this work', ja: '本作の暫定皮膚（黒／白）' },
  },
  // /* ---- 同伴（彩季詩得）：JK 制服（2026-10 改定；后续每位同伴分别定制） ---- */
  // {
  //   id: 'jk_summer', kinds: ['companion'], accent: 'sailor',
  //   name: { zh: 'JK制服・夏服', en: 'JK Uniform · Summer', ja: 'JK制服・夏服' },
  //   label: { zh: 'JK制服（夏服）—— 白襟水手服', en: 'JK uniform (summer) — white sailor collar', ja: 'JK制服（夏服）——白襟セーラー' },
  //   desc: {
  //     zh: '復興課的夏季制服——白襟水手服。<br>拾取范围 <b>+10%</b>、移动速度 <b>+5%</b>。',
  //     en: 'The Division\'s summer uniform — a white sailor collar.<br>Pickup <b>+10%</b>, move speed <b>+5%</b>.',
  //     ja: '復興課の夏制服——白襟セーラー。<br>取得 <b>+10%</b>、移動速度 <b>+5%</b>。',
  //   },
  //   mods: { pickup: 1.1, speed: 1.05 },
  //   color: '#eaf4ff', color2: '#2f5fa8',
  //   src: { zh: '本作设定（JK 制服；后续每位同伴分别定制）', en: 'Original to this work (JK uniform; per-companion designs later)', ja: '本作設定（JK制服。後日、同行ごとに個別デザイン）' },
  // },
  // {
  //   id: 'jk_winter', kinds: ['companion'], accent: 'blazer',
  //   name: { zh: 'JK制服・冬服', en: 'JK Uniform · Winter', ja: 'JK制服・冬服' },
  //   label: { zh: 'JK制服（冬服）—— 深蓝西装外套', en: 'JK uniform (winter) — navy blazer', ja: 'JK制服（冬服）——紺ブレザー' },
  //   desc: {
  //     zh: '復興課的冬季制服——深蓝西装外套。<br>最大生命 <b>+6%</b>、全部冷却 <b>−3%</b>。',
  //     en: 'The Division\'s winter uniform — a navy blazer.<br>Max HP <b>+6%</b>, all cooldowns <b>−3%</b>.',
  //     ja: '復興課の冬制服——紺ブレザー。<br>最大生命 <b>+6%</b>、全クールダウン <b>−3%</b>。',
  //   },
  //   mods: { hp: 1.06, cd: 0.97 },
  //   color: '#f6f1e6', color2: '#1d2a52',
  //   src: { zh: '本作设定（JK 制服；后续每位同伴分别定制）', en: 'Original to this work (JK uniform; per-companion designs later)', ja: '本作設定（JK制服。後日、同行ごとに個別デザイン）' },
  // },
];
/* ---------- 形态系列 → 形态：补齐共同字段（v0.13.5） ----------
 * 形态只写自己的差异；label／系列说明／配色／轮廓配件／出处在这里从 KUP.FORM_SERIES 补齐。
 * 于是「加一条形态」＝在 KUP.FORMS 里加一行，不必重复写三语说明与出处。 */
(function () {
  const SER = {};
  for (const s of KUP.FORM_SERIES) SER[s.id] = s;
  const join = (a, b) => (b ? a + ' · ' + b : a);        // 三语字符串的拼接
  const tri = (f) => ({ zh: f('zh'), en: f('en'), ja: f('ja') });
  for (const f of KUP.FORMS) {
    const s = SER[f.series];
    if (!s) continue;
    if (!f.kinds) f.kinds = ['witch'];                   // 系列里的形态都是魔女之子的形态
    if (!f.char) f.char = s.char || null;
    if (!f.accent) f.accent = s.accent;
    if (!f.color) f.color = s.color;
    if (!f.color2) f.color2 = s.color2;
    if (!f.label) f.label = tri(k => join(s.name[k], f.name[k]));
    if (!f.desc) f.desc = tri(k => s.desc[k] + (f.note ? '<br>' + f.note[k] : ''));
    if (!f.mods) f.mods = s.mods || {};
    if (!f.src) f.src = s.src;
    f.seriesName = s.name;                               // 出击界面按系列分组时用
  }
})();
/* v0.18.2：**取消「通常形態」**（人类 2026-10-21）——每位魔女之子直接使用自己系列的
 * **第一件**形态（化歩＝雏鸟／狸眼＝Nightwings／派流＝纏 其ノ壱 -丹頂-／世界＝AnemoneⅠ／
 * 此処＝type-1st Bellatrix），魔女候補（亜留／阿栖）统一用**白**。
 * `KUP.NO_FORM` 只是**内部占位**（同伴层没有皮肤、以及旧存档里 form:'none' 的兼容），
 * **不会再出现在任何选择界面**，也不会被 `formsFor()` 返回。 */
KUP.NO_FORM = {
  id: 'none', accent: 'none', color: null, color2: null, mods: {},
  name: { zh: '無皮膚', en: 'No skin', ja: '皮膚なし' },
  label: { zh: '無皮膚', en: 'No skin', ja: '皮膚なし' },
  desc: { zh: '', en: '', ja: '' },
};
KUP.FORM = id => (id === 'none' ? KUP.NO_FORM : (KUP.FORMS.find(f => f.id === id) || null));
/* 角色的默认形态（v0.18.2）：魔女候補＝白；其余＝该角色系列的第一件形态 */
KUP.defaultForm = charId => {
  if (charId === 'aru' || charId === 'asu') return KUP.FORM('shiro');
  const own = KUP.FORMS.find(f => f.char === charId);
  return own || KUP.FORM('shiro') || KUP.FORMS[0];
};
/* 形态是否适用于某持有者（kinds 为 null ＝ 通用；char 为 null ＝ 不绑定具体角色）
 * kind: 'witch'（魔女之子）| 'recruit'（魔女候補）| 'companion'（同伴）
 * charId: 具体角色 id（可省）——带 `char` 的形态只属于该角色，换角色即不可用 */
KUP.formFits = (f, kind, charId) => {
  if (f.kinds && f.kinds.indexOf(kind) < 0) return false;
  if (f.char && f.char !== charId) return false;
  return true;
};
/* 按持有者取可用形态（含通用的「通常形態」） */
KUP.formsFor = (kind, charId) => KUP.FORMS.filter(f => KUP.formFits(f, kind, charId));
/* 某角色的专属形态（出击界面用它提示"这位魔女有专属觉醒形态"） */
KUP.formsOfChar = charId => KUP.FORMS.filter(f => f.char && f.char === charId);
/* 形态分组（v0.13.5 UI 用）：把某角色的可选形态按**系列**分组，顺序＝
 * 本命系列 → 共用/自创（无 char 的系列）→ 其它（无系列的形态，如魔女候補皮肤）。
 * 返回 [{ key, short, name, forms:[...] }]——出击界面用它做「系列按钮 + 只画一组卡片」，
 * 免得把 45+ 条形态一次铺成"一墙卡"（人类 2026-10-17 要求：不用进几次页面、也不用看一堆）。 */
KUP.formGroups = (kind, charId) => {
  const SER = {};
  for (const s of KUP.FORM_SERIES) SER[s.id] = s;
  const list = KUP.formsFor(kind, charId).filter(f => f.id !== 'none');   // 「通常形態」每组都画在第一格
  const rank = key => {
    const s = SER[key];
    if (!s) return 3;                            // 无系列（魔女候補／同伴皮肤）
    if (s.char && s.char === charId) return 0;   // 本命系列（该角色自己的）
    return s.char ? 2 : 1;                       // 共用/自创 → 其它角色的系列（正常不会出现）
  };
  const keys = [];
  for (const f of list) { const k = f.series || 'other'; if (keys.indexOf(k) < 0) keys.push(k); }
  keys.sort((a, b) => rank(a) - rank(b));
  return keys.map(k => {
    const s = SER[k];
    return {
      key: k,
      short: s ? s.short : null,
      name: s ? s.name : null,
      forms: list.filter(f => (f.series || 'other') === k),
    };
  });
};
/* 角色（含招募角色）对应的皮肤类型 */
KUP.charKind = c => (c && c.recruit) ? 'recruit' : 'witch';
