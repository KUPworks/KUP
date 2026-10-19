window.KUP = window.KUP || {};

/* ================= 数据表（三语；基于官方设定） =================
 * ★ 主角＝角色，不是声优：
 *   森先化歩（モリサキ カフ，声：花譜）／谷置狸眼（タニオキ リメ，声：理芽）／
 *   朝主派流（アサヌシ ハル，声：春猿火）／夜河世界（ヨルカワ セカイ，声：ヰ世界情緒）／
 *   輪廻此処（リンネ ココ，声：幸祜）
 *   ——「花譜」「理芽」等是声优名，游戏中只作为 CAST 标注出现（`cv` 字段）。
 * 出处：REGENERATE 官方页（番街分区／居住魔女之子／CAST 读音全表）【官方】、
 *       动画《神椿市建設中。》各话副标题与分集剧情、周边设定考据见 docs/lore/related-settings.md。
 * ★ 术语一律按 docs/lore/worldview.md §0.5「术语统一表」：
 *   zh 文案固定用 **破维魔／魔女之子／大黒寂／ヰ世界救済教団／麦克斯韦**；
 *   引用官方原文时才保留官方写法（テセラクター／魔女の娘…），且日文字段里才用日文原词。
 *   ⚠️ 出处等级（【官方】/【本作自创】…）只写在本注释与 `src` 数据字段里，
 *      **不再在界面上显示**（见 ui.js 里被注释掉的出处行）。
 *  - 敌人官方称呼：テセラクター／官方中文＝**破维魔**（动画官网文案：「人の悪意と欲望から生まれる怪物」）。
 *    ★ 更底层（动画后四集，2026-10 采用）：破维魔＝人类的**恐惧与欲望被麦克斯韦具象化的产物**；
 *      但**麦克斯韦在本作不做 Boss 实体、不具名登场**（lore §11 行 21／行 30、DESIGN §6.5）。
 *  - 「歌は、魔法——」歌即魔法；世界观侧五人官方称「**魔女の娘**」／官方英译 Witchlings（本作中文固定「魔女之子」）。
 *    「**電脳の魔女達**」是 **V.W.P（现实侧组合）** 的官方用语，不是世界观内对五人的称呼。
 *  - 育成系谱：系谱曲（カンザキイオリ）／派生曲／拡声曲 → 用作被动强化命名
 *  - 武器以乐曲命名（わたしの声／食虫植物／テラ／the last bullet／キミ消失セカイ）
 *  - 招募同伴（魔女候補）：天祢亜留（声：存流）／地邑阿栖（声：明透）——ヰ世界救済教団
 *    ⚠️ 存流／明透 本人出身于平级企划「深脊界」，**不并入本作世界观**；本作只取 REGENERATE
 *       官方页给出的**神椿市侧既存化身**（天祢亜留／地邑阿栖／彩季詩得）——lore §15.6。
 *  - 皮肤：「（魔女）特殊歌唱用形態 ○○」为官方命名法（花魁鳥／姬連雀）；魔女候補侧暂定「黑」「白」
 *  - 眷魔（ファミリア）：官方中文对译＝**眷魔**；★ **全体都是「破维魔盟友」**——
 *    与对应魔女可能有摩擦矛盾，**不存在完全敌对**；且**并非人人一开始就有**（小说里狸眼当时「没有眷魔」）。
 *    因此本作**不做「先打后收服」的转化叙事**（lore §11 行 22／行 33、§4.2）。
 * 文本字段均为 {zh,en,ja} 三语对象，由 KUP.I18N.tv() 按语言取值。
 * 注：形象色为社区惯用印象色（官方未公开色值）；非官方同人致敬作品。
 */

