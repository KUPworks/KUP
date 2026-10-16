window.KUP = window.KUP || {};

/* ================= 数据表（三语；基于官方设定） =================
 * ★ 主角＝，不是声优：
 *   森先化歩（モリサキ カフ，声：花譜）／谷置狸眼（タニオキ リメ，声：理芽）／
 *   朝主派流（アサヌシ ハル，声：春猿火）／夜河世界（ヨルカワ セカイ，声：ヰ世界情緒）／
 *   輪廻此処（リンネ ココ，声：幸祜）
 *   ——「花譜」「理芽」等是，游戏中只作为 CAST 标注出现（`cv` 字段）。
 * 出处：REGENERATE 官方页（番街分区／居住魔女之子／CAST 读音全表）【官方】、
 *       动画《神椿市建設中。》各话副标题与分集剧情、周边设定考据见 docs/lore/related-settings.md。
 *  - 敌人官方称呼：テセラクター／中文＝人之恶意与欲望所生的怪物（具象者＝麦克斯韦，本作不使其登场）
 *  - 「歌は、魔法——」歌即魔法；五人的魔女之子被官方称为「電脳の魔女達」（V.W.P 为现实侧组合）
 *  - 育成系谱：系谱曲（カンザキイオリ）／派生曲／拡声曲 → 用作被动强化命名
 *  - 武器以命名（わたしの声／食虫植物／テラ／the last bullet／キミ消失セカイ）
 *  - 招募同伴（魔女候補）：天祢亜留（声：存流）／地邑阿栖（声：明透）——ヰ世界救済教団
 *  - 皮肤：「（魔女）特殊歌唱用形態 ○○」为官方命名法（花魁鳥／姬連雀）；魔女候補侧暂定「黑」「白」
 * 文本字段均为 {zh,en,ja} 三语对象，由 KUP.I18N.tv() 按语言取值。
 * 注：形象色为社区惯用印象色（官方未公开色值）；非官方同人致敬作品。
 */

