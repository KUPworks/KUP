/* ================= 数据层清单（js/data/manifest.js） =================
 * 这里是**数据模块加载顺序的唯一真值**：
 *   - 浏览器：`index.html` 按本文件的 MODULES 顺序写 <script>（tools/check-html.js 会核对
 *     清单与 HTML 是否一致、顺序是否错位）；
 *   - Node 工具/测试：`require('../js/data/manifest.js')` 拿到同一份文件列表，
 *     不再各自手写 `js/data.js`（v0.19 拆分前是硬编码的）。
 *
 * 加一个数据域（三步）：
 *   ① 新建 `js/data/<域>.js`，只往 `window.KUP` 上挂数据与查询函数；
 *   ② 在下面 MODULES 里加一条 `{ id, file, provides, dependsOn }`；
 *   ③ 按顺序在 index.html 补 `<script src="js/data/<域>.js?v=...">`。
 *   `index.js` 必须留在最后：它负责注册模块并跑 `KUP.DATA.audit()`。
 *
 * 纪律：
 *   - **不要改已有模块 id / 文件名**（文档、工具、提交历史都按 id 引用）；
 *   - 域文件之间不要互相 require / 读写对方变量——跨域一致性交给 `KUP.DATA.audit()`；
 *   - 需要新增数据域时优先拆「一个玩法概念一个文件」，不要把多个域塞回一个文件。
 * 依赖只用于表达语义（加载顺序仍以上面的数组为准）：
 *   core → char → weapon → passive → item → enemy → skin → support → shop → index
 * ================================================================ */
(function (root) {
  var MODULES = [
    {
      id: 'core', file: 'js/data/core.js', provides: ['DATA'], dependsOn: [],
      desc: '数据层运行时：模块注册表、跨域查询、一致性校验（KUP.DATA）',
    },
    {
      id: 'char', file: 'js/data/char.js', provides: ['CHARS', 'CRIT', 'ULTIMATES'], dependsOn: ['core'],
      desc: '角色（魔女之子／魔女候補）、会心、语言显示名、按角色的大招',
    },
    {
      id: 'weapon', file: 'js/data/weapon.js', provides: ['WEAPON_MODULES', 'WEAPONS'], dependsOn: ['core', 'char'],
      desc: '武器模组注册表（behavior）与具体武器（等级表／覚醒）',
    },
    {
      id: 'passive', file: 'js/data/passive.js', provides: ['PASSIVES'], dependsOn: ['core'],
      desc: '局内被动强化',
    },
    {
      id: 'item', file: 'js/data/item.js', provides: ['ITEMS'], dependsOn: ['core'],
      desc: '局内道具（符）与已移除内容的说明',
    },
    {
      id: 'enemy', file: 'js/data/enemy.js', provides: ['ENEMIES', 'BOSSES'], dependsOn: ['core'],
      desc: '杂兵／精英／七体番街 Boss（含 pattern）',
    },
    {
      id: 'skin', file: 'js/data/skin.js', provides: ['FORM_SERIES', 'FORMS', 'NO_FORM'], dependsOn: ['core', 'char'],
      desc: '皮肤＝特殊歌唱用形態：系列共同字段、形态条目、分组查询',
    },
    {
      id: 'support', file: 'js/data/support.js', provides: ['SUPPORTS', 'COMPANIONS'], dependsOn: ['core', 'char'],
      desc: '支援物品与（暂退场的）同伴',
    },
    {
      id: 'shop', file: 'js/data/shop.js', provides: ['SHOP'], dependsOn: ['core'],
      desc: '瓦利斯局外强化与价格曲线',
    },
    {
      id: 'index', file: 'js/data/index.js', provides: [], dependsOn: [
        'core', 'char', 'weapon', 'passive', 'item', 'enemy', 'skin', 'support', 'shop',
      ],
      desc: '汇总入口：finalize（注册模块）＋ audit（一致性校验）',
    },
  ];

  var FILES = MODULES.map(function (m) { return m.file; });

  if (typeof window !== 'undefined') {
    window.KUP = window.KUP || {};
    window.KUP.DATA_MODULES = MODULES;   // 元数据（index.html 顺序核对、文档生成用）
    window.KUP.DATA_FILES = FILES;       // 纯路径列表（工具/调试用）
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FILES;              // Node：require 后得到按加载顺序排列的路径数组
    module.exports.MODULES = MODULES;   // 同时暴露元数据（可选）
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