/* ---------- 可操控主角：魔女之子五人（V.W.P＝其现实侧声优组合） ---------- */
KUP.CHARS = [
  {
    id: 'kaf',
    name: '森先 化歩', short: '化歩', nameEn: 'Kafu Morisaki', reading: 'モリサキ カフ', romaji: 'MORISAKI KAFU',
    cv: '花譜', cvEn: 'KAF',
    area: 'area0',
    color: '#ff6fb5', color2: '#1f3a5f',
    weapon: 'note',
    desc: {
      zh: '零番街（下町）的高中一年生。大黒寂中失去双亲，由姐姐<b>観統衿架</b>抚养长大；七年后被卷入「Q」并遇见らぷらす。<br>持有「能再生毁灭世界的歌声」，开朗活泼——既均衡又标准（攻击 ×1.15）。<br><span class="cv-note">声 — 花譜</span>',
      en: 'A first-year high schooler of Area 0 (Downtown). She lost both parents in the Great Silence and was raised by her elder sister, <b>Erika Midoh</b>; seven years later she is caught in a "Q" and meets Laplace.<br>She carries "the song that can regenerate a ruined world" — bright and lively, the balanced standard witchling (Atk ×1.15).<br><span class="cv-note">CV — KAF</span>',
      ja: '零番街（下町）の高校一年生。大黒寂で両親を失い、姉<b>観統衿架</b>に育てられた。七年後、街の「Q」に巻き込まれ、らぷらすと出会う。<br>「滅びた世界を再生させる歌声」を持つ、明快元気な均衡型の魔女の娘（攻撃 ×1.15）。<br><span class="cv-note">声 — 花譜</span>',
    },
    stats: { hp: 100, speed: 150, dmg: 1.15, cd: 1.0, area: 1.0, xp: 1.0 },
  },
  {
    id: 'rim',
    name: '谷置 狸眼', short: '狸眼', nameEn: 'Rime Tanioki', reading: 'タニオキ リメ', romaji: 'TANIOKI RIME',
    cv: '理芽', cvEn: 'RIM',
    area: 'area1',
    color: '#3e78d6', color2: '#c0392b',
    weapon: 'orbit',
    desc: {
      zh: '壱番街（オフィス地区）的高中三年生，谷置家之女。理知可靠、聪慧努力，学习运动歌唱家境几乎完美，唯一的瑕疵是<b>内心的脆弱</b>，偶因它受伤。<br>「食虫植物」般的音球环绕捕食——拾取 ×1.5、经验 ×1.25，脆皮。<br><span class="cv-note">声 — 理芽</span>',
      en: 'A third-year of Area 1 (Office District) and daughter of the Tanioki family. Reliable and studious — almost perfect in school, sport, song and means — her one flaw is a <b>fragile heart</b>, which sometimes wounds her.<br>Carnivorous orbs orbit and devour: Pickup ×1.5, XP ×1.25, fragile.<br><span class="cv-note">CV — RIM</span>',
      ja: '壱番街（オフィス地区）の高校三年生、谷置家の娘。理知的で努力家、学業も運動も歌も家柄もほぼ完璧——唯一の瑕は<b>心の弱さ</b>で、時にそれに傷つく。<br>楽曲「食虫植物」の如く音球が敵を捕食——取得 ×1.5、経験 ×1.25、紙耐久。<br><span class="cv-note">声 — 理芽</span>',
    },
    stats: { hp: 85, speed: 150, dmg: 1.0, cd: 1.0, area: 1.0, xp: 1.25, pickup: 1.5 },
  },
  {
    id: 'harusaruhi',
    name: '朝主 派流', short: '派流', nameEn: 'Haru Asanushi', reading: 'アサヌシ ハル', romaji: 'ASANUSHI HARU',
    cv: '春猿火', cvEn: 'Harusaruhi',
    area: 'area2',
    color: '#e03a2f', color2: '#2e9bb6',
    weapon: 'bass',
    desc: {
      zh: '弐番街（歓楽街）的高中二年生，率领不良少年团／黑帮「<b>台風眼</b>」。以歌为支撑坚韧地活；感情丰富、情义深厚，原本内向易受伤，为面对严苛社会而逞强。<br>「テラ」震颤大地的低音冲击波——HP ×1.35、范围 ×1.2，重装。<br><span class="cv-note">声 — 春猿火</span>',
      en: 'A second-year of Area 2 (Entertainment District) who leads the gang "Taifūgan". She lives stubbornly, propped up by song; rich in feeling and loyalty, once timid and easily hurt, now putting on a brave face for a harsh world.<br>"Terra" — a bass shockwave that quakes the earth: HP ×1.35, Area ×1.2, tanky.<br><span class="cv-note">CV — HARUSARUHI</span>',
      ja: '弐番街（歓楽街）の高校二年生。不良集団／組織「<b>台風眼</b>」を率いる。歌を支えに生き、感情豊かで情に厚い。元は内向的で傷つきやすかった。<br>「テラ」が大地を震わせる低音衝撃波——HP ×1.35、範囲 ×1.2、重装。<br><span class="cv-note">声 — 春猿火</span>',
    },
    stats: { hp: 135, speed: 135, dmg: 1.05, cd: 1.1, area: 1.2, xp: 1.0 },
  },
  {
    id: 'isekaijoucho',
    name: '夜河 世界', short: '世界', nameEn: 'Sekai Yorukawa', reading: 'ヨルカワ セカイ', romaji: 'YORUKAWA SEKAI',
    cv: 'ヰ世界情緒', cvEn: 'Isekaijoucho',
    area: 'area3',
    color: '#ede6da', color2: '#2038c0',
    weapon: 'laser',
    desc: {
      zh: '参番街（农园区）出身，天生拥有<b>预知未来</b>之力、意志坚定。被参番街的崇巫教团「<b>ヰ世界救済教団</b>」奉为<b>活神</b>，教団是她必须回去救援的地方。<br>描摹「キミ消失セカイ」的贯穿光束——冷却 ×0.85、攻击 ×1.05。<br><span class="cv-note">声 — ヰ世界情緒</span>',
      en: 'From Area 3 (Agricultural Area), born with the power to <b>foresee the future</b> and an unshakable will. The witch-worshipping "Isekai Salvation Cult" reveres her as a <b>living deity</b> — the cult is the home she must return to save.<br>A piercing beam tracing "Kimi Shometsu Sekai": Cooldown ×0.85, Atk ×1.05.<br><span class="cv-note">CV — ISEKAI JOUCHO</span>',
      ja: '参番街（農園地区）出身。生まれながら<b>未来を予知</b>する力を持ち、意志は揺るがない。魔女崇拝教団「<b>ヰ世界救済教団</b>」に<b>生き神</b>として奉られる。<br>「キミ消失セカイ」をなぞる貫通光束——クールタイム ×0.85、攻撃 ×1.05。<br><span class="cv-note">声 — ヰ世界情緒</span>',
    },
    stats: { hp: 90, speed: 150, dmg: 1.05, cd: 0.85, area: 1.1, xp: 1.0 },
  },
  {
    id: 'koko',
    name: '輪廻 此処', short: '此処', nameEn: 'Koko Rinne', reading: 'リンネ ココ', romaji: 'RINNE KOKO',
    cv: '幸祜', cvEn: 'KOKO',
    area: 'area4',
    color: '#b06bff', color2: '#5a1fc0',
    weapon: 'lance',
    desc: {
      zh: '肆番街（科学研究特区）出身，復興課侧。因某些缘由<b>失去了过去的记忆</b>；凛然有大人样，又有天然冒失的一面。<br>「the last bullet」贯穿敌列的音枪——攻击 ×1.25，连射稍迟。<br><span class="cv-note">声 — 幸祜</span>',
      en: 'From Area 4 (Science Research Zone), aligned with the Reconstruction Division. She <b>lost her past memories</b> for reasons unknown; dignified and grown-up, with an endearing klutzy side.<br>"The Last Bullet" pierces enemy lines: Atk ×1.25, slightly slower fire.<br><span class="cv-note">CV — KOKO</span>',
      ja: '肆番街（科学研究特区）出身、復興課側。ある事情により<b>過去の記憶を失っている</b>。凛然とした大人の雰囲気、だが天然。<br>「the last bullet」が敵列を貫く音の銃撃——攻撃 ×1.25、連射やや遅。<br><span class="cv-note">声 — 幸祜</span>',
    },
    stats: { hp: 95, speed: 145, dmg: 1.25, cd: 1.15, area: 1.0, xp: 1.0 },
  },
  /* ===== 可招募的：魔女候補（ヰ世界救済教団）=====
   * ★ 阶位低于魔女之子（魔女候補 → 魔女的资质者 → 魔女之子 → 覚醒），
   *   因此作为「招募式追加可操作角色」层——需满足条件后才能在选人界面选用。
   * 「存流／明透」是其（现实侧艺人），不是角色名。
   * 皮肤：与魔女之子不同，魔女候補使用暂定皮肤「黑」「白」（KUP.FORMS kind='recruit'）。 */
  {
    id: 'aru',
    recruit: true,
    name: '天祢 亜留', short: '亜留', nameEn: 'Aru Amane', reading: 'アマネ アル', romaji: 'AMANE ARU',
    cv: '存流', cvEn: 'ARU',
    area: 'area3',
    color: '#8fa8ff', color2: '#2a3a8f',
    weapon: 'prayer',
    desc: {
      zh: '参番街「ヰ世界救済教団」的教徒，被列为<b>魔女候補</b>——阶位低于魔女之子，却已能歌唱。<br>以祈祷为武器：「救済の鐘」化作震颤的钟声冲击环。HP ×1.1、范围 ×1.1。<br><span class="cv-note">声 — 存流</span>',
      en: 'A member of the Isekai Salvation Cult in Area 3, ranked a <b>witch candidate</b> — below the witchlings, yet already able to sing.<br>Her weapon is prayer: "Bell of Salvation" rings out as a quaking shockwave. HP ×1.1, Area ×1.1.<br><span class="cv-note">CV — aru</span>',
      ja: '参番街「ヰ世界救済教団」の教徒にして<b>魔女候補</b>——魔女の娘より下の階位だが、すでに歌える。<br>祈りを武器に、「救済の鐘」が衝撃環となって響く。HP ×1.1、範囲 ×1.1。<br><span class="cv-note">声 — 存流</span>',
    },
    stats: { hp: 110, speed: 142, dmg: 1.05, cd: 1.0, area: 1.1, xp: 1.05 },
    /* 招募条件：通关参番街（教団的据点）＋ 1 张市民票（v0.16：票由现金兑换，一张即可） */
    unlock: { area: 'area3', cost: 1, desc: { zh: '通关参番街后加入', en: 'Joins after clearing Area 3', ja: '参番街クリアで加入' } },
  },
  {
    id: 'asu',
    recruit: true,
    name: '地邑 阿栖', short: '阿栖', nameEn: 'Asu Chimura', reading: 'チムラ アス', romaji: 'CHIMURA ASU',
    cv: '明透', cvEn: 'ASU',
    area: 'area3',
    color: '#c47f00', color2: '#005110',
    weapon: 'follow',
    desc: {
      zh: '教团教徒、<b>亜留的妹妹般的存在</b>，同为魔女候補。<br>追随的歌声化作「追唱の矢」——贯穿敌列的连射。拾取 ×1.3、攻击 ×1.1。<br><span class="cv-note">声 — 明透</span>',
      en: 'A member of the cult and <b>a younger-sister figure to Aru</b>, likewise a witch candidate.<br>Her following song becomes "Arrows of the Refrain" — piercing volleys. Pickup ×1.3, Atk ×1.1.<br><span class="cv-note">CV — asu</span>',
      ja: '教団の教徒で<b>亜留の妹分</b>、同じく魔女候補。<br>追従の歌が「追唱の矢」となり敵列を貫く。取得 ×1.3、攻撃 ×1.1。<br><span class="cv-note">声 — 明透</span>',
    },
    stats: { hp: 95, speed: 152, dmg: 1.1, cd: 0.95, area: 1.0, xp: 1.1, pickup: 1.3 },
    /* 招募条件：復興率 55% ＋ 1 张市民票（v0.16） */
    unlock: { fukkou: 55, cost: 1, desc: { zh: '復興率达到 55% 后加入', en: 'Joins at 55% restoration', ja: '復興率 55% で加入' } },
  },
];
/* 可操作角色（含招募角色）查询 */
KUP.CHAR = id => KUP.CHARS.find(c => c.id === id) || KUP.CHARS[0];
KUP.charUnlockText = c => (c.unlock && c.unlock.desc) || null;

