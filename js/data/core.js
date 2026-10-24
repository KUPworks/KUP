/* ================= 数据层运行时（js/data/core.js） =================
 * 数据表 = 「一个玩法概念一个域文件」，本文件是所有域共用的**运行时与接口层**：
 *
 *   KUP.DATA.modules            已注册的数据域（按 manifest 顺序）
 *   KUP.DATA.register(meta)     注册一个域（一般由 index.js 按 manifest 自动调用）
 *   KUP.DATA.module(id)         按域 id 取模块元数据
 *   KUP.DATA.provider(section)  某段数据（如 'FORMS'）由哪个域提供
 *   KUP.DATA.audit()            跨域一致性校验：返回问题字符串数组（空＝健康）
 *   KUP.DATA.finalize()         载入完成后收口：注册全部域 + 跑 audit（index.js 调用）
 *
 * 设计目的（为正式开发留的接口）：
 *   1. **加载顺序只有一处真值**：js/data/manifest.js；Node 工具直接 require 同一份清单。
 *   2. **跨域引用集中校验**：角色的 weapon、武器的 owner／behavior、形态的 series／char、
 *      支援物的 owner、Boss 的 pattern 等，在启动时一次查完，不必等运行到出错。
 *   3. **域文件保持纯数据**：不 require、不互相赋值；需要新增校验就在这里加一条规则。
 * ================================================================ */
window.KUP = window.KUP || {};

