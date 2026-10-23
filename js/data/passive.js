/* ================= 被动数据域（js/data/passive.js） =================
 * 模块 id：passive
 * 内容：KUP.PASSIVES（局内被动强化；以 id 为键，条目内不再写 id）。
 * 依赖：无。数值由 Player.recompute 消费，卡池由 game.rollChoices 消费。
 * 加被动＝PASSIVES 加一条（并确认 recompute 里有对应字段的结算）。
 * ================================================================ */

window.KUP = window.KUP || {};

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
    desc: { zh: 'フラグメント更易被歌声吸引——拾取范围 +30%。', en: 'Fragments are drawn to your song — pickup range +30%.', ja: 'フラグメントが歌に引かれやすくなる——取得範囲 +30%。' },
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
   * 毒区 75%／轰炸 70%／光束 50%）。v0.18.4：**耐久**每级 +20（20/40/60/80/100），
   * **保护效率** 1～4 级＝88（贴靠 89%）、5 级＝100（贴靠 95%）；挡下伤害消耗耐久，
   * 脱战 3s 后 1.5s 回满。見 recompute / CONFIG.SHIELD.DURA_VALUES。 */
  shield: {
    icon: '盾', color: '#8fd0ff', maxLv: 5,
    name: { zh: '防音护盾', en: 'Soundproof Shield', ja: '防音シールド' },
    desc: {
      zh: '歌声化作减伤膜——<b>耐久 +20</b>／级（20/40/60/80/100）。保护效率 1～4 级＝<b>88</b>（贴靠 89%），第 5 级＝<b>100</b>（贴靠 95%）。<br>挡下的伤害会消耗耐久（打空就没减伤），脱战 <b>3 秒</b>后 <b>1.5 秒</b>内回满。',
      en: 'Song becomes a damage-reducing membrane — <b>+20 durability</b> per level (20/40/60/80/100). Efficiency is <b>88</b> at levels 1–4 (contact 89%) and <b>100</b> at level 5 (contact 95%).<br>Blocked damage drains durability (empty = no reduction); it refills within <b>1.5s</b> after <b>3s</b> unharmed.',
      ja: '歌が軽減膜となる——<b>耐久 +20</b>／レベル（20/40/60/80/100）。保護効率は 1〜4 級＝<b>88</b>（接触 89%）、5 級＝<b>100</b>（接触 95%）。<br>受け止めたダメージで耐久が減り（尽きると軽減なし）、<b>3 秒</b>無傷なら <b>1.5 秒</b>で全快。',
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
      zh: '回避（MISS）成功时，片段回流——回复最大生命的 <b>1.5%</b>／级。',
      en: 'Each MISS sends fragments flowing back — heal <b>1.5%</b> max HP per level.',
      ja: '回避（MISS）成功時、フラグメントが還流する——最大生命の <b>1.5%</b>／レベル回復。',
    },
  },
  /* v0.18.4 会心成长（人类 2026-10-21「由更低期望分别增加概率与倍率」）：
   * 两张卡**各自只加一项**，期望都低于标准「力量 +12%」——率约 +3%/级（边际递减），
   * 倍率约 +2.4%/级（与率互相放大）；两者都受 CONFIG.CRIT 的 RATE_CAP / MULT_CAP 约束。 */
  flint: {
    icon: '鋭', color: '#ffe27a', maxLv: 5,
    name: { zh: '鋭音', en: 'Sharpened Tone', ja: '鋭音' },
    desc: {
      zh: '把歌声压成刃——<b>会心率 +4%</b>／级。',
      en: 'Hone the song into a blade — <b>+4% crit chance</b> per level.',
      ja: '歌を刃に研ぐ——<b>会心率 +4%</b>／レベル。',
    },
  },
  heavy: {
    icon: '重', color: '#ff9a5a', maxLv: 5,
    name: { zh: '重音', en: 'Heavy Tone', ja: '重音' },
    desc: {
      zh: '让会心落得更重——<b>会心伤害 +0.20</b>／级。',
      en: 'Let critical hits land heavier — <b>+0.20 crit damage</b> per level.',
      ja: '会心をより重く——<b>会心ダメージ +0.20</b>／レベル。',
    },
  },
};