/* ---------- ★ 语言相关的显示名／CAST（2026-10 新增） ----------
 * 背景：角色名在数据里是**日文汉字**（`name: '森先 化歩'`），对 zh/ja 界面直接用没问题；
 * 但英文界面若照抄汉字，就成了「英文 UI 里夹汉字」。
 * ★ 官方英文（srd VIRTUAL REALITY EN 页，见 docs/lore/research/official_srd_en_cn.md）用的是
 *   **Given + Family** 的罗马字：`Kafu Morisaki` / `Rime Tanioki` / … / `Ciel Saiki`，
 *   CAST 写作 `KAF`／`RIM`／`Harusaruhi`／`Isekaijoucho`／`KOKO`／`ARU`／`ASU`／`CIEL`。
 * ⇒ 英文界面走 `nameEn`／`cvEn`，**zh/ja 界面仍用日文汉字名**（本作既定方针，与官方中文的简体写法不同）。
 * ⚠️ **不要**把这套用在**存档里持久化的字段**上（如 `run.witch`＝结算记录里的角色名）——
 *   存档若存语言相关字符串，切语言后会串味。故 `game.js` 的 `st.witch` 仍用日文名。 */
KUP.nameOf = c => (!c ? '' : (KUP.I18N.lang === 'en' && c.nameEn ? c.nameEn : c.name));
/* 英文取 `nameEn` 的第一个词（`Kafu Morisaki` → `Kafu`）作短名 */
KUP.shortOf = c => (!c ? '' : (KUP.I18N.lang === 'en' && c.nameEn
  ? c.nameEn.split(' ')[0] : (c.short || c.name)));
KUP.cvOf = c => (!c ? '' : (KUP.I18N.lang === 'en' && c.cvEn ? c.cvEn : c.cv));

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

/* ---------- 不同的大招（v0.14：按**角色**区分，不再是五位共用同一发） ----------
 * 人类 2026-10-17：「设计不同的大招」。这里把大招做成**数据驱动**的一张小表：
 * 每个角色 id → 一个大招定义；未列出的角色用 `default`（沿用旧「浄化の歌」）。
 * 所有大招共用同一套规则（充能满 100 → 按 Space 释放、用完清零），差别只在
 * **效果**：清怪、控场、回血、爆发各有侧重 —— 这才是"不同角色手感不同"的来源。
 *
 * 字段：
 *   id       ── 唯一 id（存档/调试参数 ?ult= 只允许 1|0，这里的事件不涉及存档 schema）
 *   icon     ── HUD 大招条的图标（霓虹字符）
 *   name     ── 三语名（HUD 与横幅）
 *   desc     ── 三语说明（UI/文档取用）
 *   clearDanger ── true＝冲散**全部敌方攻击（Danger）**（旧「浄化の歌」的核心）
 *   freeze   ── {seconds, all} 全场僵直（走 game.applyFreeze，Boss 减免照旧）
 *   slow     ── {seconds, mul} 全场减速（走 game.applySlow）
 *   rings    ── 冲击环数组：{maxR, speed, dmgMul, kb, color, arcDeg, dir}
 *               dmgMul 是**玩家伤害倍率**的倍数；arcDeg<360 且 dir==='aim' 时朝瞄准方向成扇形
 *   heal     ── 按最大生命的比例回复
 *   invuln   ── 释放后的无敌秒数（至少 0.8 保证"释放瞬间不死"）
 *   banner   ── 横幅用的 i18n 键（缺省 banner.ult）
 */
