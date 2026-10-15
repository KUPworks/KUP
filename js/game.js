window.KUP = window.KUP || {};

/* ================= 核心玩法 =================
 * 生成导演/渲染已拆分至 js/director.js、js/render.js（混入 Game 原型）。
 * 新系统（v0.4.0-loop）：覚醒/进化、浄化の歌大招、記憶の卵、復興率结算、结局分歧、每局随机种子。 */
(function () {
  const U = KUP.U, C = KUP.CONFIG;

  /* ---------- 武器运行时 ---------- */
  class WeaponRuntime {
    constructor(def, lv) {
      this.def = def;
      this.lv = lv;
      this.evolved = false; // 覚醒後：stat() 切换到 def.evolved.stats
      this.t = 0.3;
      this.angle = 0;
      this.orbs = [];
    }
    stat() { return this.evolved ? this.def.evolved.stats : this.def.levels[this.lv - 1]; }

    update(dt, game) {
      const p = game.player, s = this.stat(), m = p.cdMult, col = this.def.color;
      switch (this.def.behavior) {
        case 'note': { // フラクタル・ノート：追踪音符
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            for (let i = 0; i < s.count; i++) {
              const target = game.enemies.length ? U.pick(game.enemies) : null;
              const a = target
                ? Math.atan2(target.y - p.y, target.x - p.x)
                : Math.atan2(p.aim.y, p.aim.x) + (i - (s.count - 1) / 2) * 0.4;
              const sp = 400;
              game.projs.push(new KUP.Projectile(p.x, p.y - 6, Math.cos(a) * sp, Math.sin(a) * sp, {
                dmg: s.dmg * p.dmgMult, r: 7, life: 2.2, pierce: 0, homing: 5.2, target,
                color: col, kind: 'note', split: s.split ? 1 : 0,
              }));
            }
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        case 'orbit': { // レゾナンス・オーブ：环绕音球（**体积与转速可调**）
          /* v0.8：音球**体积与转速可调**——
           *   半径 ← 「范围」(areaMult)（含被动 電脳領域／皮肤／規則修正）
           *   转速 ← 基础 spin ÷ 冷却乘数（**冷却提升对 orbit 不再是废属性**）
           *   球体半径 ← 亦随范围成长（体积＝更大的判定与更粗的扫掠臂）
           * v0.9 修正：判定改为**沿「玩家→音球」扫掠臂**（点到线段距离）。
           *   旧版只判定球心附近的圆，敌人贴到玩家身上（停在环内）后永远打不到，
           *   导致这把初始武器几乎无法击杀——这是"碰撞检测考验操作"的根源。 */
          while (this.orbs.length < s.count) this.orbs.push({ x: p.x, y: p.y, r: 11 });
          while (this.orbs.length > s.count) this.orbs.pop();
          const Rbase = (s.r || 88) * p.areaMult;
          const spin = (s.spin || 2.6) / Math.max(0.35, p.cdMult);
          const orbR = 11 * (0.72 + 0.28 * p.areaMult);
          this.angle += spin * dt;
          this.orbR = orbR;
          /* 半径轻微「呼吸」（0.86〜1.0），让扫掠更有实感（不影响判定逻辑） */
          const R = Rbase * (0.86 + 0.14 * (0.5 + 0.5 * Math.sin(this.angle * 0.9)));
          this.orbitR = Rbase;
          for (let i = 0; i < this.orbs.length; i++) {
            const orb = this.orbs[i];
            const a = this.angle + (U.TAU * i) / this.orbs.length;
            orb.x = p.x + Math.cos(a) * R;
            orb.y = p.y + Math.sin(a) * R;
            orb.r = orbR;
            for (const e of game.enemies) {
              if (e.dead || e.orbitT > 0) continue;
              /* 扫掠臂判定：玩家→音球的线段（球体积决定臂的粗细） */
              if (U.segDist2(e.x, e.y, p.x, p.y, orb.x, orb.y) < Math.pow(e.r + orbR, 2)) {
                /* 转速越高，同一敌人被再次扫到的间隔越短（与冷却挂钩） */
                e.orbitT = 0.45 * Math.max(0.45, p.cdMult);
                game.damageEnemy(e, s.dmg * p.dmgMult, Math.cos(a) * 140, Math.sin(a) * 140);
              }
            }
          }
          break;
        }
        case 'bass': { // テラ・ドロップ：低音冲击环
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            game.rings.push(new KUP.Ring(p.x, p.y, {
              maxR: s.r * p.areaMult, speed: 300, dmg: s.dmg * p.dmgMult, kb: 170, color: col,
            }));
            if (s.double) {
              game.rings.push(new KUP.Ring(p.x, p.y, {
                maxR: s.r * p.areaMult, speed: 220, dmg: s.dmg * p.dmgMult * 0.7, kb: 140, color: col,
              }));
            }
            game.shake(3);
            KUP.Audio.sfx('boom');
          }
          break;
        }
        case 'laser': { // ヴァニッシュ・ビーム：贯穿光束
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const e = game.nearestEnemy(p.x, p.y);
            const dir = e ? Math.atan2(e.y - p.y, e.x - p.x) : Math.atan2(p.aim.y, p.aim.x);
            game.beams.push(new KUP.Beam(p.x, p.y - 4, dir, {
              len: s.len * p.areaMult, w: s.w, dmg: s.dmg * p.dmgMult, color: col, game,
            }));
            if (s.double) {
              game.beams.push(new KUP.Beam(p.x, p.y - 4, dir + 0.3, {
                len: s.len * p.areaMult, w: s.w, dmg: s.dmg * p.dmgMult * 0.7, color: col, game,
              }));
            }
            KUP.Audio.sfx('laser');
          }
          break;
        }
        case 'lance': { // アリア・ランス：穿透音枪（瞄准走 aimDir：自动/鼠标/移动）
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const ad = game.aimDir(p);
            const base = Math.atan2(ad.y, ad.x);
            for (let i = 0; i < s.count; i++) {
              const a = base + (i - (s.count - 1) / 2) * 0.16;
              game.projs.push(new KUP.Projectile(p.x, p.y, Math.cos(a) * 560, Math.sin(a) * 560, {
                dmg: s.dmg * p.dmgMult, r: 8, life: 1.6, pierce: s.pierce, color: col, kind: 'lance',
              }));
            }
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        /* ===== 新武器组：滞留・投掷系 ===== */
        case 'toss': { // 残留音块：自动投掷到最近敌人，落点留下滞留音场
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const range = s.range * p.areaMult;
            for (let i = 0; i < s.count; i++) {
              const target = game.nearestEnemy(p.x, p.y);
              const spread = (i - (s.count - 1) / 2) * 0.42;
              let a;
              if (target) a = Math.atan2(target.y - p.y, target.x - p.x) + spread;
              else a = Math.atan2(p.aim.y, p.aim.x) + spread;
              const d = target ? Math.min(range, Math.hypot(target.x - p.x, target.y - p.y)) : range * 0.7;
              game.tosses.push(new KUP.Toss(p.x, p.y - 6, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
                fly: s.fly, color: col,
                zone: {
                  r: s.r * p.areaMult, dmg: s.dmg * p.dmgMult, life: s.life,
                  kind: 'field', color: col, slow: true, tickRate: 0.4,
                },
              }));
            }
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        case 'bomb': { // 随机空爆：周围随机落点，延迟引爆
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const range = s.range * p.areaMult;
            for (let i = 0; i < s.count; i++) {
              const a = U.rng() * U.TAU, d = U.rand(30, range);
              game.zones.push(new KUP.Zone(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
                r: s.r * p.areaMult, dmg: s.dmg * p.dmgMult, arm: s.fuse,
                kind: 'bomb', color: col,
              }));
            }
            KUP.Audio.sfx('warning');
          }
          break;
        }
        case 'mine': { // 音之地雷：在身后放置滞留雷（有同时存在上限）
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            let live = 0;
            for (const z of game.zones) if (z.kind === 'mine') live++;
            for (let i = 0; i < s.count; i++) {
              if (live + i >= s.max) break;
              game.zones.push(new KUP.Zone(
                p.x - p.aim.x * 22 + U.rand(-26, 26),
                p.y - p.aim.y * 22 + U.rand(-26, 26),
                { r: s.r * p.areaMult, dmg: s.dmg * p.dmgMult, life: s.life, kind: 'mine', color: col, slow: true }));
            }
            KUP.Audio.sfx('select');
          }
          break;
        }
      }
    }

    drawOrbs(ctx, p) {
      if (this.def.behavior !== 'orbit') return;
      const rr = this.orbR || 11;
      for (const orb of this.orbs) {
        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.shadowColor = this.def.color; ctx.shadowBlur = 12;
        ctx.fillStyle = this.def.color;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, U.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(-rr * 0.2, -rr * 0.2, rr * 0.36, 0, U.TAU); ctx.fill();
        ctx.restore();
      }
    }
  }
  KUP.WeaponRuntime = WeaponRuntime;

  /* ---------- 游戏主体 ---------- */
  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.view = { w: canvas.width, h: canvas.height };
      this.state = 'menu';
      this.debug = { t: 0, lv: 0, god: false, char: null, autoStart: false };
      /* 当前 run（一局 = 一次『Q』任務）。URL/UI 只改这里，其余派生状态由 applyRun 生成。 */
      this.run = { id: null, char: null, area: C.DEFAULT_AREA, mod: C.DEFAULT_MOD, seed: C.DEFAULT_SEED, companion: null, form: 'none', companionForm: 'none', aim: 'auto' };
      this.applyRun(false);
      this.city = this.buildCity();
      this.reset();
    }

    /* 由 this.run 派生本局状态：街区、规则修正乘数、确定性随机流。
     * U.rng 指向本局随机流，故 U.rand/U.pick/U.shuffle/U.weightedPick 全部随之确定。 */
    applyRun(rebuildCity) {
      if (!KUP.AREAS.some(a => a.id === this.run.area)) {
        console.warn('[KUP] 未知街区 area="' + this.run.area + '"，回落到 ' + C.DEFAULT_AREA + '。可用：' + KUP.AREAS.map(a => a.id).join(', '));
      }
      if (!KUP.MODIFIERS[this.run.mod]) {
        console.warn('[KUP] 未知规则修正 mod="' + this.run.mod + '"，回落到 ' + C.DEFAULT_MOD + '。可用：' + Object.keys(KUP.MODIFIERS).join(', '));
      }
      this.area = KUP.AREA(this.run.area);
      this.mod = KUP.MOD(this.run.mod);
      this.mods = KUP.modsFor(this.mod.id);
      this.rng = U.mulberry32(this.run.seed);
      U.rng = this.rng;
      if (rebuildCity !== false) this.city = this.buildCity();
    }

    reset() {
      this.player = null;
      this.enemies = []; this.projs = []; this.gems = []; this.rings = []; this.beams = [];
      this.parts = []; this.texts = [];
      /* 滞留区域 / 投掷物（新武器组与 Boss 共用） */
      this.zones = []; this.tosses = [];
      /* 敌方攻击（Danger）：与玩家武器分离，统一预警与高对比外观 */
      this.dangers = [];
      this.dangerNear = false;   // 是否有预警中的敌袭贴近玩家（HUD 提示用）
      this.time = this.debug.t || 0;
      this.kills = 0; this.gemCount = 0;
      this.xp = 0; this.level = 1; this.pendingLevels = 0; this.choices = null;
      /* 升级池体验（v0.10）：本局重掷次数与封禁名单 */
      this.rerolls = this.debug.reroll != null ? this.debug.reroll : 3;
      this.banned = new Set();
      this.banMode = false;
      this.cam = { x: 0, y: 0, shake: 0 };
      this.spawnAcc = 0;
      this.eliteIdx = 0;
      /* 章节演出 / 大招 / 記憶の卵 / 结局分歧 */
      this.evIdx = 0; this.surgeT = 0; this.surgePerSec = 0;
      this.fogBoost = 0; this.fogBoostT = 0;
      this.ult = { charge: 0 };
      this.eggCount = 0; this.eggGain = 0; this.fragUnlocked = null;
      this.bossSpawned = false; this.boss = null; this.bossEnraged = false;
      this.metaResult = null;
      /* 同伴（魔女候補）的周期回复 */
      this.regenEvery = 0; this.regenPct = 0; this.regenT = 0;
      this.weaponSig = '';
    }

    /* 确定性生成街区布景：由 run.seed 与街区共同决定（含每区主题装饰） */
    buildCity() {
      const area = this.area || KUP.AREA(C.DEFAULT_AREA);
      const areaIdx = Math.max(0, KUP.AREAS.indexOf(area));
      /* 布景子流与主随机流分离：同 seed 同区 → 同一张城；换区 → 必换城 */
      const rng = U.mulberry32(((this.run.seed >>> 0) ^ (areaIdx * 0x85EBCA6B)) >>> 0), A = C.ARENA;
      const blocks = [];
      for (let i = 0; i < area.blocks; i++) {
        const w = 60 + rng() * 160, h = 60 + rng() * 160;
        blocks.push({
          x: rng() * (A - w), y: rng() * (A - h), w, h,
          hue: area.hue[0] + rng() * (area.hue[1] - area.hue[0]),
          win: rng() < area.win, tone: area.tone,
        });
      }
      const glyphs = [];
      const chars = 'ノイズデータ歌浄化ヴァーチャルシステム神椿';
      const n = Math.max(10, Math.round(60 * (area.blocks / 130)));
      for (let i = 0; i < n; i++) {
        glyphs.push({
          x: rng() * 2200, y: rng() * 2200,
          ch: chars[(rng() * chars.length) | 0],
          size: 18 + rng() * 40, a: 0.04 + rng() * 0.08,
          rot: (rng() - 0.5) * 0.6,
        });
      }
      /* 每区主题装饰（P0 #8 地图辨识度）——全部确定性生成 */
      const deco = { rows: [], green: [], chimneys: [], debris: [], broken: [] };
      if (area.theme === 'farm') {          // 参番街：田垄 + 温室
        for (let i = 0; i < 46; i++) deco.rows.push({ x: rng() * A, y: rng() * A, w: 100 + rng() * 240, h: 7 + rng() * 8 });
        for (let i = 0; i < 9; i++) {
          const w = 70 + rng() * 70;
          deco.green.push({ x: rng() * (A - w), y: 40 + rng() * (A - 90), w, h: 34 + rng() * 20 });
        }
      } else if (area.theme === 'industry') { // 伍番街：烟囱
        for (const b of blocks) {
          if (rng() < 0.16) deco.chimneys.push({ x: b.x + b.w * (0.2 + rng() * 0.5), y: b.y, w: 7 + rng() * 5, h: 22 + rng() * 22, hue: b.hue });
        }
      } else if (area.theme === 'ruins') {    // 肆番街：锈迹骨架
        for (const b of blocks) {
          if (rng() < 0.55) deco.broken.push({ x: b.x, y: b.y, w: b.w, seed: rng(), hue: b.hue });
        }
      } else if (area.theme === 'restricted') { // 陸番街：残骸
        for (let i = 0; i < 70; i++) deco.debris.push({ x: rng() * A, y: rng() * A, w: 6 + rng() * 22, h: 4 + rng() * 10, rot: (rng() - 0.5) * 0.8 });
      }
      return { blocks, glyphs, area, deco };
    }

    start(opts) {
      /* 兼容调用：start('kaf') 或 start({ char, area, mod, seed, companion, form, companionForm }) */
      if (typeof opts === 'string') opts = { char: opts };
      opts = opts || {};
      if (opts.char != null) this.run.char = opts.char;
      if (opts.area != null) this.run.area = opts.area;
      if (opts.mod != null) this.run.mod = opts.mod;
      if (opts.companion !== undefined) this.run.companion = opts.companion;
      if (opts.form != null) this.run.form = opts.form;
      if (opts.companionForm != null) this.run.companionForm = opts.companionForm;
      if (opts.seed != null) this.run.seed = opts.seed | 0;
      else if (!this.debug.seedLocked) {
        // UI 起局：每局随机种子——连打三局必不同（URL ?seed= 时锁定以复现）
        this.run.seed = (Date.now() ^ (Math.random() * 0xFFFFFFFF)) | 0;
      }
      if (!this.run.char) this.run.char = 'kaf';
      /* 招募角色解锁检查（UI 已拦截；URL 直开只提示不阻止——调试自由） */
      const charDef = KUP.CHAR(this.run.char);
      if (charDef.recruit && KUP.META && !KUP.META.isCharUnlocked(charDef.id)) {
        console.warn('[KUP] 招募角色 ' + charDef.name + ' 尚未加入（' + KUP.I18N.tv(charDef.unlock.desc) + '）——URL 调试直开。');
      }
      /* 番街解锁检查（UI 已拦截；URL 直开只提示不阻止——调试自由） */
      if (KUP.META && !KUP.META.isUnlocked(this.run.area)) {
        console.warn('[KUP] 番街 ' + this.run.area + ' 復興率未达 ' + KUP.META.thresholdOf(this.run.area) + '%（当前 ' + KUP.META.total() + '%）——URL 调试直开。');
      }
      /* 同伴（復興課課員 等）：未招募则不带同行 */
      if (this.run.companion && KUP.META && !KUP.META.isCompanionUnlocked(this.run.companion)) {
        console.warn('[KUP] 同伴 ' + this.run.companion + ' 尚未加入（未满足招募条件），本局单独出击。');
        this.run.companion = null;
      }
      /* 形態/皮肤必须与角色类型匹配（witch / recruit），否则回落通常形態 */
      const charKind = KUP.charKind(charDef);
      let form = KUP.FORM(this.run.form);
      if (!KUP.formFits(form, charKind)) {
        console.warn('[KUP] 形態 ' + form.id + ' 不适用于 ' + charKind + '，回落通常形態。');
        this.run.form = 'none';
        form = KUP.FORM('none');
      }
      let companionForm = KUP.FORM(this.run.companionForm);
      if (!KUP.formFits(companionForm, 'companion')) { this.run.companionForm = 'none'; companionForm = KUP.FORM('none'); }
      this.applyRun(true); // 重设随机流 + 生成本局街区布景

      const def = charDef;
      this.lastChar = def.id; // 记录最近游玩角色，供重开使用
      this.lastRun = { char: def.id, area: this.run.area, mod: this.run.mod, companion: this.run.companion, form: this.run.form, companionForm: this.run.companionForm };
      /* 本局唯一 id：结算幂等键（同一局不会被重复计入復興率/市民票）。
       * 时间 + 随机后缀，避免同一毫秒内连开两局撞号。 */
      this.run.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      /* 把本局配置写进当前槽位：刷新页面后「再次净化」也能还原上次的番街/角色/皮肤 */
      if (KUP.META) KUP.META.setLastRun(this.lastRun);
      this.reset();
      const recruit = KUP.COMPANION(this.run.companion);
      this.recruit = recruit;
      const shopMods = KUP.META ? KUP.META.shopMods() : {};
      this.shopMods = shopMods;
      this.player = new KUP.Player(def, this.mods, {
        form: form,
        recruit: recruit,
        recruitForm: companionForm,
        perk: recruit ? recruit.perk : null,
        shopMods: shopMods,
      });
      /* 同伴 perk：周期回复（regen）在 update 中结算；gather 已在 Player.recompute 内生效 */
      if (recruit && recruit.perk.type === 'regen') {
        this.regenEvery = recruit.perk.every || 20;
        this.regenPct = recruit.perk.pct || 0.04;
        this.regenT = this.regenEvery;
      }
      this.player.weapons.push(new WeaponRuntime(KUP.WEAPONS[def.weapon], 1));
      /* 瞄准模式（v0.8）：'auto' 自动瞄准（默认）／'mouse' 指针／'move' 移动方向 */
      this.player.aimMode = this.run.aim || 'auto';
      /* 调试：?w=toss,bomb,mine 追加初始武器（验证新武器组） */
      if (this.debug.w) {
        for (const id of String(this.debug.w).split(',')) {
          const wd = KUP.WEAPONS[id.trim()];
          if (wd && !this.player.weapons.some(w => w.def.id === wd.id) && this.player.weapons.length < 5) {
            this.player.weapons.push(new WeaponRuntime(wd, 5));
          }
        }
      }
      if (this.debug.lv > 1) { this.level = this.debug.lv; }
      /* 瓦利斯局外强化：开局等级 / 浄化の歌充能 */
      if (shopMods.startLevel) this.level = Math.max(this.level, 1 + shopMods.startLevel);
      if (shopMods.startUlt) this.ult.charge = Math.min(100, this.ult.charge + shopMods.startUlt);
      if (this.debug.god) this.player.invuln = true;
      if (this.debug.dmg > 0) this.player.dmgMult *= this.debug.dmg; // 调试：伤害倍率
      if (this.debug.hurt > 0) { // 调试：初始残血（验证 HP 恢复）
        this.player.hp = Math.max(1, Math.round(this.player.hp * (1 - this.debug.hurt)));
      }
      this.cam.x = this.clampCam(this.player.x - this.view.w / 2, this.view.w);
      this.cam.y = this.clampCam(this.player.y - this.view.h / 2, this.view.h);
      this.state = 'playing';
      KUP.Audio.init(); KUP.Audio.resume(); KUP.Audio.startBGM();
      KUP.UI.showScreen(null);
      KUP.UI.showHUD(true);
      /* 「Q 発生」：关卡包装（动画/游戏亦出现的『Q』＝怪異事件） */
      const ch = this.area.chapter ? ' · ' + KUP.I18N.tv(this.area.chapter) : '';
      KUP.UI.banner(KUP.I18N.t('banner.q', { name: KUP.I18N.tv(this.area.name) + ch }), 2.4);
      if (this.debug.xp > 0) this.addXP(this.debug.xp); // 调试：立即升级
    }

    clampCam(v, viewSize) {
      const A = C.ARENA;
      if (A <= viewSize) return (A - viewSize) / 2;
      return U.clamp(v, 0, A - viewSize);
    }

    update(dt) {
      this.time += dt;
      const p = this.player;
      p.update(dt, this);
      for (const w of p.weapons) w.update(dt, this);
      this.director(dt);
      // 调试：?gem=heal 周期生成指定音片（验证 HP 恢复第二路径）
      if (this.debug.gem) {
        this._gemT = (this._gemT || 0) - dt;
        if (this._gemT <= 0) {
          this._gemT = 1.2;
          this.gems.push(new KUP.Gem(p.x + U.rand(-60, 60), p.y + U.rand(-60, 60), 0,
            this.debug.gem === 'heal' ? 'heal' : 'xp'));
        }
      }
      // 章节演出视野遮蔽计时
      if (this.fogBoostT > 0) this.fogBoostT -= dt;
      /* 同伴 perks：天祢亜留「救済の前奏」——周期回复 */
      if (this.regenEvery > 0) {
        this.regenT -= dt;
        if (this.regenT <= 0) {
          this.regenT = this.regenEvery;
          const amt = Math.round(p.maxhp * this.regenPct);
          if (p.hp < p.maxhp) {
            p.hp = Math.min(p.maxhp, p.hp + amt);
            this.addText(p.x, p.y - 26, '+' + amt, '#8fa8ff', 13);
            KUP.Audio.sfx('heal');
          }
        }
      }

      this.updateBossBehavior(dt); // js/director.js

      for (const e of this.enemies) e.update(dt, this);
      for (const pr of this.projs) pr.update(dt, this);
      this.collide();
      for (const r of this.rings) r.update(dt, this);
      for (const b of this.beams) b.update(dt);
      /* 随时间持续回血（被动「余韵之癒」＋瓦利斯「薬膳スープ」＋道具「余韵の符」） */
      const pl = this.player;
      if (pl) {
        pl.tickBuffs(dt);
        const rg = pl.effRegen();
        if (rg > 0 && pl.hp > 0 && pl.hp < pl.maxhp) pl.hp = Math.min(pl.maxhp, pl.hp + rg * dt);
      }
      for (const z of this.zones) z.update(dt, this);
      for (const ts of this.tosses) ts.update(dt, this);
      for (const dg of this.dangers) dg.update(dt, this);
      for (const g of this.gems) g.update(dt, this);
      for (const pt of this.parts) pt.update(dt);
      for (const tx of this.texts) tx.update(dt);

      // 清理
      this.enemies = this.enemies.filter(e => !e.dead);
      this.projs = this.projs.filter(pr => !pr.dead);
      this.gems = this.gems.filter(g => !g.dead);
      this.rings = this.rings.filter(r => !r.dead);
      this.beams = this.beams.filter(b => !b.dead);
      this.zones = this.zones.filter(z => !z.dead);
      this.tosses = this.tosses.filter(t => !t.dead);
      this.dangers = this.dangers.filter(d => !d.dead);
      /* 敌袭预警 HUD：有未生效的 Danger 贴近玩家时提示 */
      this.dangerNear = this.dangers.some(d => !d.armed && d.nearPlayer(this.player));
      this.parts = this.parts.filter(pt => !pt.dead);
      this.texts = this.texts.filter(tx => !tx.dead);
      /* 滞留区域上限（防布局爆量） */
      if (this.zones.length > 140) this.zones.splice(0, this.zones.length - 140);
      if (this.dangers.length > 90) this.dangers.splice(0, this.dangers.length - 90);

      // 相机
      const tx = this.clampCam(p.x - this.view.w / 2, this.view.w);
      const ty = this.clampCam(p.y - this.view.h / 2, this.view.h);
      const k = Math.min(1, C.CAM_LERP * dt);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
      this.cam.shake = Math.max(0, this.cam.shake - 14 * dt);

      if (this.boss) KUP.UI.updateBoss(this.boss);
    }

    /* ---------- 碰撞 ---------- */
    collide() {
      const p = this.player;
      // 敌人接触玩家
      if (p.hitT <= 0) {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (U.dist2(e.x, e.y, p.x, p.y) < Math.pow(e.r + p.r, 2)) {
            this.hurtPlayer(e.dmg);
            break;
          }
        }
      }
      // 弹幕 vs 敌人
      for (const pr of this.projs) {
        if (pr.dead) continue;
        for (const e of this.enemies) {
          if (e.dead || pr.hits.has(e)) continue;
          if (U.dist2(pr.x, pr.y, e.x, e.y) < Math.pow(e.r + pr.r, 2)) {
            pr.hits.add(e);
            this.damageEnemy(e, pr.dmg, pr.vx * 0.12, pr.vy * 0.12);
            if (pr.split) { this.spawnSplit(pr); pr.split = 0; }
            if (pr.pierce <= 0) { pr.dead = true; break; }
            pr.pierce--;
          }
        }
      }
    }

    spawnSplit(pr) {
      for (let i = 0; i < 2; i++) {
        const a = U.rng() * U.TAU;
        this.projs.push(new KUP.Projectile(pr.x, pr.y, Math.cos(a) * 320, Math.sin(a) * 320, {
          dmg: pr.dmg * 0.5, r: 4, life: 0.7, pierce: 0, homing: 6.5, color: pr.color, kind: 'note',
        }));
      }
    }

    damageEnemy(e, dmg, kx, ky) {
      if (e.dead) return;
      e.hp -= dmg;
      e.flash = 0.09;
      if (kx) { e.kx += kx; e.ky += ky; }
      if (this.texts.length < C.MAX_TEXTS) {
        this.addText(e.x, e.y - e.r - 4, String(Math.round(dmg)),
          dmg >= 40 ? '#ffd25a' : '#fff', dmg >= 40 ? 15 : 12);
      }
      if (e.hp <= 0) this.killEnemy(e);
    }

    killEnemy(e) {
      if (e.dead) return;
      e.dead = true;
      this.kills++;
      /* 浄化の歌充能（击破充能） */
      this.ult.charge = Math.min(100, this.ult.charge + (e.boss ? 30 : e.elite ? 12 : 2));
      /* 吸音（被动 drain）：击破回复——精英 ×4、Boss ×10 */
      const p = this.player;
      if (p.drainPct > 0) {
        const mul = e.boss ? 10 : e.elite ? 4 : 1;
        const heal = Math.max(1, Math.round(p.maxhp * p.drainPct * mul));
        if (p.hp < p.maxhp) {
          p.hp = Math.min(p.maxhp, p.hp + heal);
          if (U.rng() < 0.5) this.addText(p.x, p.y - 26, '+' + heal, '#ff8ac4', 13);
        }
      }
      const n = e.boss ? 40 : e.elite ? 24 : 8;
      for (let i = 0; i < n; i++) {
        const a = U.rng() * U.TAU, sp = U.rand(40, e.boss ? 340 : 180);
        this.parts.push(new KUP.Particle(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp,
          U.rand(0.3, 0.7), e.def.color, U.rand(1.5, 3.5)));
      }
      if (e.boss) {
        this.shake(14);
        KUP.Audio.sfx('boss');
        this.victory();
        return;
      }
      KUP.Audio.sfx(e.elite ? 'boom' : 'hit');
      this.dropGem(e.x, e.y, e.xp);
      if (e.elite) {
        this.shake(5);
        this.gems.push(new KUP.Gem(e.x + 16, e.y, 0, 'heal'));
        /* 記憶の卵：精英 20% 掉落（对局中拾取） */
        if (U.rng() < 0.2) this.gems.push(new KUP.Gem(e.x - 16, e.y, 0, 'egg'));
      }
    }

    dropGem(x, y, xp) {
      const val = Math.max(1, Math.round(xp * this.mods.dropRate));
      if (this.gems.length >= C.MAX_GEMS) {
        const g = this.gems[(U.rng() * this.gems.length) | 0];
        if (g.type === 'xp') g.xp += val;
        return;
      }
      this.gems.push(new KUP.Gem(x, y, val));
    }

    /* 記憶の卵拾取 → 解锁记忆片段 + 復興率 +1%（meta.js） */
    onEggCollected(gem) {
      const p = this.player;
      this.eggCount++;
      const frag = KUP.META.addEgg();
      if (frag) this.fragUnlocked = frag;
      this.addText(p.x, p.y - 30, KUP.I18N.t('hud.egg'), '#ffe89a', 15);
      KUP.Audio.sfx('egg');
      if (frag) KUP.UI.banner(KUP.I18N.t('banner.frag', { t: KUP.I18N.tv(frag.title) }), 2.2);
    }

    /* ---------- 浄化の歌（清屏大招，第2话副标题 ★） ----------
     * 击破充能满 100 → Space 释放：净化冲击环 + 清除**全部敌方攻击（Danger）** + 短暂无敌 */
    castUltimate() {
      if (this.state !== 'playing') return;
      const p = this.player, u = this.ult;
      if (!p || p.hp <= 0 || u.charge < 100) return;
      u.charge = 0;
      p.hitT = Math.max(p.hitT, 1.2);
      this.rings.push(new KUP.Ring(p.x, p.y, {
        maxR: 950, speed: 700, dmg: 120 * p.dmgMult, kb: 260, color: '#9ff3ff',
      }));
      /* 冲散敌方攻击：音波环/光束/毒区/空爆一并净化（v0.8：Danger 统一清除） */
      for (const d of this.dangers) if (d.kind !== 'bomb' || d.armed) d.dead = true;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * U.TAU;
        this.parts.push(new KUP.Particle(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30,
          Math.cos(a) * 320, Math.sin(a) * 320, 0.8, '#bff7ff', 3.2));
      }
      this.shake(10);
      KUP.UI.banner(KUP.I18N.t('banner.ult'), 2);
      KUP.Audio.sfx('ult');
    }

    addText(x, y, txt, color, size) {
      this.texts.push(new KUP.FloatText(x, y, txt, color, size));
    }

    addXP(v) {
      this.xp += v * this.player.xpMult * this.mods.xpGain;
      while (this.xp >= KUP.XP_NEXT(this.level)) {
        this.xp -= KUP.XP_NEXT(this.level);
        this.level++;
        this.pendingLevels++;
      }
      if (this.pendingLevels > 0 && this.state === 'playing') this.openLevelUp();
    }

    /* ---------- 受伤结算（v0.8：回避 → 护盾 → 生命；反響被动触发） ---------- */
    hurtPlayer(d) {
      const p = this.player;
      if (p.invuln || p.hitT > 0) return;
      p.noHitT = 0;
      /* 残響回避（被动 dodge ＋瓦利斯「常連の勘」＋道具「無傷の符」）：完全回避 */
      const dc = p.effDodge();
      if (dc > 0 && U.rng() < dc) {
        this.addText(p.x, p.y - 24, KUP.I18N.t('hud.dodge'), '#c9ffe8', 14);
        KUP.Audio.sfx('select');
        /* 「無傷の譜」：回避成功时回流音片回血 */
        if (p.missHeal > 0 && p.hp < p.maxhp) {
          const heal = Math.max(1, Math.round(p.maxhp * p.missHeal));
          p.hp = Math.min(p.maxhp, p.hp + heal);
          this.addText(p.x, p.y - 40, '+' + heal, '#8affc9', 12);
        }
        p.hitT = C.PLAYER_HIT_CD * 0.5;
        return;
      }
      let rest = d;
      /* 防音护盾（被动 shield）：先吃伤害 */
      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, rest);
        p.shield -= absorbed;
        rest -= absorbed;
        this.addText(p.x, p.y - 34, '-' + Math.round(absorbed), '#8fd0ff', 12);
      }
      if (rest > 0) {
        p.hp -= rest;
        this.addText(p.x, p.y - 22, '-' + Math.round(rest), '#ff5a7a', 14);
      }
      p.hitT = C.PLAYER_HIT_CD;
      p.flash = 0.25;
      this.shake(4);
      KUP.Audio.sfx('hurt');
      /* 反響（被动 retaliate）：受击迸发冲击环反击 */
      if (p.retaliateDmg > 0) {
        this.rings.push(new KUP.Ring(p.x, p.y, {
          maxR: 120 + 12 * (p.passives.retaliate || 0), speed: 460, dmg: p.retaliateDmg * p.dmgMult, kb: 150, color: '#ffb25a',
        }));
      }
      if (p.hp <= 0) { p.hp = 0; this.gameOver(); }
    }

    /* 冲刺（Shift / HUD 按钮）：主动回避，带无敌帧 */
    tryDash() {
      if (this.state !== 'playing' || !this.player) return false;
      const ok = this.player.dash();
      if (ok) this.addText(this.player.x, this.player.y - 26, KUP.I18N.t('hud.dash'), '#bfefff', 13);
      return ok;
    }

    /* ---------- 瞄准（v0.8）----------
     * 非自动瞄准类武器（追唱の矢 follow／音枪 lance）原先只朝「移动方向」发射，手感受限。
     * 现在统一走 aimDir()，三种模式（HUD/`V` 键切换，URL `?aim=` 指定）：
     *   'auto'   自动瞄准最近的怪异（默认；范围内无敌人时退回移动方向）
     *   'mouse'  跟随指针（更自由的瞄准；触屏按住即指向该处）
     *   'move'   跟随移动方向（旧行为，供习惯者使用） */
    aimDir(p, opt) {
      opt = opt || {};
      const mode = (p && p.aimMode) || this.run.aim || 'auto';
      if (mode === 'mouse') {
        const wx = KUP.Input.mx + this.cam.x, wy = KUP.Input.my + this.cam.y;
        const dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy);
        if (d > 6) return { x: dx / d, y: dy / d };
      }
      if (mode === 'auto' || mode === 'mouse') {
        const e = this.nearestEnemy(p.x, p.y);
        if (e) {
          const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
          const maxR = opt.maxRange || 900;   // 太远则退回移动方向，避免"对着远处空放"
          if (d <= maxR) return { x: dx / d, y: dy / d };
        }
      }
      return { x: p.aim.x, y: p.aim.y };
    }
    /* 切换瞄准模式（HUD 按钮 / V 键） */
    cycleAim() {
      const order = ['auto', 'mouse', 'move'];
      const cur = this.run.aim || 'auto';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      this.run.aim = next;
      if (this.player) this.player.aimMode = next;
      KUP.UI.banner(KUP.I18N.t('aim.switch', { mode: KUP.I18N.t('aim.' + next) }), 1.4);
      KUP.Audio.sfx('select');
      return next;
    }

    shake(v) { this.cam.shake = Math.min(14, Math.max(this.cam.shake, v)); }

    nearestEnemy(x, y) {
      let best = null, bd = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = U.dist2(x, y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }

    /* ---------- 升级三选一 ---------- */
    openLevelUp() {
      this.state = 'levelup';
      this.choices = this.rollChoices();
      KUP.UI.showLevelUp(this.choices, this.level);
      KUP.Audio.sfx('levelup');
    }

    /* ---------- 升级三选一（v0.10：分桶保底／重掷／封禁） ----------
     * 抽取顺序：
     *   1. 覚醒卡优先（满级初期武装；与既有行为一致）
     *   2. **分桶保底**：武器／被动／道具 三桶各取一张（尽量凑齐「新武器·成长·应急」）
     *   3. 余下空位从其余候选随机补足 → 4. 仍不足则 heal 兜底
     * 封禁（`this.banned`）在候选构造阶段过滤；重掷（`this.rerolls`）重新抽取。 */
    rollChoices() {
      const p = this.player;
      const ownedW = p.weapons.map(w => w.def.id);
      const banned = this.banned || new Set();
      const buckets = { awaken: [], weapon: [], passive: [], item: [] };
      /* 武器桶：新武器 / 武器升级（セットリスト上限 5 ◇：武器槽 5）
       * v0.11「武装解锁」：未招募对应角色前，其专属武器不入池（META.isWeaponUnlocked）。 */
      if (ownedW.length < 5) {
        for (const id in KUP.WEAPONS) {
          if (ownedW.indexOf(id) < 0 && !banned.has(id) &&
              (!KUP.META || KUP.META.isWeaponUnlocked(id))) buckets.weapon.push({ kind: 'weapon-new', id });
        }
      }
      for (const w of p.weapons) {
        if (!w.evolved && w.lv < w.def.maxLv && !banned.has(w.def.id)) buckets.weapon.push({ kind: 'weapon-up', id: w.def.id });
      }
      /* 覚醒 ★（REGENERATE「魔女の娘へと覚醒する場面」）：满级且未觉醒 → 优先展示 */
      for (const w of p.weapons) {
        if (!w.evolved && w.lv >= w.def.maxLv && w.def.evolved && !banned.has(w.def.id)) buckets.awaken.push({ kind: 'awaken', id: w.def.id });
      }
      /* 被动桶：已持有可升级 + 未持有（槽位未满时） */
      const ownedP = Object.keys(p.passives);
      for (const id of ownedP) {
        if (p.passives[id] < KUP.PASSIVES[id].maxLv && !banned.has(id)) buckets.passive.push({ kind: 'passive-up', id });
      }
      if (ownedP.length < 5) {
        for (const id in KUP.PASSIVES) {
          if (!(id in p.passives) && !banned.has(id)) buckets.passive.push({ kind: 'passive-new', id });
        }
      }
      /* 道具桶 ★（v0.8）：护盾/MISS/回血符——不占被动槽、可重复选 */
      for (const id in KUP.ITEMS) if (!banned.has(id)) buckets.item.push({ kind: 'item', id });
      /* 血线危险时提高生存道具权重（同一条目重复入桶＝权重更高） */
      if (p.hp < p.maxhp * 0.45) {
        buckets.item.push({ kind: 'item', id: 'salve' }, { kind: 'item', id: 'ward' }, { kind: 'item', id: 'veil' });
      }

      const out = [], used = new Set();
      const take = c => {
        if (!c || used.has(c.kind + ':' + c.id)) return false;
        used.add(c.kind + ':' + c.id); out.push(c); return true;
      };
      if (buckets.awaken.length) take(U.pick(buckets.awaken));         // 1. 覚醒优先
      /* 2. 分桶保底：血线危险时「生存优先」——道具占 2 格且优先抽取 */
      const hurt = p.hp < p.maxhp * 0.45;
      const quotas = { weapon: 1, passive: 1, item: hurt ? 2 : 1 };
      const order = hurt ? ['item', 'weapon', 'passive'] : ['weapon', 'passive', 'item'];
      for (const key of order) {
        for (let n = 0; n < quotas[key] && out.length < 3; n++) {
          for (const c of U.shuffle(buckets[key].slice())) { if (take(c)) break; }
        }
      }
      if (out.length < 3) {                                            // 3. 补足
        for (const c of U.shuffle([].concat(buckets.weapon, buckets.passive, buckets.item))) {
          if (out.length >= 3) break;
          take(c);
        }
      }
      while (out.length < 3) out.push({ kind: 'heal' });               // 4. 兜底
      U.shuffle(out);   // 位置随机：避免「闭眼点第一格」
      // 调试：?pick=heart,heal,ward 强制指定升级选项（确定性验证；支持被动/武器/道具 id）
      if (this.debug.pick) {
        const mk = s => s === 'heal' ? { kind: 'heal' }
          : (KUP.ITEMS[s] ? { kind: 'item', id: s }
          : (KUP.PASSIVES[s] ? { kind: (s in p.passives) ? 'passive-up' : 'passive-new', id: s }
          : (KUP.WEAPONS[s] && ownedW.indexOf(s) < 0 ? { kind: 'weapon-new', id: s } : null)));
        const forced = this.debug.pick.split(',').map(mk).filter(Boolean);
        for (let i = 0; i < forced.length && i < 3; i++) out[i] = forced[i];
      }
      return out;
    }

    /* 重掷（v0.10）：重新抽取本次三选一，消耗 1 次（`R` 键 / HUD 按钮） */
    rerollChoices() {
      if (this.state !== 'levelup') return false;
      if (!(this.rerolls > 0)) return false;
      this.rerolls--;
      this.choices = this.rollChoices();
      KUP.UI.showLevelUp(this.choices, this.level);
      KUP.Audio.sfx('select');
      return true;
    }

    /* 封禁（v0.10）：本局不再出现该选项，并把该格立即换成新候选（`✕` 按钮 / `B`+数字） */
    banChoice(i) {
      if (this.state !== 'levelup' || !this.choices || !this.choices[i]) return false;
      const c = this.choices[i];
      if (!c.id) return false;                      // heal 等无 id 的选项不可封禁
      if (!this.banned) this.banned = new Set();
      this.banned.add(c.id);
      const others = this.choices.filter((_, k) => k !== i);
      const used = new Set(others.map(x => x.kind + ':' + x.id));
      const repl = this.rollChoices().find(x =>
        (x.kind === 'heal' || !used.has(x.kind + ':' + x.id)) && (!x.id || !this.banned.has(x.id)));
      this.choices[i] = repl || { kind: 'heal' };
      KUP.UI.showLevelUp(this.choices, this.level);
      KUP.Audio.sfx('hurt');
      return true;
    }

    choose(i) {
      if (this.state !== 'levelup' || !this.choices || !this.choices[i]) return;
      const c = this.choices[i], p = this.player;
      if (c.kind === 'weapon-up') {
        const w = p.weapons.find(w => w.def.id === c.id);
        if (w) w.lv++;
      } else if (c.kind === 'weapon-new') {
        p.weapons.push(new WeaponRuntime(KUP.WEAPONS[c.id], 1));
      } else if (c.kind === 'passive-up' || c.kind === 'passive-new') {
        p.addPassive(c.id);
        if (c.id === 'heart') {
          // 系譜の心：升级时回满，与描述「（并回满）」一致 —— 修复 HP 不恢复 BUG
          p.hp = p.maxhp;
          this.addText(p.x, p.y - 26, 'MAX HP', '#7dff9a', 15);
          KUP.Audio.sfx('heal');
        }
      } else if (c.kind === 'awaken') {
        // 覚醒：武器化为乐曲名的进化形态 + 觉醒演出
        const w = p.weapons.find(w => w.def.id === c.id);
        if (w && !w.evolved) {
          w.evolved = true;
          this.rings.push(new KUP.Ring(p.x, p.y, {
            maxR: 170, speed: 380, dmg: 0, kb: 0, color: w.def.color,
          }));
          for (let j = 0; j < 24; j++) {
            const a = U.rng() * U.TAU;
            this.parts.push(new KUP.Particle(p.x, p.y, Math.cos(a) * U.rand(80, 220), Math.sin(a) * U.rand(80, 220),
              0.8, w.def.color, U.rand(2, 3.5)));
          }
          this.shake(6);
          this.addText(p.x, p.y - 30, 'AWAKEN', '#ffe08a', 16);
          KUP.UI.banner(KUP.I18N.t('banner.awaken', { name: KUP.I18N.tv(w.def.evolved.name) }), 2.4);
          KUP.Audio.sfx('awaken');
        }
      } else if (c.kind === 'item') {
        /* 局内道具：护盾＝立即加盾／MISS＝限时回避／治癒＝立即回血／余韵＝限时回血 */
        const it = KUP.ITEMS[c.id];
        if (it) {
          if (it.kind === 'shield') {
            p.addShield(it.amount);
            this.addText(p.x, p.y - 26, '+' + it.amount + ' 🛡', '#8fd0ff', 15);
          } else if (it.kind === 'heal') {
            p.hp = Math.min(p.maxhp, p.hp + p.maxhp * it.amount);
            this.addText(p.x, p.y - 26, '+HP', '#7dff9a', 15);
          } else if (it.kind === 'miss') {
            p.addBuff('miss', it.seconds, it.amount);
            this.addText(p.x, p.y - 26, 'MISS +' + Math.round(it.amount * 100) + '%', '#c9ffe8', 15);
          } else if (it.kind === 'regen') {
            p.addBuff('regen', it.seconds, it.amount);
            this.addText(p.x, p.y - 26, '+' + it.amount + '/s', '#8affc9', 15);
          } else if (it.kind === 'magnet') {
            /* v0.11 经验磁铁：限时全场吸引（时长可叠加） */
            p.addBuff('magnet', it.seconds, 1);
            this.addText(p.x, p.y - 26, KUP.I18N.t('item.magnet.text', { s: it.seconds }), '#5ad0ff', 15);
          }
          KUP.Audio.sfx('heal');
        }
      } else if (c.kind === 'heal') {
        p.hp = Math.min(p.maxhp, p.hp + p.maxhp * 0.4);
        this.addText(p.x, p.y - 26, '+HP', '#7dff9a', 15);
        KUP.Audio.sfx('heal');
      }
      this.pendingLevels--;
      KUP.Audio.sfx('select');
      if (this.pendingLevels > 0) {
        this.choices = this.rollChoices();
        KUP.UI.showLevelUp(this.choices, this.level);
      } else {
        this.choices = null;
        this.state = 'playing';
        p.hitT = Math.max(p.hitT, 0.8); // 升级后短暂无敌，避免恢复瞬间被围殴
        KUP.UI.showScreen(null);
      }
    }

    /* ---------- 胜负 ---------- */
    gameOver() {
      if (this.state === 'over' || this.state === 'victory') return;
      this.state = 'over';
      /* 復興率结算（败北也计上 1% 观测数据）＋市民票收入 */
      this.metaResult = KUP.META.addRunResult(this.run.area, false, this.runStats());
      KUP.Audio.stopBGM();
      KUP.Audio.sfx('boss');
      KUP.UI.showEnd(false, this.stats());
    }
    victory() {
      if (this.state === 'victory') return;
      this.state = 'victory';
      /* 記憶の卵：击破 Boss 必得（结算屏无法再拾取，直接结算） */
      if (!this.eggGain) {
        this.eggGain = 1;
        this.fragUnlocked = KUP.META.addEgg() || this.fragUnlocked;
      }
      /* 復興率结算（首通 +12% / 重复 +2% / 計上 +1%）＋市民票收入 */
      this.metaResult = KUP.META.addRunResult(this.run.area, true, this.runStats());
      KUP.Audio.stopBGM();
      KUP.Audio.sfx('levelup');
      KUP.UI.showEnd(true, this.stats());
    }
    /* 结算用的局内统计（復興率 + 市民票收入）
     * runId 是结算幂等键：META.addRunResult 用它保证同一局只结算一次。 */
    runStats() {
      return {
        runId: this.run.id || null,
        kills: this.kills,
        eggs: this.eggCount + this.eggGain,
        areaIdx: KUP.META ? KUP.META.areaIndex(this.run.area) : 0,
        time: this.time,
      };
    }
    stats() {
      return {
        time: this.time, kills: this.kills, level: this.level, witch: this.player.def.name,
        /* run 元信息：结算「復興率」用；由 ?seed=&area=&mod= 复现同一局 */
        area: KUP.I18N.tv(this.area.name), mod: KUP.I18N.tv(this.mod.name),
        seed: this.run.seed,
        areaId: this.run.area,
        eggs: this.eggCount + this.eggGain,
        bossEnraged: !!this.bossEnraged,
        bossName: this.boss ? KUP.I18N.tv(this.boss.def.name) : null,
        /* 形態/皮膚/同伴：结算与调试用 */
        form: this.player.form.id,
        formLabel: KUP.I18N.tv(this.player.form.name),
        companion: this.recruit ? this.recruit.name : null,
        companionForm: this.player.recruitForm.id,
        companionFormLabel: KUP.I18N.tv(this.player.recruitForm.name),
      };
    }
  }

  KUP.Game = Game;
})();