(function (KUP) {
  'use strict';

  var modules = [];                 // 顺序＝manifest 顺序
  var byId = Object.create(null);   // id -> module meta
  var problems = [];
  var finalized = false;

  function need(cond, msg) { if (!cond) problems.push(msg); }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function isStr(v) { return typeof v === 'string' && v.length > 0; }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function tri(v) {
    return isObj(v) && isStr(v.zh) && isStr(v.en) && isStr(v.ja);
  }
  function needTri(v, label) { need(tri(v), label + ' 缺少完整三语文本（zh/en/ja）'); }
  function needStr(v, label) { need(isStr(v), label + ' 缺少非空字符串'); }
  function needNum(v, label) { need(isNum(v), label + ' 缺少有效数值'); }
  function needFn(name) { need(typeof KUP[name] === 'function', '缺少查询接口 KUP.' + name); }
  function uniqueBy(arr, label, key) {
    var seen = Object.create(null);
    arr.forEach(function (item, i) {
      var k = key(item, i);
      if (!isStr(k)) { problems.push(label + '[' + i + '] 缺少 id'); return; }
      if (seen[k]) problems.push(label + ' 出现重复 id「' + k + '」');
      seen[k] = item;
    });
    return seen;
  }

  var DATA = {
    ready: false,
    modules: modules,
    problems: problems,

    register: function (meta) {
      if (!meta || !isStr(meta.id)) return null;
      if (byId[meta.id]) return byId[meta.id];
      var mod = {
        id: meta.id,
        file: meta.file || '',
        provides: (meta.provides || []).slice(),
        dependsOn: (meta.dependsOn || []).slice(),
        desc: meta.desc || '',
      };
      modules.push(mod);
      byId[mod.id] = mod;
      return mod;
    },

    module: function (id) { return byId[id] || null; },

    provider: function (section) {
      for (var i = 0; i < modules.length; i++) {
        if (modules[i].provides.indexOf(section) >= 0) return modules[i];
      }
      return null;
    },

    has: function (section) {
      return Object.prototype.hasOwnProperty.call(KUP, section);
    },

    /* 跨域一致性校验。只读，不修改任何数据；可反复调用（verify-run 会再查一次）。 */
    audit: function () {
      problems.length = 0;

      /* ---------- 0. 模块清单与依赖 ---------- */
      var manifest = KUP.DATA_MODULES;
      need(Array.isArray(manifest) && manifest.length > 0, 'KUP.DATA_MODULES 缺失：manifest.js 未被加载');
      if (Array.isArray(manifest)) {
        uniqueBy(manifest, 'KUP.DATA_MODULES', function (m) { return m.id; });
        manifest.forEach(function (m) {
          need(isStr(m.file), '数据模块 ' + m.id + ' 缺少 file');
          need(DATA.module(m.id), '数据模块 ' + m.id + ' 未注册（index.js 是否在最后加载？）');
          (m.provides || []).forEach(function (section) {
            need(DATA.has(section), '数据模块 ' + m.id + ' 未提供 KUP.' + section);
          });
          (m.dependsOn || []).forEach(function (dep) {
            need(DATA.module(dep), '数据模块 ' + m.id + ' 依赖的 ' + dep + ' 未注册');
          });
        });
      }

      /* ---------- 1. 角色 / 会心 / 大招 ---------- */
      var chars = KUP.CHARS || [];
      need(Array.isArray(chars) && chars.length > 0, 'KUP.CHARS 为空或不是数组');
      var charSet = uniqueBy(chars, 'KUP.CHARS', function (c) { return c.id; });
      chars.forEach(function (c) {
        needStr(c.name, '角色 ' + c.id + ' 的 name');
        needTri(c.desc, '角色 ' + c.id + ' 的 desc');
        need(isObj(c.stats), '角色 ' + c.id + ' 缺少 stats');
        needNum(c.stats && c.stats.hp, '角色 ' + c.id + ' 的 stats.hp');
        needNum(c.stats && c.stats.speed, '角色 ' + c.id + ' 的 stats.speed');
        needStr(c.weapon, '角色 ' + c.id + ' 的 weapon');
        if (isStr(c.weapon)) {
          need(KUP.WEAPONS && KUP.WEAPONS[c.weapon], '角色 ' + c.id + ' 的初期武装「' + c.weapon + '」不存在于 KUP.WEAPONS');
        }
        if (c.unlock) {
          needTri(c.unlock.desc, '角色 ' + c.id + ' 的 unlock.desc');
          needNum(c.unlock.cost, '角色 ' + c.id + ' 的 unlock.cost');
        }
      });

      var crit = KUP.CRIT || {};
      Object.keys(crit).forEach(function (id) {
        var c = crit[id];
        need(charSet[id], 'KUP.CRIT 含未知角色 id「' + id + '」');
        needNum(c.rate, 'KUP.CRIT.' + id + '.rate');
        needNum(c.mult, 'KUP.CRIT.' + id + '.mult');
        needTri(c.name, 'KUP.CRIT.' + id + '.name');
        needTri(c.desc, 'KUP.CRIT.' + id + '.desc');
        if (isNum(c.rate)) need(c.rate >= 0 && c.rate <= 1, 'KUP.CRIT.' + id + '.rate 应在 0–1');
        if (isNum(c.mult)) need(c.mult >= 1, 'KUP.CRIT.' + id + '.mult 应 ≥ 1');
      });
      chars.forEach(function (c) {
        need(crit[c.id], '角色 ' + c.id + ' 缺少 KUP.CRIT 条目');
      });

      var ults = KUP.ULTIMATES || {};
      var ultIds = Object.create(null);
      need(ults.default, 'KUP.ULTIMATES 缺少 default 兜底');
      Object.keys(ults).forEach(function (id) {
        var u = ults[id];
        needStr(u.id, 'KUP.ULTIMATES.' + id + '.id');
        if (isStr(u.id)) {
          need(!ultIds[u.id], 'KUP.ULTIMATES 出现重复大招 id「' + u.id + '」');
          ultIds[u.id] = true;
        }
        needTri(u.name, 'KUP.ULTIMATES.' + id + '.name');
        needTri(u.desc, 'KUP.ULTIMATES.' + id + '.desc');
        if (id !== 'default') need(charSet[id], 'KUP.ULTIMATES 含未知角色 id「' + id + '」');
      });
      chars.forEach(function (c) {
        need(ults[c.id], '角色 ' + c.id + ' 缺少 KUP.ULTIMATES 条目');
      });

      /* ---------- 2. 武器模组 ↔ 具体武器 ---------- */
      var mods = KUP.WEAPON_MODULES || {};
      var modSet = uniqueBy(Object.keys(mods).map(function (k) { return mods[k]; }),
        'KUP.WEAPON_MODULES', function (m) { return m.id; });
      Object.keys(mods).forEach(function (id) {
        var m = mods[id];
        need(m.id === id, 'KUP.WEAPON_MODULES["' + id + '"] 的 id 应为「' + id + '」');
        needTri(m.name, '武器模组 ' + id + ' 的 name');
        needTri(m.desc, '武器模组 ' + id + ' 的 desc');
        need(isObj(m.base), '武器模组 ' + id + ' 缺少 base');
        need(Array.isArray(m.params), '武器模组 ' + id + ' 缺少 params 白名单');
        need(Array.isArray(m.area), '武器模组 ' + id + ' 缺少 area 生效表');
      });

      var weapons = KUP.WEAPONS || {};
      var usedMods = Object.create(null);
      uniqueBy(Object.keys(weapons).map(function (k) { return weapons[k]; }),
        'KUP.WEAPONS', function (w) { return w.id; });
      Object.keys(weapons).forEach(function (id) {
        var w = weapons[id];
        need(w.id === id, 'KUP.WEAPONS["' + id + '"] 的 id 应为「' + id + '」');
        needTri(w.name, '武器 ' + id + ' 的 name');
        needTri(w.desc, '武器 ' + id + ' 的 desc');
        needNum(w.maxLv, '武器 ' + id + ' 的 maxLv');
        var m = mods[w.behavior];
        need(m, '武器 ' + id + ' 的 behavior「' + w.behavior + '」不存在');
        if (m) usedMods[m.id] = true;
        if (w.owner) need(charSet[w.owner], '武器 ' + id + ' 的 owner「' + w.owner + '」不是已知角色');
        need(Array.isArray(w.levels) && w.levels.length === w.maxLv, '武器 ' + id + ' 的 levels 数应等于 maxLv');
        need(Array.isArray(w.lvDesc) && w.lvDesc.length === w.maxLv, '武器 ' + id + ' 的 lvDesc 数应等于 maxLv');
        (w.lvDesc || []).forEach(function (d, i) { needTri(d, '武器 ' + id + ' 的 lvDesc[' + i + ']'); });
        need(isObj(w.evolved) && isObj(w.evolved.stats), '武器 ' + id + ' 缺少 evolved');
        if (isObj(w.evolved)) {
          needTri(w.evolved.name, '武器 ' + id + ' 的 evolved.name');
          needTri(w.evolved.desc, '武器 ' + id + ' 的 evolved.desc');
        }
        if (m && Array.isArray(m.params)) {
          var allowed = Object.create(null);
          m.params.forEach(function (k) { allowed[k] = true; });
          var checkKeys = function (stats, where) {
            Object.keys(stats || {}).forEach(function (k) {
              need(allowed[k], '武器 ' + id + ' ' + where + ' 的参数「' + k + '」不在模组 ' + m.id + ' 的 params 白名单');
            });
          };
          (w.levels || []).forEach(function (lv, i) { checkKeys(lv, 'Lv' + (i + 1)); });
          if (isObj(w.evolved)) checkKeys(w.evolved.stats, 'evolved');
        }
      });
      Object.keys(mods).forEach(function (id) {
        need(usedMods[id], '武器模组 ' + id + ' 没有被任何武器使用（空模组）');
      });

      /* ---------- 2b. 模组族（大模组）与命名空间 ----------
       * 三层命名必须互不重名：武器 id 是「歌」，模组 id 是「行为」，族 id 是「大类」。
       * 过去的 `note`/`bass`/`lance` 既是武器又是模组，读起来分不清；这里用 audit 钉住。 */
      var fams = KUP.WEAPON_FAMILIES || {};
      uniqueBy(Object.keys(fams).map(function (k) { return fams[k]; }),
        'KUP.WEAPON_FAMILIES', function (f) { return f.id; });
      Object.keys(fams).forEach(function (id) {
        var f = fams[id];
        need(f.id === id, 'KUP.WEAPON_FAMILIES["' + id + '"] 的 id 应为「' + id + '」');
        needTri(f.name, '武器模组族 ' + id + ' 的 name');
        needTri(f.desc, '武器模组族 ' + id + ' 的 desc');
        need(Array.isArray(f.modules) && f.modules.length > 0, '武器模组族 ' + id + ' 缺少 modules 清单');
        (f.modules || []).forEach(function (mid) {
          need(mods[mid], '武器模组族 ' + id + ' 登记的模组「' + mid + '」不存在');
          need(mods[mid] && mods[mid].family === id, '模组「' + mid + '」的 family 应为「' + id + '」');
        });
      });
      Object.keys(mods).forEach(function (id) {
        var m = mods[id];
        need(KUP.FAMILY && KUP.FAMILY(m.family), '武器模组 ' + id + ' 的 family「' + m.family + '」不存在');
        need(!weapons[id], '模组 id「' + id + '」与武器 id 重名：模组是行为、武器是数据，必须拆成两个命名空间');
      });

      /* ---------- 3. 被动 / 局内道具 ---------- */
      var passives = KUP.PASSIVES || {};
      /* 被动以 id 为键、条目内不重复写 id：直接校验键唯一性。 */
      uniqueBy(Object.keys(passives), 'KUP.PASSIVES', function (id) { return id; });
      Object.keys(passives).forEach(function (id) {
        var p = passives[id];
        needNum(p.maxLv, '被动 ' + id + ' 的 maxLv');
        needTri(p.name, '被动 ' + id + ' 的 name');
        needTri(p.desc, '被动 ' + id + ' 的 desc');
      });
      var items = KUP.ITEMS || {};
      Object.keys(items).forEach(function (id) {
        var it = items[id];
        need(it.id === id, 'KUP.ITEMS["' + id + '"] 的 id 应为「' + id + '」');
        needTri(it.name, '道具 ' + id + ' 的 name');
        needTri(it.desc, '道具 ' + id + ' 的 desc');
        needStr(it.kind, '道具 ' + id + ' 的 kind');
      });

      /* ---------- 4. 敌人 / Boss ---------- */
      var enemies = KUP.ENEMIES || {};
      Object.keys(enemies).forEach(function (key) {
        var e = enemies[key];
        if (!isObj(e)) { return; }
        needTri(e.name, '敌人 ' + key + ' 的 name');
        needNum(e.hp, '敌人 ' + key + ' 的 hp');
        needNum(e.speed, '敌人 ' + key + ' 的 speed');
        needNum(e.dmg, '敌人 ' + key + ' 的 dmg');
        needNum(e.r, '敌人 ' + key + ' 的 r');
        if (e.turn != null) needNum(e.turn, '敌人 ' + key + ' 的 turn');
      });
      var bosses = KUP.BOSSES || {};
      uniqueBy(Object.keys(bosses).map(function (k) { return bosses[k]; }),
        'KUP.BOSSES', function (b) { return b.id; });
      Object.keys(bosses).forEach(function (key) {
        var b = bosses[key];
        need(b.id === key, 'KUP.BOSSES["' + key + '"] 的 id 应为「' + key + '」');
        needTri(b.name, 'Boss ' + key + ' 的 name');
        needStr(b.pattern, 'Boss ' + key + ' 的 pattern');
        needNum(b.hp, 'Boss ' + key + ' 的 hp');
        needNum(b.turn, 'Boss ' + key + ' 的 turn');
      });
      need(bosses.boss0, 'KUP.BOSSES 缺少 boss0 兜底');
      need(enemies.boss === bosses.boss0, 'KUP.ENEMIES.boss 应指向 KUP.BOSSES.boss0');

      /* ---------- 4b. 八形＝体型/参数原型（v0.20.2） ----------
       * shape 是**数据标签**（决定参数原型与图鉴分组），不承载绘制：
       * 所有破维魔共用 js/entities.js 的多边形故障体，只由 sides/color/r 等参数给出差异。
       * 三条规则：① 八形齐全且 id 唯一；② 每个敌人都写了 shape 且命中；
       *          ③ 每个形至少有一个敌人（不允许"分类留空"）。 */
      var shapes = KUP.ENEMY_SHAPES || [];
      var shapeSet = uniqueBy(shapes, 'KUP.ENEMY_SHAPES', function (s) { return s.id; });
      need(shapes.length === 8, 'KUP.ENEMY_SHAPES 应为八形（当前 ' + shapes.length + '）');
      shapes.forEach(function (s) {
        needTri(s.name, '破维魔形态 ' + s.id + ' 的 name');
        needStr(s.note, '破维魔形态 ' + s.id + ' 的 note');
      });
      Object.keys(enemies).forEach(function (key) {
        var e = enemies[key];
        if (!isObj(e)) { return; }
        need(isStr(e.shape), '敌人 ' + key + ' 缺少 shape（须为八形之一）');
        if (isStr(e.shape)) {
          need(shapeSet[e.shape], '敌人 ' + key + ' 的 shape「' + e.shape + '」不在 KUP.ENEMY_SHAPES');
        }
      });
      if (typeof KUP.enemiesOfShape === 'function') {
        shapes.forEach(function (s) {
          need(KUP.enemiesOfShape(s.id).length > 0,
            '破维魔形态「' + s.id + '」还没有任何敌人（分类不应留空）');
        });
      }

      /* ---------- 5. 皮肤（形态） ---------- */
      var series = KUP.FORM_SERIES || [];
      var serSet = uniqueBy(series, 'KUP.FORM_SERIES', function (s) { return s.id; });
      series.forEach(function (s) {
        needTri(s.name, '形态系列 ' + s.id + ' 的 name');
        needTri(s.desc, '形态系列 ' + s.id + ' 的 desc');
        needTri(s.src, '形态系列 ' + s.id + ' 的 src（出处记录）');
        if (s.char) need(charSet[s.char], '形态系列 ' + s.id + ' 的 char「' + s.char + '」不是已知角色');
      });
      var forms = KUP.FORMS || [];
      uniqueBy(forms, 'KUP.FORMS', function (f) { return f.id; });
      var KINDS = ['witch', 'recruit', 'companion'];
      forms.forEach(function (f) {
        if (f.series) need(serSet[f.series], '形态 ' + f.id + ' 的 series「' + f.series + '」不存在');
        if (f.char) need(charSet[f.char], '形态 ' + f.id + ' 的 char「' + f.char + '」不是已知角色');
        needTri(f.name, '形态 ' + f.id + ' 的 name');
        needTri(f.label, '形态 ' + f.id + ' 的 label');
        needTri(f.desc, '形态 ' + f.id + ' 的 desc');
        needTri(f.src, '形态 ' + f.id + ' 的 src（出处记录）');
        need(Array.isArray(f.kinds) && f.kinds.length > 0, '形态 ' + f.id + ' 缺少 kinds');
        (f.kinds || []).forEach(function (k) {
          need(KINDS.indexOf(k) >= 0, '形态 ' + f.id + ' 的 kinds 含未知类型「' + k + '」');
        });
        if (f.mods != null) need(isObj(f.mods), '形态 ' + f.id + ' 的 mods 应是对象');
      });
      need(KUP.NO_FORM && KUP.NO_FORM.id === 'none', 'KUP.NO_FORM 缺失或 id 不是 none');
      chars.forEach(function (c) {
        var kind = KUP.charKind ? KUP.charKind(c) : null;
        var df = KUP.defaultForm ? KUP.defaultForm(c.id) : null;
        need(df, '角色 ' + c.id + ' 没有默认形态');
        if (df && KUP.formFits) {
          need(KUP.formFits(df, kind, c.id), '角色 ' + c.id + ' 的默认形态「' + df.id + '」不适用于该角色');
        }
        need(KUP.formsFor && KUP.formsFor(kind, c.id).length > 0, '角色 ' + c.id + ' 没有任何可用形态');
      });

      /* ---------- 6. 支援物品 / 同伴 / 商店 ---------- */
      var supports = KUP.SUPPORTS || [];
      uniqueBy(supports, 'KUP.SUPPORTS', function (s) { return s.id; });
      supports.forEach(function (s) {
        needTri(s.name, '支援物品 ' + s.id + ' 的 name');
        needTri(s.desc, '支援物品 ' + s.id + ' 的 desc');
        need(isObj(s.perk), '支援物品 ' + s.id + ' 缺少 perk');
        need(isObj(s.unlock) && isNum(s.unlock.cost), '支援物品 ' + s.id + ' 缺少 unlock.cost');
        if (s.owner) need(charSet[s.owner], '支援物品 ' + s.id + ' 的 owner「' + s.owner + '」不是已知角色');
      });
      var companions = KUP.COMPANIONS || [];
      uniqueBy(companions, 'KUP.COMPANIONS', function (c) { return c.id; });
      companions.forEach(function (c) {
        needStr(c.name, '同伴 ' + c.id + ' 的 name');
        need(isObj(c.perk), '同伴 ' + c.id + ' 缺少 perk');
        if (c.unlock) need(isNum(c.unlock.cost), '同伴 ' + c.id + ' 的 unlock.cost');
      });
      var shop = KUP.SHOP || [];
      uniqueBy(shop, 'KUP.SHOP', function (s) { return s.id; });
      shop.forEach(function (s) {
        need(isNum(s.maxLv) && s.maxLv > 0, '商店 ' + s.id + ' 的 maxLv');
        needNum(s.base, '商店 ' + s.id + ' 的 base');
        needNum(s.inc, '商店 ' + s.id + ' 的 inc');
        need(isObj(s.mods), '商店 ' + s.id + ' 缺少 mods');
        needTri(s.name, '商店 ' + s.id + ' 的 name');
        needTri(s.desc, '商店 ' + s.id + ' 的 desc');
      });

      /* ---------- 7. 查询接口齐全 ---------- */
      ['CHAR', 'charUnlockText', 'CRIT_OF', 'nameOf', 'shortOf', 'cvOf',
        'MODULE', 'WEAPONS_OF', 'MODULE_OF', 'WEAPON', 'FAMILY', 'MODULES_OF_FAMILY',
        'FAMILY_OF_MODULE', 'FAMILY_OF', 'ULTIMATE',
        'ITEM', 'ENEMY', 'BOSS', 'ENEMY_SHAPE', 'enemiesOfShape', 'COMPANION', 'companionsActive',
        'SUPPORT', 'FORM', 'defaultForm', 'formFits', 'formsFor',
        'formsOfChar', 'formGroups', 'charKind', 'SHOP_ITEM', 'shopCost'].forEach(needFn);

      return problems.slice();
    },

    /* 载入收口：按 manifest 注册全部域，然后 audit。浏览器由 js/data/index.js 调用，
     * Node 工具同样按清单加载——因此这段逻辑在两边一致。 */
    finalize: function () {
      if (finalized) return problems.slice();
      (KUP.DATA_MODULES || []).forEach(function (m) { DATA.register(m); });
      var found = DATA.audit();
      if (found.length && typeof console !== 'undefined' && console.warn) {
        console.warn('[KUP][data] 一致性校验发现 ' + found.length + ' 个问题：\n  - ' + found.join('\n  - '));
      }
      DATA.ready = true;
      finalized = true;
      return found;
    },
  };

  KUP.DATA = DATA;
})(window.KUP);