KUP.ULTIMATES = {
  /* 花譜／化歩：等离子对撞机（HOP WTR 最早的大招样式——单体点杀 → 巨大能量） */
  kaf: {
    id: 'ult_kaf', icon: '♪',
    name: { zh: '双极谐振', en: 'Bipolar Resonance', ja: '双極共鳴' },
    desc: {
      zh: '以自身为轴迸出**双重反相冲击环**，全场破除并重创（两道波接连扫过）。',
      en: 'Two out-of-phase shock waves burst from you, clearing and blasting the whole field.',
      ja: '自機を軸に**逆相の衝撃環を二重**に放ち、場全体を薙ぎ払う。',
    },
    clearDanger: true,
    rings: [
      { maxR: 950, speed: 760, dmgMul: 3.2, kb: 280, color: '#9ff3ff' },
      { maxR: 760, speed: 620, dmgMul: 2.4, kb: 220, color: '#7dffe0' },
    ],
    invuln: 1.2,
    cdMax: 2.6,
  },
  /* 理芽／狸眼：冰封剧场（把全场"摄影机"按下暂停） */
  rim: {
    id: 'ult_rim', icon: '❄',
    name: { zh: '静止帧', en: 'Freeze Frame', ja: '静止フレーム' },
    desc: {
      zh: '全场怪异被**冻结 3.2 秒**（含 Boss，减免照旧）并清掉全部敌袭，顺势回血 15%。',
      en: 'Every foe freezes for 3.2s (bosses reduced), all enemy attacks are dispelled, and you heal 15%.',
      ja: '場のすべてを**3.2 秒凍結**（Boss は軽減）し敵襲を消去、さらに 15% 回復。',
    },
    clearDanger: true,
    freeze: { seconds: 3.2, all: true },
    heal: 0.15,
    rings: [{ maxR: 420, speed: 560, dmgMul: 1.4, kb: 120, color: '#bff0ff' }],
    invuln: 1.4,
    cdMax: 3.0,
  },
  /* 春猿火／派流：火炎龙舞（正面扇形喷发，伤害最高但只朝一个方向）
   * ⚠ 键名必须是**角色 id**（KUP.CHARS[].id ＝ 'harusaruhi'；'haru' 不是有效 id）。 */
  harusaruhi: {
    id: 'ult_haru', icon: '炎',
    name: { zh: '九龍噴火', en: 'Nine-Dragon Breath', ja: '九龍噴火' },
    desc: {
      zh: '朝瞄准方向喷出 **160° 扇形烈焰**（伤害 ×4.5），并小幅回复；敌袭一并燃尽。',
      en: 'A 160° flame cone blasts toward your aim (×4.5 damage) and mends you a little; enemy attacks burn away.',
      ja: '照準方向へ **160° の扇形火炎**（ダメージ ×4.5）を噴き、少し回復。敵襲も焼き払う。',
    },
    clearDanger: true,
    rings: [{ maxR: 700, speed: 900, dmgMul: 4.5, kb: 340, color: '#ffb25a', arcDeg: 160, dir: 'aim' }],
    heal: 0.06,
    invuln: 0.9,
    cdMax: 2.2,
  },
  /* ヰ世界情緒／世界：星屑领域（全场减速 + 持续区域，控场型） */
  isekaijoucho: {
    id: 'ult_isekai', icon: '星',
    name: { zh: '星海陷落', en: 'Starsea Collapse', ja: '星海陥落' },
    desc: {
      zh: '全场怪异 **减速至 35% 持续 10 秒**，并在周围留下 4 处星屑滞留区；伤害较低但控场极强。',
      en: 'All foes slow to 35% for 10s, leaving four lingering stardust fields — lower damage, superb control.',
      ja: '場のすべてを **35% に 10 秒減速**し、周囲に星屑の残響域 ×4 —— 低火力・高制圧。',
    },
    slow: { seconds: 10, mul: 0.35 },
    fields: 4,
    clearDanger: false,
    rings: [{ maxR: 520, speed: 420, dmgMul: 1.0, kb: 60, color: '#c9a6ff' }],
    invuln: 1.0,
    cdMax: 3.4,
  },
  /* 輪廻此処／此処：the last bullet —— 环形速射（多道贯穿光束绕自身向外打） */
  koko: {
    id: 'ult_koko', icon: '弾',
    name: { zh: '终结弹幕', en: 'The Last Barrage', ja: '終弾幕' },
    desc: {
      zh: '以自身为中心向 **12 个方向**同时射出贯穿光束（每发 ×1.6 伤害），并短暂无敌。',
      en: 'Twelve piercing beams fire in all directions at once (×1.6 each), plus a short invulnerability.',
      ja: '自機から **12 方向**へ同時に貫通ビーム（各 ×1.6）、短時間無敵。',
    },
    clearDanger: true,
    beams: { count: 12, dmgMul: 1.6, len: 900, w: 14, color: '#7aa0ff' },
    invuln: 1.2,
    cdMax: 2.8,
  },
  /* 天祢亜留（魔女候補）：救済の聖歌 —— 回血 + 免疫型 |
   * 注：「留作魔女候補的祝福」——她不是魔女之子，大招偏支援而非输出。 */
  aru: {
    id: 'ult_aru', icon: '鐘',
    name: { zh: '救済の聖歌', en: 'Salvation Chant', ja: '救済の聖歌' },
    desc: {
      zh: '钟声涤荡——**回复 40% 最大生命**，3 秒无敌，全场冲击环伤害偏低。',
      en: 'A cleansing bell — <b>heal 40% max HP</b>, 3s invulnerability, light field-wide damage.',
      ja: '鐘の音が清める——<b>最大生命の 40% 回復</b>、3 秒無敵、場全体に軽いダメージ。',
    },
    clearDanger: true,
    heal: 0.4,
    rings: [{ maxR: 620, speed: 520, dmgMul: 1.2, kb: 180, color: '#8fa8ff' }],
    invuln: 3.0,
    cdMax: 4.0,
  },
  /* 地邑阿栖（魔女候補）：追唱の終楽章 —— 放射箭雨 |
   * 射弹型：以玩家为中心向外打出一圈贯穿弹（正合 v0.14「射弹夹角小」的手感）。 */
  asu: {
    id: 'ult_asu', icon: '矢',
    name: { zh: '終楽章・箭雨', en: 'Finale — Arrow Rain', ja: '終楽章・箭雨' },
    desc: {
      zh: '贯穿之矢向 **16 个方向**齐射（每发 ×1.3 伤害），并清除敌袭。',
      en: 'Piercing arrows volley in sixteen directions (×1.3 each) and dispel enemy attacks.',
      ja: '貫通の矢を **16 方向**へ一斉射（各 ×1.3）、敵襲を消去。',
    },
    clearDanger: true,
    shots: { count: 16, dmgMul: 1.3, speed: 760, life: 1.3, pierce: 3, color: '#7de0c8' },
    invuln: 1.0,
    cdMax: 2.4,
  },
  /* 未列出的角色：沿用旧的「浄化の歌」（清屏冲击环 + 冲散敌袭 + 无敌） */
  default: {
    id: 'ult_default', icon: '♪',
    name: { zh: '浄化の歌', en: 'Song of Purification', ja: '浄化の歌' },
    desc: {
      zh: '击破充能满 100 → 释放：净化冲击环 + 清除全部敌方攻击 + 短暂无敌。',
      en: 'Charge to 100 → a purification shock ring, all enemy attacks dispelled, brief invulnerability.',
      ja: 'チャージ 100 で発動——浄化の衝撃環・敵襲全消去・短時間無敵。',
    },
    clearDanger: true,
    rings: [{ maxR: 950, speed: 700, dmgMul: 2.6, kb: 260, color: '#9ff3ff' }],
    invuln: 1.2,
    cdMax: 3.0,
  },
};
/* 取某角色的大招（未知角色 → default） */
/* 取某角色的大招（未知角色 → default）。未知 id 会 console.warn，便于发现键名写错
 * （v0.14 实际踩过：把春猿火写成 'haru'，结果一直落到 default 而无人察觉）。 */
KUP.ULTIMATE = id => {
  const u = KUP.ULTIMATES[id];
  if (!u && KUP.CHARS && KUP.CHARS.length) {
    const know = KUP.CHARS.some(c => c.id === id);
    if (!know) console.warn('[KUP] KUP.ULTIMATES 没有角色 "' + id + '" 的大招，回落到 default。可用：' +
      KUP.CHARS.map(c => c.id).join(', '));
  }
  return u || KUP.ULTIMATES.default;
};

