/* ================= 角色数据域（js/data/char.js） =================
 * 模块 id：char（注册信息见 js/data/manifest.js）
 * 内容：KUP.CHARS（魔女之子／魔女候補）→ KUP.CRIT（会心）→ 语言显示名助手 →
 *       KUP.ULTIMATES（按角色 id 的大招表）。
 * 依赖：本文件不读其它数据域；nameOf／shortOf／cvOf 在**调用时**读 KUP.I18N.lang。
 * 纪律：角色 id 与存档 run.char、武器 owner、形态 char 绑定——**不要改已有 id**。
 * 加角色＝在 CHARS 加一条；加会心＝CRIT 加一条；加大招＝ULTIMATES 加一条（键必须是角色 id）。
 * ================================================================ */

window.KUP = window.KUP || {};

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

/* ---------- 暴击「会心」（v0.18.3）----------
 * 设计（人类 2026-10-21「设计充分又平衡的暴击系统，包含差异化暴击率、强度、
 * UI、特殊触发等」）：
 *   - **差异化的是「手感」不是「总量」**：七位角色的「期望增伤」都被压在
 *     1.08～1.10 之间（期望 = 1 + 会心率 ×（倍率−1）），谁的数值都不白给；
 *     区别在「打得勤但单发小」（此処 22%×1.45）↔「偶尔一发爆炸」（派流 8%×2.10）。
 *   - **特殊触发**：每次会心附带该角色自己的一个特效（见 fx 与 game.onCrit），
 *     让「会心」在画面上有可读的后果，而不只是一个更大的数字。
 *   - 会心只作用于**玩家造成的伤害**（`game.damageEnemy` 是唯一入口），
 *     敌方伤害不会暴击；Boss 的会心倍率另乘 `CONFIG.CRIT.BOSS_MULT`（0.85）。
 *   - 会心率上限 `CONFIG.CRIT.RATE_CAP`（0.6），倍率上限 `MULT_CAP`（3.0）。 */
KUP.CRIT = {
  kaf: {
    rate: 0.12, mult: 1.75, fx: 'echo', fxColor: '#ffd25a',
    name: { zh: '残响', en: 'Reverb', ja: '残響' },
    desc: {
      zh: '会心时追加一次 <b>30%</b> 伤害的小音波。',
      en: 'On a critical hit, echo a small wave for <b>30%</b> damage.',
      ja: '会心時、<b>30%</b> ダメージの小音波を追加。',
    },
  },
  rim: {
    rate: 0.18, mult: 1.55, fx: 'chill', fxColor: '#8affc9',
    name: { zh: '冻弦', en: 'Frost String', ja: '凍弦' },
    desc: {
      zh: '会心使目标减速 <b>45%</b>，持续 <b>1.5 秒</b>。',
      en: 'A critical hit slows the target by <b>45%</b> for <b>1.5s</b>.',
      ja: '会心で対象を <b>45%</b> 減速、<b>1.5 秒</b>。',
    },
  },
  harusaruhi: {
    rate: 0.08, mult: 2.10, fx: 'break', fxColor: '#ff8a4e',
    name: { zh: '破勢', en: 'Break', ja: '破勢' },
    desc: {
      zh: '会心时把目标击退 <b>160</b> 像素。',
      en: 'A critical hit knocks the target back <b>160</b>px.',
      ja: '会心で対象を <b>160</b>px ノックバック。',
    },
  },
  isekaijoucho: {
    rate: 0.15, mult: 1.65, fx: 'star', fxColor: '#c9a6ff',
    name: { zh: '星屑', en: 'Stardust', ja: '星屑' },
    desc: {
      zh: '会心时额外掉落 1 枚 <b>+2 经验</b> 的片段。',
      en: 'A critical hit drops an extra <b>+2 XP</b> fragment.',
      ja: '会心で <b>+2 経験</b> のフラグメントを追加で落とす。',
    },
  },
  koko: {
    rate: 0.22, mult: 1.45, fx: 'charge', fxColor: '#9fe8ff',
    name: { zh: '終結', en: 'Finale', ja: '終結' },
    desc: {
      zh: '会心时浄化の歌充能 <b>+1.5</b>。',
      en: 'A critical hit grants <b>+1.5</b> Song charge.',
      ja: '会心で浄化の歌の充填 <b>+1.5</b>。',
    },
  },
  aru: {
    rate: 0.10, mult: 1.80, fx: 'hymn', fxColor: '#ffd8f0',
    name: { zh: '聖歌', en: 'Hymn', ja: '聖歌' },
    desc: {
      zh: '会心时回复最大生命的 <b>0.5%</b>。',
      en: 'A critical hit heals <b>0.5%</b> max HP.',
      ja: '会心で最大生命の <b>0.5%</b> 回復。',
    },
  },
  asu: {
    rate: 0.14, mult: 1.60, fx: 'feather', fxColor: '#ffe6a6',
    name: { zh: '箭羽', en: 'Fletching', ja: '矢羽' },
    desc: {
      zh: '会心时冲刺冷却缩短 <b>0.35 秒</b>。',
      en: 'A critical hit shortens dash cooldown by <b>0.35s</b>.',
      ja: '会心でダッシュのクールタイムを <b>0.35 秒</b> 短縮。',
    },
  },
};
KUP.CRIT_OF = id => KUP.CRIT[id] || KUP.CRIT.kaf;

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
