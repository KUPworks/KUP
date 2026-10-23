/* ================= 局内道具数据域（js/data/item.js） =================
 * 模块 id：item
 * 内容：KUP.ITEMS（七种「符」：立即生效或限时 BUFF，不占被动槽、可重复选）。
 * 依赖：无。效果由 game.choose()／Player.recompute 消费。
 * 加道具＝ITEMS 加一条 + game.choose 的 kind 分派。
 * ================================================================ */

window.KUP = window.KUP || {};

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
      zh: '片段回流——<b>立即回复 45% 最大生命</b>。',
      en: 'Fragments flow back — <b>heal 45% max HP now</b>.',
      ja: 'フラグメントが還流する——<b>即座に最大生命の 45% 回復</b>。',
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
      zh: '歌声化作磁场——<b>8 秒内全场片段被吸向魔女</b>（回复 ♥ 同样被吸引）。',
      en: 'Your song becomes a magnetic field — <b>every fragment is pulled to you for 8s</b> (hearts too).',
      ja: '歌が磁場となる——<b>8 秒間、場のフラグメントすべてが引き寄せられる</b>（回復♥も）。',
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

/* ---------- 记忆片段（已移除，v0.17） ----------
 * 记忆图鉴与 8 条片段随「記憶の卵改成局内現象卡」一并删除（人类 2026-10-19 选择）。
 * 世界观考据仍在 docs/lore/，不再以局外收集品的形式出现。
 */