/* ---------- 被动强化（命名取自育成系谱：系谱曲／派生曲／拡声曲） ---------- */
KUP.PASSIVES = {
  power:  {
    icon: '声', color: '#ff8a5a', maxLv: 5,
    name: { zh: '扩声之力', en: 'Amplified Voice', ja: '拡声の力' },
    desc: { zh: '歌声更加响亮——全部伤害 +12%。', en: 'The song rings louder — all damage +12%.', ja: '歌声がより響き渡る——全ダメージ +12%。' },
  },
  tempo:  {
    icon: '律', color: '#5ad0ff', maxLv: 5,
    name: { zh: '派生之律', en: 'Derivative Tempo', ja: '派生の律' },
    desc: { zh: '旋律愈发急促——全部冷却 -9%。', en: 'The melody quickens — all cooldowns -9%.', ja: '旋律がより急ぐ——全クールダウン -9%。' },
  },
  heart:  {
    icon: '心', color: '#7dff9a', maxLv: 5,
    name: { zh: '系谱之心', en: 'Heart of Lineage', ja: '系譜の心' },
    desc: { zh: '系谱的羁绊——最大生命 +25%（并回满）。', en: 'Bonds of lineage — max HP +25% (and full heal).', ja: '系譜の絆——最大生命 +25%（全回復）。' },
  },
  field:  {
    icon: '界', color: '#b06bff', maxLv: 5,
    name: { zh: '电脑领域', en: 'Cyber Field', ja: '電脳領域' },
    desc: { zh: '电脑领域扩张——攻击范围 +12%。', en: 'The cyber field expands — attack area +12%.', ja: '電脳領域が拡張——攻撃範囲 +12%。' },
  },
  mic:    {
    icon: '拾', color: '#ffd25a', maxLv: 5,
    name: { zh: '魔导麦克风', en: 'Magic Microphone', ja: '魔導マイク' },
    desc: { zh: '音片更易被歌声吸引——拾取范围 +30%。', en: 'Note shards are drawn to your song — pickup range +30%.', ja: '音片が歌に引かれやすくなる——取得範囲 +30%。' },
  },
  steps:  {
    icon: '步', color: '#8affc9', maxLv: 5,
    name: { zh: '魔女步幅', en: "Witch's Stride", ja: '魔女の歩幅' },
    desc: { zh: '轻盈的步伐——移动速度 +9%。', en: 'Light-footed — move speed +9%.', ja: '軽やかな歩み——移動速度 +9%。' },
  },
  stream: {
    icon: '配', color: '#7aa0ff', maxLv: 5,
    name: { zh: '直播回路', en: 'Streaming Circuit', ja: '配信回路' },
    desc: { zh: '直播不中断——经验获取 +15%。', en: 'The stream never drops — XP gain +15%.', ja: '配信は途切れない——経験値取得 +15%。' },
  },
  /* ===== 机制型被动（v0.8：闪避/护盾/吸血/反擊/疾走）=====
   * 针对「敌对伤害可被躲避」这一诉求：护盾吸收、回避免伤、吸血续航、反響报复、冲刺次数。 */
  /* v0.14：护盾从「先吃伤害的独立血条」改为**减伤膜**——护盾值＝减伤强度（100＝满值），
   * 从不被扣光；各受击类型的减伤见 KUP.CONFIG.SHIELD.REDUCE（贴靠 95%／音波 85%／
   * 毒区 75%／轰炸 70%／光束 50%）。护盾每级 +22，满值 100 后其余照旧生效（見 recompute）。 */
  shield: {
    icon: '盾', color: '#8fd0ff', maxLv: 5,
    name: { zh: '防音护盾', en: 'Soundproof Shield', ja: '防音シールド' },
    desc: {
      zh: '歌声化作减伤膜——<b>+22 护盾</b>／级（满值 100）。按受击类型减伤：<b>贴靠 95%</b>、音波 85%、毒区 75%、轰炸 70%、光束 50%。',
      en: 'Song becomes a damage-reducing membrane — <b>+22 shield</b> per level (max 100). Reduction by hit type: <b>contact 95%</b>, rings 85%, fields 75%, bombs 70%, beams 50%.',
      ja: '歌が軽減膜となる——<b>+22 シールド</b>／レベル（最大 100）。被弾種類ごとに軽減：<b>接触 95%</b>・音波 85%・毒域 75%・爆撃 70%・光条 50%。',
    },
  },
  dodge: {
    icon: '避', color: '#c9ffe8', maxLv: 5,
    name: { zh: '残响回避', en: 'Echo Evasion', ja: '残響回避' },
    desc: {
      zh: '身形出现残影——<b>7%</b>／级概率完全回避受到的伤害。',
      en: 'An after-image lingers — <b>7%</b> per level to completely evade damage.',
      ja: '残像が揺れる——<b>7%</b>／レベルで被ダメージを完全回避。',
    },
  },
  drain: {
    icon: '吸', color: '#ff6bb5', maxLv: 5,
    name: { zh: '吸音', en: 'Sound Drain', ja: '吸音' },
    desc: {
      zh: '吸走破维魔的余音——击破时回复最大生命的 <b>0.6%</b>／级（精英×4、Boss×10）。',
      en: 'Drink the Tesseracter\'s afterglow — heal <b>0.6%</b> max HP per level on kill (×4 elite, ×10 boss).',
      ja: 'テセラクターの余音を吸う——撃破時、最大生命の <b>0.6%</b>／レベル回復（エリート ×4・Boss ×10）。',
    },
  },
  retaliate: {
    icon: '返', color: '#ffb25a', maxLv: 5,
    name: { zh: '反響', en: 'Reverberation', ja: '反響' },
    desc: {
      zh: '受击时迸发反響冲击——对周围造成 <b>15</b>／级伤害并击退。',
      en: 'Being struck bursts into reverberation — <b>15</b> damage per level around you, with knockback.',
      ja: '被弾時に反響が弾ける——周囲に <b>15</b>／レベルのダメージとノックバック。',
    },
  },
  dashup: {
    icon: '疾', color: '#a0f0ff', maxLv: 3,
    name: { zh: '疾风之谱', en: 'Score of Gale', ja: '疾風の譜' },
    desc: {
      zh: '冲刺（Shift）更可用——Lv1/3 各 <b>+1 次冲刺</b>，每级 <b>−15% 冷却</b>。',
      en: 'More dashes (Shift) — <b>+1 charge</b> at Lv1/3, <b>−15%</b> recharge per level.',
      ja: 'ダッシュ（Shift）を強化——Lv1/3 で <b>+1 回</b>、毎レベル <b>−15%</b> リチャージ。',
    },
  },
  regen: {
    icon: '癒', color: '#8affc9', maxLv: 5,
    name: { zh: '余韵之癒', en: 'Lingering Recovery', ja: '余韻の癒し' },
    desc: {
      zh: '歌声的余韵持续修复身体——<b>每秒回复 1.0 生命</b>／级（战斗中也生效）。',
      en: 'The song\'s afterglow mends you — <b>+1.0 HP per second</b> per level, even in combat.',
      ja: '歌の余韻が身体を修復する——<b>毎秒 1.0 回復</b>／レベル（戦闘中も有効）。',
    },
  },
  grace: {
    icon: '潤', color: '#c9ffe8', maxLv: 5,
    name: { zh: '無傷の譜', en: 'Score of Unhurt', ja: '無傷の譜' },
    desc: {
      zh: '回避（MISS）成功时，音片回流——回复最大生命的 <b>1.5%</b>／级。',
      en: 'Each MISS sends shards flowing back — heal <b>1.5%</b> max HP per level.',
      ja: '回避（MISS）成功時、音片が還流する——最大生命の <b>1.5%</b>／レベル回復。',
    },
  },
};

/* ---------- 局内道具（v0.8：升级三选一里**直接选到**的护盾/MISS/回血） ----------
 * 与「被动强化」分开：
 *   - 不占被动槽（被动上限 5 种），可**重复选择**、可叠加生效时间
 *   - 效果为**立即生效**或**限时 BUFF**，用于应急（血线危险时升级池会出现更多生存道具）
 * 与瓦利斯的**局外强化**（護盾被动/常連の勘/薬膳スープ）互为补充：局外是永久小幅，局内是即时道具。 */
