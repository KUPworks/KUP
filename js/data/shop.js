/* ================= 商店数据域（js/data/shop.js） =================
 * 模块 id：shop
 * 内容：KUP.SHOP（瓦利斯局外强化）＋ KUP.SHOP_ITEM／KUP.shopCost 价格曲线。
 * 依赖：无。价格曲线 cost(lv) = base + lv * inc（lv 从 0 起算）。
 * 加品项＝SHOP 加一条；数值由 META.shopMods() 汇总后交给 Player.recompute。
 * ================================================================ */

window.KUP = window.KUP || {};

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
    desc: { zh: 'フラグメント转着圈来。经验 <b>+4%</b>／级。', en: 'The fragments come around. XP <b>+4%</b> per level.', ja: 'フラグメントが回ってくる。経験 <b>+4%</b>／レベル。' },
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