/* ---------- 可操控主角：魔女之子五人（V.W.P＝其现实侧声优组合） ---------- */
KUP.CHARS = [
  {
    id: 'kaf',
    name: '森先 化歩', short: '化歩', reading: 'モリサキ カフ', romaji: 'MORISAKI KAFU',
    cv: '花譜', cvEn: 'KAF',
    area: 'area0',
    color: '#ff6fb5', color2: '#1f3a5f',
    weapon: 'note',
    desc: {
      zh: '零番街（下町）的高中一年生。大黑寂中失去双亲，由観統衿架抚养长大；大黑寂七年后被卷入「Q」并遇见らぷらす。<br>持有「能再生毁灭世界的歌声」，开朗活泼——均衡的标准魔女（攻撃 ×1.15）。<br><span class="cv-note">声 — 花譜</span>',
      en: 'A first-year high schooler of Area 0 (Lower Town). Orphaned by the Great Silence and raised by Erika Kanto; seven years later she is caught in a "Q" and meets Laplace.<br>She carries "the song that can regenerate a ruined world" — bright and lively, the balanced standard witchling (Atk ×1.15).<br><span class="cv-note">CV — KAF</span>',
      ja: '零番街（下町）の高校一年生。大黒寂で両親を失い、観統衿架に育てられた。七年後、街の「Q」に巻き込まれ、らぷらすと出会う。<br>「滅びた世界を再生させる歌声」を持つ、明快元気な均衡型の魔女の娘（攻撃 ×1.15）。<br><span class="cv-note">声 — 花譜</span>',
    },
    stats: { hp: 100, speed: 150, dmg: 1.15, cd: 1.0, area: 1.0, xp: 1.0 },
  },
  {
    id: 'rim',
    name: '谷置 狸眼', short: '狸眼', reading: 'タニオキ リメ', romaji: 'TANIOKI RIME',
    cv: '理芽', cvEn: 'RIM',
    area: 'area1',
    color: '#3e78d6', color2: '#c0392b',
    weapon: 'orbit',
    desc: {
      zh: '壱番街（オフィス地区）的高中三年生，谷置家之女。理知可靠、聪慧努力，近乎完美，却<b>纤细易病</b>，偶因内心的脆弱受伤。<br>「食虫植物」般的音球环绕捕食——拾取 ×1.5、经验 ×1.25，脆皮。<br><span class="cv-note">声 — 理芽</span>',
      en: 'A third-year of Area 1 (Office District) and daughter of the Tanioki family. Reliable and studious, almost perfect — yet delicate and prone to being wounded by her own fragile heart.<br>Carnivorous orbs orbit and devour: Pickup ×1.5, XP ×1.25, fragile.<br><span class="cv-note">CV — RIM</span>',
      ja: '壱番街（オフィス地区）の高校三年生、谷置家の娘。理知的で努力家、ほぼ完璧だが<b>繊細で病みやすい</b>。<br>「食虫植物」の如く音球が敵を捕食——取得 ×1.5、経験 ×1.25、紙耐久。<br><span class="cv-note">声 — 理芽</span>',
    },
    stats: { hp: 85, speed: 150, dmg: 1.0, cd: 1.0, area: 1.0, xp: 1.25, pickup: 1.5 },
  },
  {
    id: 'harusaruhi',
    name: '朝主 派流', short: '派流', reading: 'アサヌシ ハル', romaji: 'ASANUSHI HARU',
    cv: '春猿火', cvEn: 'HARUSARUHI',
    area: 'area2',
    color: '#e03a2f', color2: '#2e9bb6',
    weapon: 'bass',
    desc: {
      zh: '弐番街（歓楽街）的高中二年生，率领不良少年团／黑帮「<b>台風眼</b>」。以歌为支撑坚韧地活；感情丰富、情义深厚，原本内向易受伤，为面对严苛社会而逞强。<br>「テラ」震颤大地的低音冲击波——HP ×1.35、范围 ×1.2，重装。<br><span class="cv-note">声 — 春猿火</span>',
      en: 'A second-year of Area 2 (Pleasure Quarter) who leads the gang "Taifūgan". She lives stubbornly, propped up by song; rich in feeling and loyalty, once timid and easily hurt, now putting on a brave face for a harsh world.<br>"Terra" — a bass shockwave that quakes the earth: HP ×1.35, Area ×1.2, tanky.<br><span class="cv-note">CV — HARUSARUHI</span>',
      ja: '弐番街（歓楽街）の高校二年生。不良集団／組織「<b>台風眼</b>」を率いる。歌を支えに生き、感情豊かで情に厚い。元は内向的で傷つきやすかった。<br>「テラ」が大地を震わせる低音衝撃波——HP ×1.35、範囲 ×1.2、重装。<br><span class="cv-note">声 — 春猿火</span>',
    },
    stats: { hp: 135, speed: 135, dmg: 1.05, cd: 1.1, area: 1.2, xp: 1.0 },
  },
  {
    id: 'isekaijoucho',
    name: '夜河 世界', short: '世界', reading: 'ヨルカワ セカイ', romaji: 'YORUKAWA SEKAI',
    cv: 'ヰ世界情緒', cvEn: 'ISEKAI JOUCHO',
    area: 'area3',
    color: '#ede6da', color2: '#2038c0',
    weapon: 'laser',
    desc: {
      zh: '参番街（農園地区）出身，天生拥有<b>预知未来</b>之力、意志坚定。被魔女崇拝教団「<b>ヰ世界救済教団</b>」奉为<b>活神</b>，教団是她必须回去救援的地方。<br>描摹「キミ消失セカイ」的贯穿光束——冷却 ×0.85、攻击 ×1.05。<br><span class="cv-note">声 — ヰ世界情緒</span>',
      en: 'From Area 3 (Farmlands), born with the power to <b>foresee the future</b> and an unshakable will. The witch-worshipping "Issekai Salvation Order" reveres her as a <b>living god</b> — the order is the home she must return to save.<br>A piercing beam tracing "Kimi Shometsu Sekai": Cooldown ×0.85, Atk ×1.05.<br><span class="cv-note">CV — ISEKAI JOUCHO</span>',
      ja: '参番街（農園地区）出身。生まれながら<b>未来を予知</b>する力を持ち、意志は揺るがない。魔女崇拝教団「<b>ヰ世界救済教団</b>」に<b>生き神</b>として奉られる。<br>「キミ消失セカイ」をなぞる貫通光束——クールタイム ×0.85、攻撃 ×1.05。<br><span class="cv-note">声 — ヰ世界情緒</span>',
    },
    stats: { hp: 90, speed: 150, dmg: 1.05, cd: 0.85, area: 1.1, xp: 1.0 },
  },
  {
    id: 'koko',
    name: '輪廻 此処', short: '此処', reading: 'リンネ ココ', romaji: 'RINNE KOKO',
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
    name: '天祢 亜留', short: '亜留', reading: 'アマネ アル', romaji: 'AMANE ARU',
    cv: '存流', cvEn: 'aru',
    area: 'area3',
    color: '#8fa8ff', color2: '#2a3a8f',
    weapon: 'prayer',
    desc: {
      zh: '参番街「ヰ世界救済教団」的教徒，被列为<b>魔女候補</b>——阶位低于魔女之子，却已能歌唱。<br>以祈祷为武器：「救済の鐘」化作震颤的钟声冲击环。HP ×1.1、范围 ×1.1。<br><span class="cv-note">声 — 存流</span>',
      en: 'An acolyte of the Issekai Salvation Order in Area 3, ranked a <b>witch candidate</b> — below the witchlings, yet already able to sing.<br>Her weapon is prayer: "Bell of Salvation" rings out as a quaking shockwave. HP ×1.1, Area ×1.1.<br><span class="cv-note">CV — aru</span>',
      ja: '参番街「ヰ世界救済教団」の教徒にして<b>魔女候補</b>——魔女の娘より下の階位だが、すでに歌える。<br>祈りを武器に、「救済の鐘」が衝撃環となって響く。HP ×1.1、範囲 ×1.1。<br><span class="cv-note">声 — 存流</span>',
    },
    stats: { hp: 110, speed: 142, dmg: 1.05, cd: 1.0, area: 1.1, xp: 1.05 },
    /* 招募条件：通关参番街（教団的据点）＋ 培养费（市民票） */
    unlock: { area: 'area3', cost: 30, desc: { zh: '通关参番街后加入', en: 'Joins after clearing Area 3', ja: '参番街クリアで加入' } },
  },
  {
    id: 'asu',
    recruit: true,
    name: '地邑 阿栖', short: '阿栖', reading: 'チムラ アス', romaji: 'CHIMURA ASU',
    cv: '明透', cvEn: 'asu',
    area: 'area3',
    color: '#c47f00', color2: '#005110',
    weapon: 'follow',
    desc: {
      zh: '教团教徒、<b>亜留的妹分</b>，同为魔女候補。<br>追随的歌声化作「追唱の矢」——贯穿敌列的连射。拾取 ×1.3、攻击 ×1.1。<br><span class="cv-note">声 — 明透</span>',
      en: 'An acolyte and <b>Aru\'s protégée</b>, likewise a witch candidate.<br>Her following song becomes "Arrows of the Refrain" — piercing volleys. Pickup ×1.3, Atk ×1.1.<br><span class="cv-note">CV — asu</span>',
      ja: '教団の教徒で<b>亜留の妹分</b>、同じく魔女候補。<br>追従の歌が「追唱の矢」となり敵列を貫く。取得 ×1.3、攻撃 ×1.1。<br><span class="cv-note">声 — 明透</span>',
    },
    stats: { hp: 95, speed: 152, dmg: 1.1, cd: 0.95, area: 1.0, xp: 1.1, pickup: 1.3 },
    /* 招募条件：復興率 55% ＋ 培养费（市民票） */
    unlock: { fukkou: 55, cost: 45, desc: { zh: '復興率达到 55% 后加入', en: 'Joins at 55% restoration', ja: '復興率 55% で加入' } },
  },
];
/* 可操作角色（含招募角色）查询 */
KUP.CHAR = id => KUP.CHARS.find(c => c.id === id) || KUP.CHARS[0];
KUP.charUnlockText = c => (c.unlock && c.unlock.desc) || null;