KUP.ITEMS = {
  /* v0.14：护盾改**减伤膜**（不是第二管血）。防音の符＝在现有护盾之上**追加一层 60 膜**，
   * 只提高减伤、不提供任何"血量"；没有被动护盾时也能单独使用（此时就显示这 60 膜）。 */
  ward: {
    id: 'ward', icon: '盾', color: '#8fd0ff', kind: 'shield', amount: 60, seconds: 30,
    name: { zh: '防音の符', en: 'Ward of Silence', ja: '防音の符' },
    desc: {
      zh: '歌声凝成护膜——<b>30 秒内追加 60 膜层</b>：按受击类型大幅减伤（贴靠 95%、音波 85%、毒区 75%、轰炸 70%、光束 50%），<b>不会被当作生命扣光</b>。',
      en: 'Song condenses into a membrane — <b>+60 membrane for 30s</b>: heavy damage reduction by hit type (contact 95%, ring 85%, field 75%, bomb 70%, beam 50%) — <b>never drained as a second HP bar</b>.',
      ja: '歌が膜となる——<b>30 秒間、膜を 60 追加</b>：被弾の種類ごとに大幅軽減（接触 95%・音波 85%・毒域 75%・爆撃 70%・光条 50%）。<b>第二のHPとしては減らない</b>。',
    },
  },
  veil: {
    id: 'veil', icon: '避', color: '#c9ffe8', kind: 'miss', amount: 0.25, seconds: 15,
    name: { zh: '無傷の符', en: 'Ward of Unhurt', ja: '無傷の符' },
    desc: {
      zh: '身法化为残影——<b>15 秒内 MISS（完全回避）率 +25%</b>。',
      en: 'Your stance becomes an after-image — <b>+25% MISS chance for 15s</b>.',
      ja: '身法が残像となる——<b>15 秒間 MISS 率 +25%</b>。',
    },
  },
  salve: {
    id: 'salve', icon: '癒', color: '#7dff9a', kind: 'heal', amount: 0.45,
    name: { zh: '治癒の符', en: 'Ward of Healing', ja: '治癒の符' },
    desc: {
      zh: '音片回流——<b>立即回复 45% 最大生命</b>。',
      en: 'Shards flow back — <b>heal 45% max HP now</b>.',
      ja: '音片が還流する——<b>即座に最大生命の 45% 回復</b>。',
    },
  },
  echo: {
    id: 'echo', icon: '潤', color: '#8affc9', kind: 'regen', amount: 4, seconds: 20,
    name: { zh: '余韵の符', en: 'Ward of Afterglow', ja: '余韻の符' },
    desc: {
      zh: '余韵持续低鸣——<b>20 秒内每秒回复 4 生命</b>。',
      en: 'The afterglow keeps humming — <b>+4 HP/s for 20s</b>.',
      ja: '余韻が低く鳴り続ける——<b>20 秒間、毎秒 4 回復</b>。',
    },
  },
  /* v0.11 经验磁铁：激活期间拾取半径近乎全场（Gem.update 消费 buffs.magnet） */
  magnet: {
    id: 'magnet', icon: '磁', color: '#5ad0ff', kind: 'magnet', amount: 1, seconds: 8,
    name: { zh: '磁石の符', en: 'Ward of Magnetism', ja: '磁石の符' },
    desc: {
      zh: '歌声化作磁场——<b>8 秒内全场音片被吸向魔女</b>（回复 ♥ 与記憶の卵同样被吸引）。',
      en: 'Your song becomes a magnetic field — <b>every note shard is pulled to you for 8s</b> (hearts and Eggs of Memory too).',
      ja: '歌が磁場となる——<b>8 秒間、場の音片すべてが引き寄せられる</b>（回復♥と記憶の卵も）。',
    },
  },
  /* ===== v0.13 状态异常（僵直／冷冻 与 减速）=====
   * freeze：「凍結の符」——全场敌人**完全静止**（不移动／不行动／无接触伤害）。
   * bind  ：「鈍足の符」——全场敌人**减速**（倍率 amount 越小越慢）。
   * 两者都走 game.applyFreeze/applySlow（Boss ×0.5、精英 ×0.75 的时间减免）。 */
  freeze: {
    id: 'freeze', icon: '凍', color: '#bff0ff', kind: 'freeze', seconds: 2.6,
    name: { zh: '凍結の符', en: 'Ward of Frost', ja: '凍結の符' },
    desc: {
      zh: '歌声凝霜——<b>全场破维魔 2.6 秒完全僵直（冷冻）</b>：不动、不攻击、无接触伤害。<br><span class="cv-note">Boss 减免为 50%、精英 75%</span>',
      en: 'Your song frosts over — <b>every Tesseracter is frozen solid for 2.6s</b>: no movement, no attacks, no contact damage.<br><span class="cv-note">Bosses 50%, elites 75% duration</span>',
      ja: '歌が霜となる——<b>場のテセラクターすべてを 2.6 秒完全に凍結</b>：移動・攻撃・接触ダメージなし。<br><span class="cv-note">Boss は 50%、エリートは 75% の時間</span>',
    },
  },
  bind: {
    id: 'bind', icon: '鈍', color: '#8fd0ff', kind: 'slow', amount: 0.5, seconds: 8,
    name: { zh: '鈍足の符', en: 'Ward of Sloth', ja: '鈍足の符' },
    desc: {
      zh: '歌声变得黏重——<b>全场破维魔 8 秒减速至 50%</b>（可与滞留音场的减速叠加，取最强）。',
      en: 'Your song turns thick — <b>every Tesseracter is slowed to 50% for 8s</b> (stacks with lingering fields, strongest wins).',
      ja: '歌が粘る——<b>場のテセラクターすべてを 8 秒間 50% に減速</b>（残響音場の減速と重ねがけ、強い方が適用）。',
    },
  },
};
KUP.ITEM = id => KUP.ITEMS[id] || null;

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
    hp: 7, speed: 108, dmg: 6, xp: 2, r: 9, color: '#55e0ff', sides: 5, turn: 900,
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

/* ---------- 记忆片段（記憶の卵 ★ 动画第6話解锁的记忆图鉴） ----------
 * 拾取記憶の卵 → 按顺序解锁一条。
 * ★ 标题全部取自**动画各话官方副标题**（【官方】）：魔女の娘（第1話）／悪意（第4話）／
 *   フラグメント -Energy of will-（第3話）／ファミリア -Familiar-（第5話）／
 *   記憶の卵 -Piece of memory-（第6話）／ブラックアウト＝大黒寂（第8話）／再生 -Regenerate-（第11話）。
 *   「復興率」取自協奏中官方机制。全部世界观依据见 docs/lore/worldview.md §2.3／§12。
 * ⚠️ 正文**不得解答官方"待解四问"**（少女们为何歌唱／神椿市为何反复崩坏再生／
 *    拉普拉斯是敌是友／破维魔的真面目）——官方明言「刻意不去提及」（lore §1、§15.6）。
 *    唯一的例外是「現象＝索菲娅的时间回溯」，且必须标注为**本作设定解读**。
 * ⚠️ 敌人根源的完整链条是「麦克斯韦 → 大黒寂（伪装天灾）→ 恐惧与欲望 → 破维魔 → 提取フラグメント」，
 *    但『malice』一篇沿用**动画官网可见文案「悪意と欲望」**（与该篇的官方副标题同源），
 *    不点出具象者麦克斯韦——更底层的写法只留在本注释里。 */
KUP.FRAGMENTS = [
  {
    id: 'witchling',
    title: { zh: '魔女の娘 -Witchling-', en: 'Witchling', ja: '魔女の娘 -Witchling-' },
    text: {
      zh: '五名魔女之子住在废墟之中，却仍在歌唱——那歌声，是这座城市最后的照明。',
      en: 'Five witchlings live among the ruins, yet still sing — that song is the city\'s last light.',
      ja: '五人の魔女の娘は廃墟に住み、それでも歌う——その歌声は、この街最後の照明だ。',
    },
  },
  {
    id: 'malice',
    title: { zh: '悪意 -Malice-', en: 'Malice', ja: '悪意 -Malice-' },
    text: {
      zh: '破维魔诞生于人之恶意与欲望。净化不会终结——只要恶意仍在累积。',
      en: 'Tesseracters are born of human malice and desire. Purification never ends — malice keeps accumulating.',
      ja: 'テセラクターは人の悪意と欲望より生まれる。浄化は終わらない——悪意が蓄積し続ける限り。',
    },
  },
  {
    id: 'fragment',
    title: { zh: 'フラグメント -Energy of will-', en: 'Fragment — Energy of Will', ja: 'フラグメント -Energy of will-' },
    text: {
      zh: '音片（フラグメント）是「想いの力」的结晶。收集它们，歌声便会愈发响亮。',
      en: 'Fragments are crystallized "energy of will". Gather them, and the song grows louder.',
      ja: 'フラグメントは「想いの力」の結晶。集めるほど、歌声はいっそう響き渡る。',
    },
  },
  {
    id: 'familiar',
    title: { zh: 'ファミリア -Familiar-', en: 'Familiar', ja: 'ファミリア -Familiar-' },
    /* ★ 2026-10 定论（本仓库 lore §4.2／§11 行 22）：眷魔**全体是破维魔盟友**——
     *   与对应魔女可能有摩擦、矛盾、冲突，但**不存在完全敌对**。
     *   ⚠️ 旧文案「敌与友，一线之隔」属于已被推翻的「敵友两义」说法，不得再出现；
     *      本作也不做「先当敌人打、再收服」的转化叙事。 */
    text: {
      zh: '与魔女结盟的使魔「ファミリア（<b>眷魔</b>）」——它们同时仍是异能破维魔，却始终是<b>盟友</b>：会有摩擦与矛盾，但不会真正与你为敌。',
      en: 'The familiars who covenant with witches — they remain aberrant Tesseracters, yet they are <b>allies</b>: friction and conflict, but never true enmity.',
      ja: '魔女と盟した使い魔「ファミリア」。同時に異能テセラクターであり、そして<b>盟友</b>だ——摩擦はあれど、真に敵対することはない。',
    },
  },
  {
    id: 'egg',
    title: { zh: '記憶の卵 -Piece of memory-', en: 'Piece of Memory', ja: '記憶の卵 -Piece of memory-' },
    text: {
      zh: '记忆的卵中封存着「魔女の娘の記憶」。观测者啊，你想起了什么？',
      en: 'Inside the egg of memory sleeps "the witchlings\' memory". Observer — what do you recall?',
      ja: '記憶の卵には「魔女の娘の記憶」が眠る。観測者よ、何を思い出す？',
    },
  },
  {
    id: 'daikokujaku',
    title: { zh: '大黒寂', en: 'The Great Silence', ja: '大黒寂' },
    text: {
      zh: '七年前的大灾害「大黒寂」——神椿市从那片寂静中奇迹般复兴。',
      en: 'Seven years ago came the Great Silence, "Daikoku-jaku" — Kamitsubaki City miraculously rose from it.',
      ja: '七年前の大災害「大黒寂」——神椿市はあの静寂から奇跡的に復興した。',
    },
  },
  {
    id: 'fukkou',
    title: { zh: '復興率', en: 'Restoration Rate', ja: '復興率' },
    text: {
      zh: '「打歌，提升神椿市的復興率」——复兴即是叙事。街区因歌声而苏醒。',
      en: '"Play, and raise the city\'s restoration rate" — restoration is the story. The district wakes to song.',
      ja: '「楽曲をプレイして神椿市の復興率を上げる」——復興こそが物語。街は歌によって目を覚ます。',
    },
  },
  {
    id: 'regenerate',
    title: { zh: '再生 -Regenerate-', en: 'Regenerate', ja: '再生 -Regenerate-' },
    text: {
      zh: '终有一日，歌声将让世界「再生」——浄化的尽头，是重建的开始。',
      en: 'One day, the song will "regenerate" the world — past purification lies the beginning of rebuilding.',
      ja: 'いつか、歌は世界を「再生」する——浄化の果てに、建設の始まりがある。',
    },
  },
];

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

/* ---------- 皮肤＝「形態」（★ 官方命名法：「（魔女）特殊歌唱用形態 ○○」） ----------
 * 官方 LIVE 的服装/形态命名实例：「特殊歌唱用形態 星鴉」「魔女特殊歌唱用形態 花魁鳥」（粉丝 wiki 转引官方命名）
 *   —— 出处等级【粉丝 wiki 转引】，故 `ouranchou.src` 如实写「粉丝 wiki 转引」。
 * ⚠️ 泛称「歌唱形態」**不是官方术语**（萌百仅 2 处编者自拟小节标题）；本作一律用「（魔女）特殊歌唱用形態 ○○」。
 * ⚠️ `src` 字段**只作数据层的出处记录**（verify-run 会校验它存在，见 tools/verify-run.js）；
 *    **界面不再显示出处行**（ui.js 里对应的渲染已注释掉）。
 * 本批形态（2026-10）：
 *   - 魔女之子（kinds:['witch']）：花魁鳥／姬連雀 —— 本批共用；★ 姬連雀为**本作同人命名**（官方无此形态名）
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
      zh: '形态名＝官方（花魁鳥 (Revolutions) 词条／官方 VR 曲目表「変身／花魁鳥」＝Witches Awakening／官方商品页）',
      en: 'Form names: official (the Oiran-chō (Revolutions) entry / official VR tracklist "Witches Awakening" / official product pages)',
      ja: '形態名＝公式（花魁鳥 (Revolutions) の項目／公式 VR 曲目表「変身／花魁鳥」＝Witches Awakening／公式商品ページ）',
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
  {
    id: 'none', kinds: null, accent: 'none',
    name: { zh: '通常形態', en: 'Standard Form', ja: '通常形態' },
    label: { zh: '不指定（通常形態）', en: 'Standard (no form)', ja: '指定なし（通常形態）' },
    desc: { zh: '不指定特殊歌唱用形態。', en: 'No special singing form equipped.', ja: '特殊歌唱用形態を指定しない。' },
    mods: {},
  },
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
    id: 'himerenjaku', kinds: ['witch'], series: 'legacy', accent: 'crest',
    name: { zh: '姬連雀', en: 'Hime-renjaku', ja: '姫連雀' },
    label: { zh: '魔女特殊歌唱用形態 姬連雀', en: 'Witch Special Singing Form: Hime-renjaku', ja: '魔女特殊歌唱用形態 姫連雀' },
    desc: { zh: '轻盈的连雀之羽——游走的低语。<br>移动速度 +12%、拾取范围 +20%、经验 +8%，攻击 -5%。', en: 'The light plumage of the waxwing — a wandering whisper.<br>Move speed +12%, pickup +20%, XP +8%, Atk -5%.', ja: '軽やかな連雀の羽——遊走の囁き。<br>移動速度 +12%、取得 +20%、経験 +8%、攻撃 -5%。' },
    mods: { speed: 1.12, pickup: 1.2, xp: 1.08, dmg: 0.95 },
    color: '#8affc9', color2: '#0f6b52',
    src: { zh: '本作同人命名（官方无此形态名）', en: 'Fan-made naming (no official form of this name)', ja: '本作の同人命名（公式にこの形態名はない）' },
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
  { id: 'hinadori_kuro', series: 'kaf_singing', name: { zh: '雏鸟黑', en: 'Hinadori Kuro', ja: '雛鳥黑（ひなどり くろ）' }, accent: 'sparrow_wing', color: '#4a4a63' },
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
    id: 'childhoods_end', series: 'rim_meta', name: { zh: '幼年期の終わり', en: "Childhood's End", ja: 'Special Metamorphose「Childhood\'s End」' },
    accent: 'star_ring', color: '#e8ecf6',
    note: {
      zh: '又名「幼年期の終わり」——官方 VR 曲目表 `変身／幼年期の終わり`＝Rime\'s Awakening。<br>银白礼服披薄纱、长发银环束起、衣摆星屑。<br>拾取范围 <b>+25%</b>、经验 <b>+10%</b>、移动速度 <b>+5%</b>，最大生命 <b>−8%</b>。',
      en: 'Also known as 幼年期の終わり — the official VR tracklist maps it to Rime\'s Awakening.<br>A silver-white gown under gauze, hair bound by a silver ring, stardust at the hem.<br>Pickup <b>+25%</b>, XP <b>+10%</b>, move speed <b>+5%</b>, max HP <b>−8%</b>.',
      ja: '別名「幼年期の終わり」——公式 VR 曲目表の `変身／幼年期の終わり`＝Rime\'s Awakening。<br>銀白のドレスに薄紗、長い髪は銀のリングで束ね、裾に星屑。<br>取得 <b>+25%</b>、経験 <b>+10%</b>、移動速度 <b>+5%</b>、最大生命 <b>−8%</b>。',
    },
    mods: { pickup: 1.25, xp: 1.10, speed: 1.05, hp: 0.92 },
  },
  { id: 'cosmic_puppets', series: 'rim_meta', name: { zh: 'The Cosmic Puppets', en: 'The Cosmic Puppets', ja: '2nd Metamorphose「The Cosmic Puppets」' }, color: '#b9c2d9' },
  { id: 'crack_in_space', series: 'rim_meta', name: { zh: 'The Crack in Space', en: 'The Crack in Space', ja: '3rd Metamorphose「The Crack in Space」' }, color: '#d6c8ff' },
  { id: 'counter_clock', series: 'rim_meta', name: { zh: 'Counter-Clock World', en: 'Counter-Clock World', ja: 'Special Metamorphose「Counter-Clock World」' }, accent: 'star_ring', color: '#cfe0ff' },
  {
    id: 'dr_futurity', series: 'rim_meta', name: { zh: 'Dr.Futurity', en: 'Dr.Futurity', ja: '4th Metamorphose「Dr.Futurity」' }, color: '#cfd8e8',
    note: {
      zh: '官方「歴代衣装」商品系列的第 4 件——**非公式 wiki 与官方 WORDS 都还没有**（2026-09 商品页才点名）。',
      en: 'The 4th entry in the official "successive costumes" goods line — **absent from both the fan wiki and the official WORDS list** (first named in a 2026-09 product page).',
      ja: '公式「歴代衣装」商品シリーズの 4 件目——**非公式 wiki にも公式 WORDS にも未収録**（2026-09 の商品ページで初めて名前が出た）。',
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
    desc: { zh: '昼之装束——歌声更易牵引音片。<br>拾取范围 +15%。', en: 'Day vestment — a song that gathers shards.<br>Pickup +15%.', ja: '昼の装い——歌が音片を引き寄せる。<br>取得 +15%。' },
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
KUP.FORM = id => KUP.FORMS.find(f => f.id === id) || KUP.FORMS[0];
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

/* ========== 瓦利斯（VALIS 的饭店）· 局外强化（2026-10 追加） ==========
 * ★ 出处：REGENERATE 官方页——**弐番街「歌と中華料理の店・瓦利欺」**，VALIS 六人店员（白銀千埜店長 等）【官方】。
 *   ★ 官方本地化（srd VIRTUAL REALITY 页，见 docs/lore/research/official_srd_en_cn.md）：
 *     **官方中文＝「歌与中餐店·瓦利斯」／官方英文＝`VALIS, a shop in Area 2 that serves songs and Chinese cuisine`**。
 * ※ 表记约定：**日语原文（ja 文案、官方引述）保留官方当て字「瓦利欺」**；**中文（zh 文案）写作「瓦利斯」**。
 * 本作把它作为**局外强化商店**：用**现金（元）**购买**小幅**永久强化（v0.16：现金每局结束发放）。
 * cost(lv) = base + lv * inc（lv 从 0 起算） */