/* ---------- 武器（歌＝魔法） ----------
 * ★ v0.11「武装解锁」：owner ＝ 该武器的持有角色 id（KUP.CHARS）。
 *   - **未招募该角色前，这把武器不会进入升级卡池**（rollChoices 过滤，见 game.js）；
 *   - 招募后该角色的专属武器才会作为「新武器」出现在三选一里；
 *   - owner 为 null/undefined 的武器（通用组：滞留・投掷系等）任何角色都能抽到。
 * ★ v0.12「角度参数化」：等级表可带**角度／长度**参数，由行为分派消费：
 *   - slash：「近战·挥刀」——arc＝扇形角度（**度**）、len＝刀长（px）；
 *              Lv4+ 的 wave｛arc（度）/r/speed/dmgMul｝＝扇形冲击波（复用 Ring 的角度参数）。
 *   - bass ：「圆形波」——arc＝扇形角度（**度**，缺省 360＝整圆，既有武器不变）；
 *              传入 <360 即变为**定向扇形冲击波**（dir 取当前瞄准方向）。 */
KUP.WEAPONS = {
  note: {
    id: 'note', icon: '♪', color: '#4ee6ff', behavior: 'note', maxLv: 5, owner: 'kaf',
    name: { zh: '分形音符', en: 'Fractal Note', ja: 'フラクタル・ノート' },
    desc: {
      zh: '声之代表曲「わたしの声」化作追尾敌人的音符。森先化歩的初期武装。',
      en: 'The signature song "Watashi no Koe" becomes notes that chase down enemies. MORISAKI KAFU\'s starting weapon.',
      ja: '声の代表曲「わたしの声」が音符と化して敵を追尾する。森先化歩の初期武装。',
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
      zh: '声之代表曲「食虫植物」般环绕捕食的音球。谷置狸眼的初期武装。<br><span class="cv-note">体积随「范围」、转速随「冷却」成长</span>',
      en: 'Orbs that orbit and devour like "Shokuchuu Shokubutsu". TANIOKI RIME\'s starting weapon.<br><span class="cv-note">Radius scales with Area, spin with Cooldown</span>',
      ja: '声の代表曲「食虫植物」の如く敵を捕らえる音球。谷置狸眼の初期武装。<br><span class="cv-note">旋回半径は「範囲」、回転速度は「クールダウン」で伸びる</span>',
    },
    lvDesc: [
      { zh: '音球 ×2，接触伤害并击退。', en: '2 orbs; contact damage and knockback.', ja: '音球 ×2、接触ダメージとノックバック。' },
      { zh: '音球 ×3。', en: '3 orbs.', ja: '音球 ×3。' },
      { zh: '音球 ×3，旋转范围与转速提升。', en: '3 orbs, wider and faster orbit.', ja: '音球 ×3、旋回範囲と回転速度アップ。' },
      { zh: '音球 ×4，伤害提升。', en: '4 orbs, more damage.', ja: '音球 ×4、ダメージアップ。' },
      { zh: '音球 ×6 —— 捕食领域全面展开。', en: '6 orbs — the predatory field unfolds.', ja: '音球 ×6 —— 捕食領域が全面展開。' },
    ],
    levels: [
      { dmg: 9, count: 2, r: 84, spin: 2.4 },
      { dmg: 10, count: 3, r: 84, spin: 2.5 },
      { dmg: 11, count: 3, r: 100, spin: 3.0 },
      { dmg: 14, count: 4, r: 104, spin: 3.3 },
      { dmg: 17, count: 6, r: 112, spin: 3.7 },
    ],
    evolved: {
      name: { zh: '食虫植物 -devour-', en: 'Shokuchuu Shokubutsu -Devour-', ja: '食虫植物 -devour-' },
      desc: {
        zh: '覚醒——「食虫植物」的捕食领域全面张開，八枚音球环噬。',
        en: 'Awakened — the carnivorous field unfolds; eight orbs devour all.',
        ja: '覚醒——「食虫植物」の捕食領域が全面展開、八つの音球が环噬する。',
      },
      stats: { dmg: 20, count: 8, r: 128, spin: 4.2 },
    },
  },
  bass: {
    id: 'bass', icon: '低', color: '#ffb25a', behavior: 'bass', maxLv: 5, owner: 'harusaruhi',
    name: { zh: '泰拉坠击', en: 'Terra Drop', ja: 'テラ・ドロップ' },
    desc: {
      zh: '令大地震颤的低音冲击波，取自声之代表曲「テラ」。朝主派流的初期武装。',
      en: 'A bass shockwave that quakes the earth, from "Terra". ASANUSHI HARU\'s starting weapon.',
      ja: '大地を震わせる低音衝撃波、声の代表曲「テラ」より。朝主派流の初期武装。',
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
      zh: '贯穿敌列的音之枪击，取自声之代表曲「the last bullet」。輪廻此処的初期武装。',
      en: 'Piercing sonic gunfire from "the last bullet". RINNE KOKO\'s starting weapon.',
      ja: '声の代表曲「the last bullet」より、敵列を貫く音の銃撃。輪廻此処の初期武装。',
    },
    lvDesc: [
      { zh: '朝移动方向射出 2 发贯穿音枪。', en: 'Fires 2 piercing lances toward your movement.', ja: '移動方向へ貫通音槍 ×2 を発射。' },
      { zh: '音枪 ×3。', en: '3 lances.', ja: '音槍 ×3。' },
      { zh: '贯穿数 +1。', en: 'Pierce +1.', ja: '貫通数 +1。' },
      { zh: '音枪 ×4，伤害提升。', en: '4 lances, more damage.', ja: '音槍 ×4、ダメージアップ。' },
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
      zh: '描摹声之代表曲「キミ消失セカイ」的贯穿光束。夜河世界的初期武装。',
      en: 'A piercing beam tracing "Kimi Shometsu Sekai". YORUKAWA SEKAI\'s starting weapon.',
      ja: '声の代表曲「キミ消失セカイ」をなぞる貫通光束。夜河世界の初期武装。',
    },
    lvDesc: [
      { zh: '朝最近的怪异发射贯穿光束。', en: 'Fires a piercing beam at the nearest aberration.', ja: '最寄りの異形へ貫通ビームを発射。' },
      { zh: '光束加宽，伤害提升。', en: 'Wider beam, more damage.', ja: 'ビームが太くなり、ダメージアップ。' },
      { zh: '光束延长。', en: 'Longer beam.', ja: 'ビームが長くなる。' },
      { zh: '伤害大幅提升。', en: 'Much more damage.', ja: 'ダメージが大幅アップ。' },
      { zh: '光束 ×2 —— 消失于世界的彼端。', en: '2 beams — vanish beyond the world.', ja: 'ビーム ×2 —— 世界の彼端へ消える。' },
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
      zh: '教团的祈祷化作钟声冲击环。天祢亜留的初期武装（本作同人命名）。',
      en: 'The order\'s prayer becomes a bell-like shockwave. AMANE ARU\'s starting weapon (fan-made naming).',
      ja: '教団の祈りが鐘の衝撃環となる。天祢亜留の初期武装（本作同人命名）。',
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
      zh: '追随的歌声化作贯穿之矢。地邑阿栖的初期武装（本作同人命名）。',
      en: 'A following song becomes piercing arrows. CHIMURA ASU\'s starting weapon (fan-made naming).',
      ja: '追従の歌が貫通の矢となる。地邑阿栖の初期武装（本作同人命名）。',
    },
    lvDesc: [
      { zh: '朝移动方向射出 2 支贯穿之矢。', en: 'Fires 2 piercing arrows toward your movement.', ja: '移動方向へ貫通の矢 ×2 を発射。' },
      { zh: '之矢 ×3。', en: '3 arrows.', ja: '矢 ×3。' },
      { zh: '贯穿数 +1。', en: 'Pierce +1.', ja: '貫通数 +1。' },
      { zh: '之矢 ×4，伤害提升。', en: '4 arrows, more damage.', ja: '矢 ×4、ダメージアップ。' },
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
      zh: '自动投掷音块到最近的怪异，落点留下<b>滞留音场</b>持续伤害。近距离投掷物（本作同人命名）。',
      en: 'Auto-throws sound bricks at the nearest aberration; the impact leaves a <b>lingering sound field</b> that keeps damaging. A short-range thrown weapon (fan-made).',
      ja: '最寄りの異形へ音塊を自動投擲し、着地点に<b>残響音場</b>を残して持続ダメージ。近距離投擲武器（本作同人命名）。',
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
      zh: '在自身周围<b>随机落点</b>降下音爆，短暂延迟后引爆。范围大、位置不可控（本作同人命名）。',
      en: 'Drops sound bombs at <b>random spots</b> around you, detonating after a short fuse. Wide area, no aim control (fan-made).',
      ja: '自身の周囲の<b>無作為な地点</b>へ音爆を落とし、短い信管の後に起爆。広範囲・着弾は運任せ（本作同人命名）。',
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
    /* vis ＝ **显示缩放**（判定与作用范围不受影响）：地雷画得小一圈，
     * 免得整片雷区看起来像一堆大音场盖住地图（人类 2026-10-16 反馈「显示改为四分之一大」）。
     * 0.5 线性 ＝ 面积 1/4。 */
    vis: 0.5,
    name: { zh: '音之地雷', en: 'Sound Mine', ja: '音の地雷' },
    desc: {
      zh: '在身后<b>放置</b>滞留音雷，敌人触碰即引爆。适合边退边打（本作同人命名）。',
      en: 'Plants <b>lingering sound mines</b> behind you; they detonate when enemies touch them. Ideal while retreating (fan-made).',
      ja: '後方に<b>残響の音雷</b>を設置し、敵が触れると起爆。後退しながら戦うのに向く（本作同人命名）。',
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
      zh: '挥出的歌声化作一振太刀——朝瞄准方向挥出<b>扇形斩击</b>，命中即击退。近战武器（本作同人命名）。<br><span class="cv-note">扇形角度与刀长均可在数据表中调整</span>',
      en: 'Your song sharpens into a single blade — a <b>fan-shaped slash</b> is swung toward your aim, knocking enemies back. A melee weapon (fan-made).<br><span class="cv-note">Fan angle and blade length are data parameters</span>',
      ja: '歌が一振りの太刀となる——照準方向へ<b>扇形の斬撃</b>を放ち、命中した敵をノックバック。近接武器（本作同人命名）。<br><span class="cv-note">扇形角度と刀長はデータ表で調整可能</span>',
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
  shield: {
    icon: '盾', color: '#8fd0ff', maxLv: 5,
    name: { zh: '防音护盾', en: 'Soundproof Shield', ja: '防音シールド' },
    desc: {
      zh: '歌声化作护膜——获得 <b>+22 护盾</b>／级；4 秒未受伤后自动回复。',
      en: 'Song becomes a membrane — <b>+22 shield</b> per level; it recharges after 4s without damage.',
      ja: '歌が膜となる——<b>+22 シールド</b>／レベル。4 秒間無傷で自動回復。',
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
      zh: '吸走怪异的余音——击破时回复最大生命的 <b>0.6%</b>／级（精英×4、Boss×10）。',
      en: 'Drink the aberration\'s afterglow — heal <b>0.6%</b> max HP per level on kill (×4 elite, ×10 boss).',
      ja: '異形の余音を吸う——撃破時、最大生命の <b>0.6%</b>／レベル回復（精英 ×4・Boss ×10）。',
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
  ward: {
    id: 'ward', icon: '盾', color: '#8fd0ff', kind: 'shield', amount: 60,
    name: { zh: '防音の符', en: 'Ward of Silence', ja: '防音の符' },
    desc: {
      zh: '歌声凝成护膜——<b>立即获得 +60 护盾</b>（可暂时超过护盾上限）。',
      en: 'Song condenses into a membrane — <b>+60 shield now</b> (may exceed the cap temporarily).',
      ja: '歌が膜となる——<b>即座に +60 シールド</b>（一時的に上限を超えられる）。',
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
      zh: '歌声凝霜——<b>全场怪异 2.6 秒完全僵直（冷冻）</b>：不动、不攻击、无接触伤害。<br><span class="cv-note">Boss 减免为 50%、精英 75%</span>',
      en: 'Your song frosts over — <b>every aberration is frozen solid for 2.6s</b>: no movement, no attacks, no contact damage.<br><span class="cv-note">Bosses 50%, elites 75% duration</span>',
      ja: '歌が霜となる——<b>場の異形すべてを 2.6 秒完全に凍結</b>：移動・攻撃・接触ダメージなし。<br><span class="cv-note">Boss は 50%、精英は 75% の時間</span>',
    },
  },
  bind: {
    id: 'bind', icon: '鈍', color: '#8fd0ff', kind: 'slow', amount: 0.5, seconds: 8,
    name: { zh: '鈍足の符', en: 'Ward of Sloth', ja: '鈍足の符' },
    desc: {
      zh: '歌声变得黏重——<b>全场怪异 8 秒减速至 50%</b>（可与滞留音场的减速叠加，取最强）。',
      en: 'Your song turns thick — <b>every aberration is slowed to 50% for 8s</b> (stacks with lingering fields, strongest wins).',
      ja: '歌が粘る——<b>場の異形すべてを 8 秒間 50% に減速</b>（残響音場の減速と重ねがけ、強い方が適用）。',
    },
  },
};
KUP.ITEM = id => KUP.ITEMS[id] || null;

/* ---------- 敌人（テセラクター：人之恶意所生的怪异） ----------
 * turn ＝ **角速度上限（度/秒）**：敌人朝向以它为上限转向「可走方向」（见
 * js/game.js steerCity 与 js/entities.js Enemy.update）。单位按本仓库数据表
 * 约定用「度」，运行时以 DEG 换算；大体型转得慢 ⇒ tank/elite/Boss 绕圈时更笨重。
 * 未写 turn 的条目回落到 CONFIG.NAV.TURN。 */
KUP.ENEMIES = {
  noise: {
    id: 'noise',
    name: { zh: 'テセラクター（基本型）', en: 'Tesseracter (Basic)', ja: 'テセラクター（基本型）' },
    hp: 10, speed: 62, dmg: 8, xp: 1, r: 12, color: '#8d94b8', sides: 7, turn: 600,
  },
  glitch: {
    id: 'glitch',
    name: { zh: 'テセラクター（高速型）', en: 'Tesseracter (Swift)', ja: 'テセラクター（高速型）' },
    hp: 7, speed: 108, dmg: 6, xp: 2, r: 9, color: '#55e0ff', sides: 5, turn: 900,
  },
  tank: {
    id: 'tank',
    name: { zh: 'テセラクター（巨躯型）', en: 'Tesseracter (Bulwark)', ja: 'テセラクター（巨躯型）' },
    hp: 60, speed: 34, dmg: 18, xp: 6, r: 20, color: '#c2507e', sides: 8, turn: 300,
  },
  elite: {
    id: 'elite',
    name: { zh: '異能テセラクター', en: 'Aberrant Tesseracter', ja: '異能テセラクター' },
    hp: 260, speed: 74, dmg: 16, xp: 30, r: 26, color: '#ffab5e', sides: 6, elite: true, turn: 450,
  },
  boss: {
    id: 'boss',
    name: { zh: '大テセラクター〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true, turn: 380,
  },
};

/* ---------- 记忆片段（記憶の卵 ★ 动画第6話解锁的记忆图鉴） ----------
 * 拾取記憶の卵 → 按顺序解锁一条；全部世界观依据见 docs/lore/worldview.md。 */
KUP.FRAGMENTS = [
  {
    id: 'witchling',
    title: { zh: '魔女の娘 -Witchling-', en: 'Witchling', ja: '魔女の娘 -Witchling-' },
    text: {
      zh: '五人的魔女之子住在废墟之中，却仍在歌唱——V.W.P 的歌声，是这座城市最后的照明。',
      en: 'Five witchlings live among the ruins, yet still sing — the songs of V.W.P are the city\'s last light.',
      ja: '五人の魔女の娘は廃墟に住み、それでも歌う——V.W.P の歌声は、この街最後の照明だ。',
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
    text: {
      zh: '与魔女结盟的使魔「ファミリア」——它们同时仍是異能破维魔。敌与友，一线之隔。',
      en: 'The familiars allied with witches — yet they remain aberrant Tesseracters. Foe and friend, one line apart.',
      ja: '魔女と盟した使い魔「ファミリア」——しかし同時に異能テセラクターでもある。敵と味方は紙一重。',
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
 * ★ 2026-10 修正：（见上方 KUP.CHARS 的 aru／asu），
 *   同行支援层改用——REGENERATE 官方页给出的
 *   「肆番街相遇的少女，復興課课员」【官方】，同样需要（通关肆番街）后才能在选人界面带出。
 * perk 为同行效果；皮肤（KUP.FORMS kind='companion'）另加少量修正。 */
KUP.COMPANIONS = [
  {
    id: 'ciel',
    name: '彩季 詩得', reading: 'サイキ シエル', romaji: 'SAIKI SHIERU',
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
    /* 招募条件：通关肆番街（復興課的活动区域）＋ 招募费（市民票） */
    unlock: { area: 'area4', cost: 40, desc: { zh: '通关肆番街后加入', en: 'Joins after clearing Area 4', ja: '肆番街クリアで加入' } },
  },
];
KUP.COMPANION = id => KUP.COMPANIONS.find(c => c.id === id) || null;
/* 兼容别名（旧调用） */
KUP.RECRUITS = KUP.COMPANIONS;
KUP.RECRUIT = KUP.COMPANION;

/* ---------- 皮肤＝「形態」（★ 官方命名法：「（魔女）特殊歌唱用形態 ○○」） ----------
 * 官方 LIVE 的服装/形态命名实例：「特殊歌唱用形態 星鴉」「魔女特殊歌唱用形態 花魁鳥」（粉丝 wiki 转引官方命名）。
 * ⚠️ 泛称「歌唱形態」；本作一律用「（魔女）特殊歌唱用形態 ○○」。
 * 本批形态（2026-10）：
 *   - 魔女之子（kinds:['witch']）：花魁鳥／姬連雀 —— 本批共用；
 *   - 可招募角色·魔女候補（kinds:['recruit']）：黑／白 —— 暂定名；后续每位分别定制
 *   - 同伴（kinds:['companion']）：黑／白 —— 与候选共用调色板，后续为每位同伴定制
 * 实现方式：。
 *   accent: plume 羽饰 / crest 冠羽 / veil 面纱 / halo 光晕 / none
 *   → 比纯颜色更可辨（轮廓差异），且：
 *     只需在 Player._accent 与同伴绘制处按 form.accent 分支，或改读 form.sprite。 */
KUP.FORMS = [
  {
    id: 'none', kinds: null, accent: 'none',
    name: { zh: '通常形態', en: 'Standard Form', ja: '通常形態' },
    label: { zh: '無指定（通常形態）', en: 'Standard (no form)', ja: '指定なし（通常形態）' },
    desc: { zh: '不指定特殊歌唱用形態。', en: 'No special singing form equipped.', ja: '特殊歌唱用形態を指定しない。' },
    mods: {},
  },
  /* ---- 魔女之子（witch） ---- */
  {
    id: 'ouranchou', kinds: ['witch'], accent: 'plume',
    name: { zh: '花魁鳥', en: 'Oiran-chō', ja: '花魁鳥' },
    label: { zh: '魔女特殊歌唱用形態 花魁鳥', en: 'Witch Special Singing Form: Oiran-chō', ja: '魔女特殊歌唱用形態 花魁鳥' },
    desc: { zh: '华美的花魁之羽——舞台中心的高歌。<br>攻击范围 +15%、冷却 -8%，最大生命 -8%。', en: 'The gorgeous plumage of the oiran — a song for center stage.<br>Area +15%, cooldown -8%, max HP -8%.', ja: '華やかな花魁の羽——舞台中央の高歌。<br>範囲 +15%、クールタイム -8%、最大生命 -8%。' },
    mods: { area: 1.15, cd: 0.92, hp: 0.92 },
    color: '#ff7ad9', color2: '#8a1f52',
    src: { zh: '官方 LIVE 形态命名（粉丝 wiki 转引）', en: 'Official live-form naming (fan-wiki transcript)', ja: '公式 LIVE の形態命名（ファンwiki 転引）' },
  },
  {
    id: 'himerenjaku', kinds: ['witch'], accent: 'crest',
    name: { zh: '姬連雀', en: 'Hime-renjaku', ja: '姫連雀' },
    label: { zh: '魔女特殊歌唱用形態 姬連雀', en: 'Witch Special Singing Form: Hime-renjaku', ja: '魔女特殊歌唱用形態 姫連雀' },
    desc: { zh: '轻盈的连雀之羽——游走的低语。<br>移动速度 +12%、拾取范围 +20%、经验 +8%，攻击 -5%。', en: 'The light plumage of the waxwing — a wandering whisper.<br>Move speed +12%, pickup +20%, XP +8%, Atk -5%.', ja: '軽やかな連雀の羽——遊走の囁き。<br>移動速度 +12%、取得 +20%、経験 +8%、攻撃 -5%。' },
    mods: { speed: 1.12, pickup: 1.2, xp: 1.08, dmg: 0.95 },
    color: '#8affc9', color2: '#0f6b52',
    src: { zh: '本作同人命名（官方无此形态名）', en: 'Fan-made naming (no official form of this name)', ja: '本作の同人命名（公式にこの形態名はない）' },
  },
  /* ---- 可招募角色（魔女候補）与同伴：皮肤暂定「黑」「白」 ---- */
  {
    id: 'kuro', kinds: ['recruit'], accent: 'veil',
    name: { zh: '黑', en: 'Black', ja: '黒' },
    label: { zh: '皮膚「黑」（暫定）', en: 'Skin "Black" (tentative)', ja: '皮膚「黒」（暫定）' },
    desc: { zh: '夜之装束——歌声更加锐利。<br>攻击 +6%。', en: 'Night vestment — a sharper song.<br>Atk +6%.', ja: '夜の装い——歌はより鋭く。<br>攻撃 +6%。' },
    mods: { playerDmg: 1.06 },
    color: '#4a4a63', color2: '#12121c',
    src: { zh: '本作暂定皮肤（黑／白）', en: 'Tentative skin (Black/White) original to this work', ja: '本作の暫定皮膚（黒／白）' },
  },
  {
    id: 'shiro', kinds: ['recruit'], accent: 'halo',
    name: { zh: '白', en: 'White', ja: '白' },
    label: { zh: '皮膚「白」（暫定）', en: 'Skin "White" (tentative)', ja: '皮膚「白」（暫定）' },
    desc: { zh: '昼之装束——歌声更易牵引音片。<br>拾取范围 +15%。', en: 'Day vestment — a song that gathers shards.<br>Pickup +15%.', ja: '昼の装い——歌が音片を引き寄せる。<br>取得 +15%。' },
    mods: { pickup: 1.15 },
    color: '#f2f0ff', color2: '#a9b6d8',
    src: { zh: '本作暂定皮肤（黑／白）', en: 'Tentative skin (Black/White) original to this work', ja: '本作の暫定皮膚（黒／白）' },
  },
  /* ---- 同伴（彩季詩得）：JK 制服（2026-10 改定；后续每位同伴分别定制） ---- */
  {
    id: 'jk_summer', kinds: ['companion'], accent: 'sailor',
    name: { zh: 'JK制服・夏服', en: 'JK Uniform · Summer', ja: 'JK制服・夏服' },
    label: { zh: 'JK制服（夏服）—— 白襟水手服', en: 'JK uniform (summer) — white sailor collar', ja: 'JK制服（夏服）——白襟セーラー' },
    desc: {
      zh: '復興課的夏季制服——白襟水手服。<br>拾取范围 <b>+10%</b>、移动速度 <b>+5%</b>。',
      en: 'The Division\'s summer uniform — a white sailor collar.<br>Pickup <b>+10%</b>, move speed <b>+5%</b>.',
      ja: '復興課の夏制服——白襟セーラー。<br>取得 <b>+10%</b>、移動速度 <b>+5%</b>。',
    },
    mods: { pickup: 1.1, speed: 1.05 },
    color: '#eaf4ff', color2: '#2f5fa8',
    src: { zh: '本作设定（JK 制服；后续每位同伴分别定制）', en: 'Original to this work (JK uniform; per-companion designs later)', ja: '本作設定（JK制服。後日、同行ごとに個別デザイン）' },
  },
  {
    id: 'jk_winter', kinds: ['companion'], accent: 'blazer',
    name: { zh: 'JK制服・冬服', en: 'JK Uniform · Winter', ja: 'JK制服・冬服' },
    label: { zh: 'JK制服（冬服）—— 深蓝西装外套', en: 'JK uniform (winter) — navy blazer', ja: 'JK制服（冬服）——紺ブレザー' },
    desc: {
      zh: '復興課的冬季制服——深蓝西装外套。<br>最大生命 <b>+6%</b>、全部冷却 <b>−3%</b>。',
      en: 'The Division\'s winter uniform — a navy blazer.<br>Max HP <b>+6%</b>, all cooldowns <b>−3%</b>.',
      ja: '復興課の冬制服——紺ブレザー。<br>最大生命 <b>+6%</b>、全クールダウン <b>−3%</b>。',
    },
    mods: { hp: 1.06, cd: 0.97 },
    color: '#f6f1e6', color2: '#1d2a52',
    src: { zh: '本作设定（JK 制服；后续每位同伴分别定制）', en: 'Original to this work (JK uniform; per-companion designs later)', ja: '本作設定（JK制服。後日、同行ごとに個別デザイン）' },
  },
];
KUP.FORM = id => KUP.FORMS.find(f => f.id === id) || KUP.FORMS[0];
/* 形态是否适用于某持有者类型（kinds 为 null ＝ 通用） */
KUP.formFits = (f, kind) => !f.kinds || f.kinds.indexOf(kind) >= 0;
/* 按持有者类型取可用形态（含通用的「通常形態」）
 * kind: 'witch'（魔女之子）| 'recruit'（可招募角色·魔女候補）| 'companion'（同伴） */
KUP.formsFor = kind => KUP.FORMS.filter(f => KUP.formFits(f, kind));
/* 角色（含招募角色）对应的皮肤类型 */
KUP.charKind = c => (c && c.recruit) ? 'recruit' : 'witch';

/* ========== 关卡 Boss：每番街一体（2026-10 追加） ==========
 * ⚠️ 全部为**本作二创**的大テセラクター名（〈消音〉已是本作自拟；其余同）；
 *    命名取自各番街的官方定位/章节副标题的意象，不涉官方未公开设定。
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
    name: { zh: '大テセラクター〈消音〉', en: 'Grand Tesseracter 〈Mute〉', ja: '大テセラクター〈消音〉' },
    hp: 2000, speed: 46, dmg: 24, xp: 0, r: 52, color: '#ff5aa8', sides: 9, boss: true,
  },
  boss1: {
    id: 'boss1', pattern: 'chase',
    name: { zh: '大テセラクター〈緘黙〉', en: 'Grand Tesseracter 〈Taciturn〉', ja: '大テセラクター〈緘黙〉' },
    hp: 2200, speed: 42, dmg: 26, xp: 0, r: 50, color: '#55e0ff', sides: 6, boss: true,
  },
  boss2: {
    id: 'boss2', pattern: 'swarm',
    name: { zh: '大テセラクター〈誘惑〉', en: 'Grand Tesseracter 〈Temptation〉', ja: '大テセラクター〈誘惑〉' },
    hp: 2400, speed: 48, dmg: 25, xp: 0, r: 52, color: '#ff7ad9', sides: 7, boss: true,
  },
  boss3: {
    id: 'boss3', pattern: 'blight',
    name: { zh: '大テセラクター〈枯死〉', en: 'Grand Tesseracter 〈Blight〉', ja: '大テセラクター〈枯死〉' },
    hp: 2600, speed: 34, dmg: 24, xp: 0, r: 56, color: '#7dff6a', sides: 8, boss: true,
  },
  boss4: {
    id: 'boss4', pattern: 'scan',
    name: { zh: '大テセラクター〈観測〉', en: 'Grand Tesseracter 〈Observation〉', ja: '大テセラクター〈観測〉' },
    hp: 2800, speed: 44, dmg: 26, xp: 0, r: 54, color: '#b58cff', sides: 10, boss: true,
  },
  boss5: {
    id: 'boss5', pattern: 'smog',
    name: { zh: '大テセラクター〈爆塵〉', en: 'Grand Tesseracter 〈Smog〉', ja: '大テセラクター〈爆塵〉' },
    hp: 3000, speed: 40, dmg: 28, xp: 0, r: 56, color: '#ffb25a', sides: 6, boss: true,
  },
  boss6: {
    id: 'boss6', pattern: 'regen',
    name: { zh: '大テセラクター〈再生〉', en: 'Grand Tesseracter 〈Regenerate〉', ja: '大テセラクター〈再生〉' },
    hp: 3600, speed: 48, dmg: 30, xp: 0, r: 60, color: '#8fd0ff', sides: 12, boss: true,
  },
};
KUP.BOSS = id => KUP.BOSSES[id] || KUP.BOSSES.boss0;
/* 7 体 Boss 一律笨重（380°/s，与 ENEMIES.boss 同值）：它们是「大テセラクター」，
 * 转身不该比小怪灵活——逐个手写 7 份没有意义，故在此统一赋值（见顶部 turn 说明）。 */
for (const k in KUP.BOSSES) if (KUP.BOSSES[k].turn == null) KUP.BOSSES[k].turn = 380;
/* 把各番街 Boss 并入敌人表（spawnEnemy 统一按 id 生成；boss0 与 KUP.ENEMIES.boss 同源） */
for (const k in KUP.BOSSES) KUP.ENEMIES[k] = KUP.BOSSES[k];
KUP.ENEMIES.boss = KUP.BOSSES.boss0;

/* ========== 瓦利斯（VALIS 的饭店）· 局外强化（2026-10 追加） ==========
 * ★ 出处：REGENERATE 官方页——**弐番街「歌と中華料理の店・瓦利欺」**，VALIS 六人店员（白銀千埜店長 等）【官方】。
 * ※ 表记约定：**日语原文（ja 文案、官方引述）保留官方当て字「瓦利欺」**；**中文（zh 文案）写作「瓦利斯」**。
 * 本作把它作为**局外强化商店**：用**市民票**（REGENERATE 术语）购买**小幅**永久强化。
 * cost(lv) = base + lv * inc（lv 从 0 起算） */
KUP.SHOP = [
  {
    id: 'bun', icon: '包', maxLv: 5, base: 8, inc: 6, mods: { hp: 1.03 },
    name: { zh: '中华馒头', en: 'Steamed Bun', ja: '中華まん' },
    desc: { zh: '温暖的一个。最大生命 <b>+3%</b>／级。', en: 'One warm bun. Max HP <b>+3%</b> per level.', ja: '温かいひとつ。最大生命 <b>+3%</b>／レベル。' },
  },
  {
    id: 'subuta', icon: '酢', maxLv: 5, base: 10, inc: 7, mods: { playerDmg: 1.02 },
    name: { zh: '糖醋里脊', en: 'Sweet & Sour Pork', ja: '酢豚' },
    desc: { zh: '酸味让歌声更锐利。全部伤害 <b>+2%</b>／级。', en: 'The sourness sharpens the song. All damage <b>+2%</b> per level.', ja: '酸味が歌を尖らせる。全ダメージ <b>+2%</b>／レベル。' },
  },
  {
    id: 'annin', icon: '杏', maxLv: 5, base: 8, inc: 5, mods: { pickup: 1.06 },
    name: { zh: '杏仁豆腐', en: 'Almond Jelly', ja: '杏仁豆腐' },
    desc: { zh: '温柔的甜味。拾取范围 <b>+6%</b>／级。', en: 'Gentle sweetness. Pickup range <b>+6%</b> per level.', ja: '優しい甘さ。取得範囲 <b>+6%</b>／レベル。' },
  },
  {
    id: 'gyoza', icon: '餃', maxLv: 5, base: 9, inc: 6, mods: { speed: 1.02 },
    name: { zh: '饺子', en: 'Dumplings', ja: '餃子' },
    desc: { zh: '面皮有弹性。移动速度 <b>+2%</b>／级。', en: 'A springy bite. Move speed <b>+2%</b> per level.', ja: '皮の張り。移動速度 <b>+2%</b>／レベル。' },
  },
  {
    id: 'shokoshu', icon: '酒', maxLv: 5, base: 12, inc: 8, mods: { cd: 0.98 },
    name: { zh: '绍兴酒', en: 'Shaoxing Wine', ja: '紹興酒' },
    desc: { zh: '一盅的余韵。全部冷却 <b>−2%</b>／级。', en: 'A shot of afterglow. All cooldowns <b>−2%</b> per level.', ja: '一献の余韻。全クールダウン <b>−2%</b>／レベル。' },
  },
  {
    id: 'lazy', icon: '回', maxLv: 5, base: 11, inc: 7, mods: { xp: 1.04 },
    name: { zh: '回转台', en: 'Lazy Susan', ja: '回転テーブル' },
    desc: { zh: '音片转着圈来。经验 <b>+4%</b>／级。', en: 'The shards come around. XP <b>+4%</b> per level.', ja: '音片が回ってくる。経験 <b>+4%</b>／レベル。' },
  },
  {
    id: 'sign', icon: '看', maxLv: 3, base: 16, inc: 10, mods: { startUlt: 15 },
    name: { zh: '瓦利斯招牌', en: 'VALIS Signboard', ja: '瓦利欺の看板' },
    desc: { zh: '老主顾的证明。开局<b>浄化の歌充能 +15%</b>／级。', en: 'Proof of a regular. <b>Song charge +15%</b> at run start per level.', ja: '常連の証。開局の<b>浄化の歌チャージ +15%</b>／レベル。' },
  },
  {
    id: 'regular', icon: '常', maxLv: 3, base: 20, inc: 12, mods: { startLevel: 1 },
    name: { zh: '老主顾席位', en: "Regular's Table", ja: '常連の席' },
    desc: { zh: '熟面孔的待遇。开局<b>等级 +1</b>／级。', en: 'A familiar face. <b>Starting level +1</b> per level.', ja: '顔なじみ。開局<b>レベル +1</b>／レベル。' },
  },
  {
    id: 'soup', icon: '湯', maxLv: 3, base: 18, inc: 11, mods: { regenAdd: 0.5 },
    name: { zh: '药膳汤', en: 'Medicinal Soup', ja: '薬膳スープ' },
    desc: { zh: '暖汤养声。<b>每秒回复 +0.5 生命</b>／级（与被动叠加）。', en: 'Warm soup for the voice. <b>+0.5 HP/s</b> per level (stacks with passives).', ja: '温かいスープが声を養う。<b>毎秒 +0.5 回復</b>／レベル（被动と加算）。' },
  },
  {
    id: 'instinct', icon: '勘', maxLv: 3, base: 22, inc: 13, mods: { dodgeAdd: 0.03 },
    name: { zh: '常连的直觉', en: "Regular's Instinct", ja: '常連の勘' },
    desc: { zh: '身体先于意识退开。<b>回避（MISS）率 +3%</b>／级（与被动叠加，上限 60%）。', en: 'The body steps aside first. <b>MISS chance +3%</b> per level (stacks, cap 60%).', ja: '身体が先に退く。<b>回避率 +3%</b>／レベル（被动と加算、上限 60%）。' },
  },
];
KUP.SHOP_ITEM = id => KUP.SHOP.find(s => s.id === id) || null;
/* 等级 lv（0 起）→ 下一级价格 */
KUP.shopCost = (item, lv) => item.base + lv * item.inc;