KUP.SHOP = [
  {
    id: 'bun', icon: '包', maxLv: 5, base: 32, inc: 24, mods: { hp: 1.03 },
    name: { zh: '中华馒头', en: 'Steamed Bun', ja: '中華まん' },
    desc: { zh: '温暖的一个。最大生命 <b>+3%</b>／级。', en: 'One warm bun. Max HP <b>+3%</b> per level.', ja: '温かいひとつ。最大生命 <b>+3%</b>／レベル。' },
  },
  {
    id: 'subuta', icon: '酢', maxLv: 5, base: 40, inc: 28, mods: { playerDmg: 1.02 },
    name: { zh: '糖醋里脊', en: 'Sweet & Sour Pork', ja: '酢豚' },
    desc: { zh: '酸味让歌声更锐利。全部伤害 <b>+2%</b>／级。', en: 'The sourness sharpens the song. All damage <b>+2%</b> per level.', ja: '酸味が歌を尖らせる。全ダメージ <b>+2%</b>／レベル。' },
  },
  {
    id: 'annin', icon: '杏', maxLv: 5, base: 32, inc: 20, mods: { pickup: 1.06 },
    name: { zh: '杏仁豆腐', en: 'Almond Jelly', ja: '杏仁豆腐' },
    desc: { zh: '温柔的甜味。拾取范围 <b>+6%</b>／级。', en: 'Gentle sweetness. Pickup range <b>+6%</b> per level.', ja: '優しい甘さ。取得範囲 <b>+6%</b>／レベル。' },
  },
  {
    id: 'gyoza', icon: '餃', maxLv: 5, base: 36, inc: 24, mods: { speed: 1.02 },
    name: { zh: '饺子', en: 'Dumplings', ja: '餃子' },
    desc: { zh: '面皮有弹性。移动速度 <b>+2%</b>／级。', en: 'A springy bite. Move speed <b>+2%</b> per level.', ja: '皮の張り。移動速度 <b>+2%</b>／レベル。' },
  },
  {
    id: 'shokoshu', icon: '酒', maxLv: 5, base: 48, inc: 32, mods: { cd: 0.98 },
    name: { zh: '绍兴酒', en: 'Shaoxing Wine', ja: '紹興酒' },
    desc: { zh: '一盅的余韵。全部冷却 <b>−2%</b>／级。', en: 'A shot of afterglow. All cooldowns <b>−2%</b> per level.', ja: '一献の余韻。全クールダウン <b>−2%</b>／レベル。' },
  },
  {
    id: 'lazy', icon: '回', maxLv: 5, base: 44, inc: 28, mods: { xp: 1.04 },
    name: { zh: '回转台', en: 'Lazy Susan', ja: '回転テーブル' },
    desc: { zh: '音片转着圈来。经验 <b>+4%</b>／级。', en: 'The shards come around. XP <b>+4%</b> per level.', ja: '音片が回ってくる。経験 <b>+4%</b>／レベル。' },
  },
  {
    id: 'sign', icon: '看', maxLv: 3, base: 64, inc: 40, mods: { startUlt: 15 },
    name: { zh: '瓦利斯招牌', en: 'VALIS Signboard', ja: '瓦利欺の看板' },
    desc: { zh: '老主顾的证明。开局<b>浄化の歌充能 +15%</b>／级。', en: 'Proof of a regular. <b>Song charge +15%</b> at run start per level.', ja: '常連の証。開局の<b>浄化の歌チャージ +15%</b>／レベル。' },
  },
  {
    id: 'regular', icon: '常', maxLv: 3, base: 80, inc: 48, mods: { startLevel: 1 },
    name: { zh: '老主顾席位', en: "Regular's Table", ja: '常連の席' },
    desc: { zh: '熟面孔的待遇。开局<b>等级 +1</b>／级。', en: 'A familiar face. <b>Starting level +1</b> per level.', ja: '顔なじみ。開局<b>レベル +1</b>／レベル。' },
  },
  {
    id: 'soup', icon: '湯', maxLv: 3, base: 72, inc: 44, mods: { regenAdd: 0.5 },
    name: { zh: '药膳汤', en: 'Medicinal Soup', ja: '薬膳スープ' },
    desc: { zh: '暖汤养声。<b>每秒回复 +0.5 生命</b>／级（与被动叠加）。', en: 'Warm soup for the voice. <b>+0.5 HP/s</b> per level (stacks with passives).', ja: '温かいスープが声を養う。<b>毎秒 +0.5 回復</b>／レベル（被动と加算）。' },
  },
  {
    id: 'instinct', icon: '勘', maxLv: 3, base: 88, inc: 52, mods: { dodgeAdd: 0.03 },
    name: { zh: '常连的直觉', en: "Regular's Instinct", ja: '常連の勘' },
    desc: { zh: '身体先于意识退开。<b>回避（MISS）率 +3%</b>／级（与被动叠加，上限 60%）。', en: 'The body steps aside first. <b>MISS chance +3%</b> per level (stacks, cap 60%).', ja: '身体が先に退く。<b>回避率 +3%</b>／レベル（被动と加算、上限 60%）。' },
  },
];
KUP.SHOP_ITEM = id => KUP.SHOP.find(s => s.id === id) || null;
/* 等级 lv（0 起）→ 下一级价格 */
KUP.shopCost = (item, lv) => item.base + lv * item.inc;
