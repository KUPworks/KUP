window.KUP = window.KUP || {};

/* ================= 核心玩法 =================
 * 生成导演/渲染已拆分至 js/director.js、js/render.js（混入 Game 原型）。
 * 新系统（v0.4.0-loop）：覚醒/进化、浄化の歌大招、記憶の卵、復興率结算、结局分歧、每局随机种子。 */
(function () {
  const U = KUP.U, C = KUP.CONFIG;
  const DEG = Math.PI / 180;   // 数据表的「角度」一律以**度**书写，运行时换算为弧度

  /* ---------- 楼体空间索引（v0.13.1）----------
   * 楼体散布在 3000×3000 竞技场里，碰撞/可站立/绕行前视原本都要**全表扫描**
   * 上百栋楼；绕行转向每次要试探十几个方向，全表扫描会成为每帧的主要开销。
   * 这里按「街区格」分桶（桶边长 = CITY.GRID，楼体最长边 < 桶边长，故每桶只装
   * 少数几栋），查询时只遍历与包围盒相交的桶。纯几何派生、无随机 ⇒ 同 seed 同图。
   * 注：查询用的包围盒必须**包含判定半径**（含 MIN_GAP），否则会漏掉跨桶的楼。 */
  const cityIndex = (A, blocks, cellSize) => {
    const bn = Math.max(1, Math.ceil(A / cellSize));
    const buckets = new Array(bn * bn);
    for (let i = 0; i < buckets.length; i++) buckets[i] = [];
    for (const b of blocks) {
      const x0 = U.clamp(Math.floor(b.x / cellSize), 0, bn - 1);
      const x1 = U.clamp(Math.floor((b.x + b.w) / cellSize), 0, bn - 1);
      const y0 = U.clamp(Math.floor(b.y / cellSize), 0, bn - 1);
      const y1 = U.clamp(Math.floor((b.y + b.h) / cellSize), 0, bn - 1);
      for (let by = y0; by <= y1; by++) for (let bx = x0; bx <= x1; bx++) buckets[by * bn + bx].push(b);
    }
    return { bn, bcell: cellSize, buckets };
  };
  /* 查询暂存数组（避免每帧分配）：NB ＝ 碰撞/可站立查询用；NS ＝ 绕行前视用。
   * 两者必须分开——绕行前视会在自己的循环里连续查询，共用会被后一次查询冲掉。 */
  const NB = [], NS = [];

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
    /* 模组（behavior）注册表项：几何常数、可用参数键、以及**哪些键随「范围」放大**。
     * 见 js/data/weapon.js KUP.WEAPON_MODULES——加武器/调参/改「范围」生效面都只动那里。 */
    mod() {
      if (!this._mod) this._mod = KUP.MODULE(this.def.behavior) || { id: this.def.behavior, base: {}, area: [], params: [] };
      return this._mod;
    }
    /* 等级表 → 模组基准值 → 兜底；再把「范围」按模组声明乘上去。
     * 例：len 在 slash 的 area 列表里 ⇒ 自动 ×player.areaMult（判定与刀光同时变长）。
     * raw：直接给定的值（嵌套在等级表里的参数，如 wave.r）；给了 raw 就优先用它。 */
    val(key, p, fallback, raw) {
      const s = this.stat(), b = this.mod().base;
      const v = raw !== undefined ? raw : (s[key] !== undefined ? s[key] : (b[key] !== undefined ? b[key] : fallback));
      return this.mod().area.indexOf(key) >= 0 ? v * p.areaMult : v;
    }

    update(dt, game) {
      const p = game.player, s = this.stat(), m = p.cdMult, col = this.def.color;
      const V = (k, d) => this.val(k, p, d);
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
              const sp = V('speed', 400);
              game.projs.push(new KUP.Projectile(p.x, p.y - 6, Math.cos(a) * sp, Math.sin(a) * sp, {
                /* 命中半径 r 随「范围」放大（模组 area 声明）——体积/判定一起长 */
                dmg: s.dmg * p.dmgMult, r: V('r', 7), life: V('life', 2.2), pierce: V('pierce', 0),
                homing: V('homing', 5.2), target, color: col, kind: 'note', split: s.split ? 1 : 0,
              }));
            }
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        case 'orbit': { // レゾナンス・オーブ：环绕音球（**体积／转速／伤害可调**）
          /* v0.15（人类 2026-10-18）：**碰撞检测回到旋转物本身**——只看球心圆
           * （`U.dist2(e, orb) < (e.r + orbR)²`），不再判定「玩家→音球」的扫掠臂。
           * v0.15.1（同日第二次反馈）：**取消径向呼吸**，改为把球**拉得离玩家更近**
           * （环绕半径 84–112 → 46–58）。设计口径（可验算，见 verify-run 的
           * 「orbit 半圈律」断言）：普通破维魔（noise，移速 62）走过**球体直径**
           * 所需时间 t ＝ 2×orbR／62；这段时间里武器恰好转约**半圈**（π rad）⇒
           *   spin ≈ π×62／(2×orbR) ＝ 97.4／orbR。
           * 因为球体逐级变大，角速度逐级**略微下降**（球大一圈＝同样的"半圈"要更慢），
           * 但线速度几乎不变；「冷却」依然按比例放大转速（`spin ÷ cdMult`）。
           * 近距放置的代价是**内圈空出**一小块（R－orbR－敌半径）：把 R 压到 46–58 后，
           * 贴着玩家（约 25px）的敌人仍落在球体可达范围内，所以不再需要用呼吸去补洞。
           * 口径说明：`r`＝环绕半径（吃「范围」）、`orbR`＝球体半径（吃「范围」）、
           *   `spin`＝角速度（吃「冷却」）、`hitCd`＝同一目标的再命中间隔。 */
          const n = Math.max(1, s.count | 0);
          while (this.orbs.length < n) this.orbs.push({ x: p.x, y: p.y, r: V('orbR', 20) });
          while (this.orbs.length > n) this.orbs.pop();
          const Rbase = V('r', 50);
          const orbR = V('orbR', 20);
          const spin = V('spin', 4.8) / Math.max(0.35, p.cdMult);
          const hitCd = V('hitCd', 0.3) * Math.max(0.45, p.cdMult);
          this.angle += spin * dt;
          this.orbR = orbR;
          this.orbitR = Rbase;
          for (let i = 0; i < n; i++) {
            const orb = this.orbs[i];
            const a = this.angle + (U.TAU * i) / n;
            /* 固定环绕半径（v0.15.1 取消径向呼吸）：所有球恒在 Rbase 的圆上等距分布 */
            orb.x = p.x + Math.cos(a) * Rbase;
            orb.y = p.y + Math.sin(a) * Rbase;
            orb.r = orbR;
            /* ★ 判定：**只有球体本身**（圆 vs 圆），不再沿连线做线段判定 */
            for (const e of game.enemies) {
              if (e.dead || e.orbitT > 0) continue;
              const rr2 = e.r + orbR;
              if (U.dist2(e.x, e.y, orb.x, orb.y) < rr2 * rr2) {
                e.orbitT = hitCd;
                game.damageEnemy(e, s.dmg * p.dmgMult, Math.cos(a) * 140, Math.sin(a) * 140);
              }
            }
          }
          break;
        }
        case 'bass': { // テラ・ドロップ：低音冲击环（v0.12：可带**角度参数**做扇形冲击波）
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            /* 圆形波的「角度参数」：数据表 arc 以**度**书写，缺省 360（＝整圆，既有武器不变）。
             * arc < 360 时波只在扇形内判定与绘制；扇形中心取当前瞄准方向（自动/鼠标/移动）。 */
            const ad = game.aimDir(p);
            const bdir = Math.atan2(ad.y, ad.x);
            /* 圆形波的「角度参数」：数据表 arc 以**度**书写，缺省 360（＝整圆，既有武器不变）。
             * arc < 360 时波只在扇形内判定与绘制；扇形中心取当前瞄准方向（自动/鼠标/移动）。 */
            const barc = V('arc', 360) * DEG;
            game.rings.push(new KUP.Ring(p.x, p.y, {
              maxR: V('r', 80), speed: V('speed', 300), dmg: s.dmg * p.dmgMult, kb: V('kb', 170), color: col,
              arc: barc, dir: bdir,
            }));
            if (s.double) {
              game.rings.push(new KUP.Ring(p.x, p.y, {
                maxR: V('r', 80), speed: V('doubleSpeed', 220), dmg: s.dmg * p.dmgMult * V('doubleDmgMul', 0.7),
                kb: V('doubleKb', 140), color: col, arc: barc, dir: bdir,
              }));
            }
            game.shake(3);
            KUP.Audio.sfx('boom');
          }
          break;
        }
        /* ===== v0.12 新武器模组：近战・挥刀（扇形） =====
         * 参数（数据表）：arc＝扇形角度（度）、len＝刀长（px）；
         * Lv4+ 的 wave 会额外放出**扇形冲击波**（复用 Ring 的角度参数）。
         * v0.13.1：太刀的刀光与冲击波都**不画范围框**（Slash 不填扇面、Ring 不补半径边）
         * ——判定照旧，只是不在屏幕上把范围摊开给玩家看（人类 2026-10-16 反馈）。 */
        case 'slash': {
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const ad = game.aimDir(p);
            const dir = Math.atan2(ad.y, ad.x);
            game.slashes.push(new KUP.Slash(p.x, p.y, dir, {
              len: V('len', 100), arc: V('arc', 100) * DEG,
              dmg: s.dmg * p.dmgMult, kb: V('kb', 180), color: col, life: V('life', 0.18),
            }));
            if (s.wave) {
              game.rings.push(new KUP.Ring(p.x, p.y, {
                maxR: this.val('wave.r', p, 120, s.wave.r), speed: this.val('wave.speed', p, 420, s.wave.speed),
                dmg: s.dmg * p.dmgMult * this.val('wave.dmgMul', p, 0.75, s.wave.dmgMul), kb: 120, color: col,
                arc: this.val('wave.arc', p, 120, s.wave.arc) * DEG, dir, edges: false,
              }));
            }
            game.shake(1.5);
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        case 'laser': { // ヴァニッシュ・ビーム：贯穿光束
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            /* v0.14：「双光束」按**最近两个不同的敌人**各发一条；只有一个目标时发**对向**
             * （前后两条直线），不再朝最近敌人张开 0.3rad 的夹角（那样两条都容易落空）。 */
            const nBeam = s.double ? 2 : 1;
            const tg = (nBeam > 1 && game.nearestEnemies) ? game.nearestEnemies(p.x, p.y, nBeam) : [];
            const fallback = Math.atan2(p.aim.y, p.aim.x);
            const e0 = tg[0] || game.nearestEnemy(p.x, p.y);
            const dir = e0 ? Math.atan2(e0.y - p.y, e0.x - p.x) : fallback;
            game.beams.push(new KUP.Beam(p.x, p.y - 4, dir, {
              len: V('len', 400), w: V('w', 8), dmg: s.dmg * p.dmgMult, color: col, game,
            }));
            if (s.double) {
              const e1 = tg[1] || null;
              const dir2 = e1 ? Math.atan2(e1.y - p.y, e1.x - p.x) : dir + Math.PI;
              game.beams.push(new KUP.Beam(p.x, p.y - 4, dir2, {
                len: V('len', 400), w: V('w', 8), dmg: s.dmg * p.dmgMult * V('doubleDmgMul', 0.7), color: col, game,
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
            /* v0.14：齐射方向按「最近 targets 个不同敌人」分配（缺省 2），其余补小角度。
             * 语境：人类要求「射弹类夹角应小一些、不必分射两个敌人」——于是两者都要：
             * ① 多余弹体的补角从 0.16rad（≈9°）降到 0.085rad（≈5°，spread 可调）；
             * ② 若能拿到不同的目标就各打一个（不再对着一个目标撒成扇形）。 */
            const count = s.count | 0;
            const spread = V('spread', 0.085);
            const nTargets = Math.min(count, s.targets !== undefined ? s.targets : 2);
            const base = (() => { const ad = game.aimDir(p); return Math.atan2(ad.y, ad.x); })();
            const targets = game.nearestEnemies ? game.nearestEnemies(p.x, p.y, nTargets) : [];
            const vol = game.volleyAngles(p, count, { base, spread, targets });
            for (let i = 0; i < count; i++) {
              const a = vol.angles[i];
              const sp = V('speed', 560);
              game.projs.push(new KUP.Projectile(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp, {
                /* r 随「范围」放大（命中面积），飞行距离（speed×life）刻意不变 */
                dmg: s.dmg * p.dmgMult, r: V('r', 8), life: V('life', 1.6), pierce: s.pierce, color: col, kind: 'lance',
              }));
            }
            KUP.Audio.sfx('shoot');
          }
          break;
        }
        /* ===== 新武器组：滞留・投掷系 ===== */
        case 'toss': { // 残留音块：**分别投向最近 N 个不同的敌人**，落点留下滞留音场
          this.t -= dt;
          if (this.t <= 0) {
            this.t = s.cd * m;
            const range = V('range', 300);
            /* v0.14（人类 2026-10-17）：「投掷型武器应该向最近的**两个**敌人投掷，而不是
             * 一下投掷两个」。所以这里不再对同一个最近敌人按 spread 撒开，而是：
             *   第 i 个投掷物 → 最近 targets 个不同敌人里的第 i 个；
             *   目标不足时才退回基准方向的对称补角（不会把两个都丢在同一处）。
             * 投掷距离仍按 range 与「到目标距离」取小（太近的目标也能准确命中）。
             * 每个投掷物都要有自己的目标：目标数＝count（最近 count 个不同敌人），
             * 只有实在凑不够（敌人比弹体少）时，多出来的那几个才围绕基准方向补角。 */
            const count = s.count | 0;
            const spread = V('spread', 0.42);
            const nTargets = count;
            const baseDir = Math.atan2(p.aim.y, p.aim.x);
            const targets = game.nearestEnemies ? game.nearestEnemies(p.x, p.y, nTargets) : [];
            const vol = game.volleyAngles(p, count, { base: baseDir, spread, targets });
            for (let i = 0; i < count; i++) {
              const target = targets[i] || null;
              const a = vol.angles[i];
              const d = target
                ? Math.min(range, Math.hypot(target.x - p.x, target.y - p.y))
                : range * 0.7;
              game.tosses.push(new KUP.Toss(p.x, p.y - 6, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
                fly: V('fly', 0.4), color: col, homing: target,
                zone: {
                  r: V('r', 60), dmg: s.dmg * p.dmgMult, life: V('life', 3),
                  kind: 'field', color: col, slow: true, tickRate: V('tickRate', 0.4),
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
            const range = V('range', 300);
            for (let i = 0; i < s.count; i++) {
              const a = U.rng() * U.TAU, d = U.rand(V('minRange', 30), range);
              game.zones.push(new KUP.Zone(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
                r: V('r', 70), dmg: s.dmg * p.dmgMult, arm: V('fuse', 0.95),
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
              /* v0.15.1：地雷拆成**两个半径**——
               *   triggerR（触发半径，缺省 = r × triggerMul 0.6）：敌人踏进这一圈才起爆；
               *   r（爆炸/击杀半径）：起爆时的实际伤害范围，比触发圈大一圈。
               * 这样"踩到"和"被炸到"不再是同一件事：踩进触发圈后，即使立刻被击退，
               * 也已经在爆炸半径内。起爆瞬间会画出两道向外推的圆（见 Zone.detonate）。 */
              const rz = V('r', 70);
              game.zones.push(new KUP.Zone(
                p.x - p.aim.x * V('dropBack', 22) + U.rand(-V('dropJitter', 26), V('dropJitter', 26)),
                p.y - p.aim.y * V('dropBack', 22) + U.rand(-V('dropJitter', 26), V('dropJitter', 26)),
                { r: rz, triggerR: rz * V('triggerMul', 0.6), dmg: s.dmg * p.dmgMult, life: V('life', 8),
                  kind: 'mine', color: col, slow: true, vis: this.def.vis || 1 }));
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
      this._navQ = 0;          // 楼体空间索引的去重标记（见 _near）
      /* 当前 run（一局 = 一次『Q』任務）。URL/UI 只改这里，其余派生状态由 applyRun 生成。 */
      this.run = { id: null, char: null, area: C.DEFAULT_AREA, mod: C.DEFAULT_MOD, seed: C.DEFAULT_SEED,
        companion: null, form: 'none', companionForm: 'none', support: null, aim: 'auto' };
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
      /* 建筑实体开关（v0.11）：?solid=0/1 调试覆盖，默认取 CONFIG.CITY.SOLID */
      this.citySolid = (this.debug && this.debug.solid !== undefined) ? !!this.debug.solid : C.CITY.SOLID;
      this.rng = U.mulberry32(this.run.seed);
      U.rng = this.rng;
      /* v0.18：基础规则乘数单独留一份——不可解空間只在它之上临时叠加 */
      this.baseMods = KUP.modsFor(this.mod.id);
      this.mods = Object.assign({}, this.baseMods);
      if (rebuildCity !== false) this.city = this.buildCity();
    }

    reset() {
      this.player = null;
      this.enemies = []; this.projs = []; this.gems = []; this.rings = []; this.beams = [];
      /* v0.12 近战挥砍（扇形）实体 */
      this.slashes = [];
      this.parts = []; this.texts = [];
      /* 滞留区域 / 投掷物（新武器组与 Boss 共用） */
      this.zones = []; this.tosses = [];
      /* 纯表现层（不参与任何判定）：地雷起爆的向外冲击波等，见 KUP.Shockwave */
      this.fx = [];
      /* 敌方攻击（Danger）：与玩家武器分离，统一预警与高对比外观 */
      this.dangers = [];
      this.dangerNear = false;   // 是否有预警中的敌袭贴近玩家（HUD 提示用）
      this.time = this.debug.t || 0;
      this.kills = 0; this.gemCount = 0;
      /* v0.18.3 暴击统计（结算屏与测试用） */
      this.critCount = 0; this.critMax = 0;
      /* v0.13 治安战（无尽关卡）：模式标记 + 程序化波次状态 */
      this.endless = !!(this.area && this.area.endless);
      this.orderWave = 1;
      this.orderEliteT = C.ENDLESS.ELITE_EVERY;
      this.orderBossT = C.ENDLESS.BOSS_FIRST;
      this.orderBossIdx = 0;
      this.orderScore = 0;
      this.xp = 0; this.level = 1; this.pendingLevels = 0; this.choices = null;
      /* 升级池体验（v0.10）：本局重掷次数与封禁名单 */
      this.rerolls = this.debug.reroll != null ? this.debug.reroll : 3;
      this.banned = new Set();
      this.banMode = false;
      this.cam = { x: 0, y: 0, shake: 0 };
      this.spawnAcc = 0;
      this.eliteIdx = 0;
      /* 章节演出 / 大招 / 記憶の卵（v0.17 局内現象卡）/ 结局分歧 */
      this.evIdx = 0; this.surgeT = 0; this.surgePerSec = 0;
      this.fogBoost = 0; this.fogBoostT = 0;
      this.ult = { charge: 0, cdT: 0, cdMax: 3 };   // cdMax 仅兜底，实际取 KUP.ULTIMATES[*].cdMax
      /* v0.17 記憶の卵（現象卡）：本局是否已抽过（番街一局最多一次）、復活充能、已復活次数 */
      this.eggOffered = false; this.eggCharge = 0; this.eggUsed = 0;
      this._eggLevel = -1; this._eggHit = false;   // 同等级抽卡结果缓存（重掷不刷卵）
      /* v0.18 不可解空間：Boss 出现时按概率进入；觸发体被击破后退回基础规则 */
      this.space = null; this.spaceBoss = null; this.spacePending = null;
      this.spaceT = 0; this.spaceRotT = 0; this.spaceFog = 0; this.spacesSeen = [];
      this.bossSpawned = false; this.boss = null; this.bossEnraged = false;
      this.metaResult = null;
      /* 同伴（魔女候補）的周期回复 */
      this.regenEvery = 0; this.regenPct = 0; this.regenT = 0;
      this.weaponSig = '';
    }

    /* 确定性生成街区布景：由 run.seed 与街区共同决定（含每区主题装饰）
     * v0.11 建筑实体化：楼体改为**道路网格**布局——
     *   竞技场 = GRID×GRID 街区格（15×15），每格至多一栋楼，楼体只占格内
     *   「靠道路一侧留出 ROAD 宽」之后的街区带 ⇒ 任意两楼之间必有 ≥ROAD 通道，
     *   玩家与敌人都不会被困死；哪些格子有楼由 seed 洗牌决定（同 seed 同区同图）。 */
    buildCity() {
      const area = this.area || KUP.AREA(C.DEFAULT_AREA);
      const areaIdx = Math.max(0, KUP.AREAS.indexOf(area));
      /* 布景子流与主随机流分离：同 seed 同区 → 同一张城；换区 → 必换城 */
      const rng = U.mulberry32(((this.run.seed >>> 0) ^ (areaIdx * 0x85EBCA6B)) >>> 0), A = C.ARENA;
      const CT = C.CITY;
      const gn = Math.floor(A / CT.GRID);                   // 每轴格子数（3000/200 = 15）
      const blocks = [];
      const cap = Math.min(area.blocks, gn * gn);           // 楼数上限 = 格子数
      /* 楼数落在「area.blocks 的 80%～100%」：实际可用格远多于 cap（225 格），
       * 稀疏区（陸番街 26 栋）也足够，密度感与旧版基本一致。 */
      const want = Math.round(cap * (0.8 + rng() * 0.2));
      /* 候选格 = 全部格子；洗牌后取前 want 个（确定性 → 同 seed 同图） */
      const cells = [];
      for (let cy = 0; cy < gn; cy++) for (let cx = 0; cx < gn; cx++) cells.push({ cx, cy });
      for (let i = cells.length - 1; i > 0; i--) {
        const j = (rng() * (i + 1)) | 0;
        const t = cells[i]; cells[i] = cells[j]; cells[j] = t;
      }
      for (let i = 0; i < want; i++) {
        const cell = cells[i];
        const gx = cell.cx * CT.GRID, gy = cell.cy * CT.GRID;
        /* 每格内部：楼体贴边留 MARGIN 走廊，外墙侧靠道路留 ROAD；
         * 楼体不超过格内剩余空间的 70%（窄边更小），保证楼间视觉空隙。 */
        const side = rng() < 0.5 ? 'h' : 'v';               // 道路方向（水平/垂直）
        const inner = CT.GRID - CT.ROAD - CT.MARGIN * 2;
        let w, h;
        if (side === 'h') { w = inner * (0.5 + rng() * 0.2); h = inner * (0.45 + rng() * 0.25); }
        else { w = inner * (0.45 + rng() * 0.25); h = inner * (0.5 + rng() * 0.2); }
        w = Math.max(48, Math.min(inner * 0.7, w));
        h = Math.max(48, Math.min(inner * 0.7, h));
        const px = gx + (side === 'h' ? CT.ROAD + CT.MARGIN : CT.MARGIN) + rng() * (CT.GRID - CT.ROAD - CT.MARGIN * 2 - w);
        const py = gy + (side === 'h' ? CT.MARGIN : CT.ROAD + CT.MARGIN) + rng() * (CT.GRID - CT.ROAD - CT.MARGIN * 2 - h);
        blocks.push({
          x: px, y: py, w, h,
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
      return { blocks, glyphs, area, deco, grid: CT.GRID, ...cityIndex(A, blocks, CT.GRID) };
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
      /* v0.13.3：支援物品（取代同伴槽）——局外解锁，出击时选一件 */
      if (opts.support !== undefined) this.run.support = opts.support;
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
      /* 同伴（復興課課員 等）：未招募则不带同行。
       * v0.13.3：彩季詩得先退出（retired）——同伴层暂不登场，支援改由下面的「支援物品」承担 */
      if (this.run.companion && KUP.META && !KUP.META.isCompanionUnlocked(this.run.companion)) {
        console.warn('[KUP] 同伴 ' + this.run.companion + ' 尚未加入（未满足招募条件），本局单独出击。');
        this.run.companion = null;
      }
      /* v0.13.3：retired 的同伴（如彩季詩得）一律不登场——数据保留、UI 不显示，
       * 即使 URL 直开 ?companion=ciel 也不会出现同行实体 */
      const compDef = KUP.COMPANION(this.run.companion);
      if (compDef && compDef.retired) {
        console.warn('[KUP] 同伴 ' + this.run.companion + ' 暂不登场（retired）——本局独自出击。');
        this.run.companion = null;
      }
      /* 支援物品：未解锁则不带（URL 直开只提示） */      if (this.run.support && KUP.META && !KUP.META.isSupportUnlocked(this.run.support)) {
        console.warn('[KUP] 支援物品 ' + this.run.support + ' 尚未解锁（瓦利斯 · 培养・招募），本局不带支援。');
        this.run.support = null;
      }
      /* 形態/皮肤必须与角色类型匹配（witch / recruit），否则回落到该角色的**默认形态**
       * （v0.18.2：不再有「通常形態」——魔女之子用自己系列的第一件，魔女候補用白） */
      const charKind = KUP.charKind(charDef);
      let form = this.run.form && this.run.form !== 'none' ? KUP.FORM(this.run.form) : null;
      if (!form || !KUP.formFits(form, charKind, charDef.id)) {
        if (form) {
          console.warn('[KUP] 形態 ' + form.id + ' 不适用于 ' + charKind
            + (form.char ? '（专属形态：' + form.char + '）' : '') + '，回落默认形态。');
        }
        form = KUP.defaultForm(charDef.id);
      }
      this.run.form = form.id;
      let companionForm = this.run.companionForm && this.run.companionForm !== 'none'
        ? KUP.FORM(this.run.companionForm) : KUP.NO_FORM;
      if (!KUP.formFits(companionForm, 'companion')) companionForm = KUP.NO_FORM;
      this.run.companionForm = companionForm.id;
      this.applyRun(true); // 重设随机流 + 生成本局街区布景

      const def = charDef;
      this.lastChar = def.id; // 记录最近游玩角色，供重开使用
      this.lastRun = { char: def.id, area: this.run.area, mod: this.run.mod, companion: this.run.companion, form: this.run.form, companionForm: this.run.companionForm, support: this.run.support };
      /* 本局唯一 id：结算幂等键（同一局不会被重复计入復興率/市民票）。
       * 时间 + 随机后缀，避免同一毫秒内连开两局撞号。 */
      this.run.id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      /* 把本局配置写进当前槽位：刷新页面后「再次净化」也能还原上次的番街/角色/皮肤 */
      if (KUP.META) KUP.META.setLastRun(this.lastRun);
      this.reset();
      const recruit = KUP.COMPANION(this.run.companion);
      this.recruit = recruit;
      /* v0.13.3：支援物品（取代同伴槽）——perk 走同一套结算（gather 在 Player.recompute、
       * regen 在 game.update），所以「彩季退出」不影响支援效果的接线。 */
      const support = KUP.SUPPORT(this.run.support);
      this.support = support;
      const perk = (recruit && recruit.perk) || (support && support.perk) || null;
      const shopMods = KUP.META ? KUP.META.shopMods() : {};
      this.shopMods = shopMods;
      this.player = new KUP.Player(def, this.mods, {
        form: form,
        recruit: recruit,
        recruitForm: companionForm,
        perk: perk,
        shopMods: shopMods,
      });
      /* v0.11 建筑实体：出生点（竞技场中心）若被楼体堵住，把玩家挪到**最近的
       * 可站立点**（在最终布局下验证，必然有效）。楼体本身保持确定性布局不动。 */
      if (this.citySolid && !this.walkable(C.ARENA / 2, C.ARENA / 2, C.PLAYER_R + 30)) {
        const spot = { x: C.ARENA / 2, y: C.ARENA / 2, r: C.PLAYER_R + 30, boss: false, dead: false };
        this.walkableNearest(spot);
        if (!spot.dead) { this.player.x = spot.x; this.player.y = spot.y; }
      }
      /* 支援 perk：周期回复（regen）在 update 中结算；gather 已在 Player.recompute 内生效 */
      if (perk && perk.type === 'regen') {
        this.regenEvery = perk.every || 20;
        this.regenPct = perk.pct || 0.04;
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
      /* v0.17 调试：?revive=1 开局带 1 次卵復活（实机验证復活手感；内存态，不进存档） */
      if (this.debug.revive) { this.eggCharge = 1; this.eggOffered = true; }
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

    /* ---------- 建筑实体（v0.11）----------
     * 楼体 = 角色与敌人不可通过的实体。两种判定：
     *   walkable  ：「圆心可站立」——楼体外扩 MIN_GAP 后的矩形（防软夹紧抖动）；
     *               生成/碰撞推开/实体钩子都用它，保证各处语义一致。
     * collideCity：**硬碰撞**——圆与楼体矩形求交，沿最小穿透轴推出（贴墙滑行）。
     *               Boss 豁免（碾压建筑，游戏明文设定），citySolid=false 时整体关闭。
     * v0.13.1：三者都改走**空间索引**（cityIndex/_near），只遍历邻近桶里的楼体。 */
    /* 取「可能与 (x,y) 半径 rad 的包围盒相交」的楼体，写入调用方的暂存数组并返回。
     * 无索引时（极端旧存档/测试桩）退回全表。 */
    _near(x, y, rad, out) {
      out.length = 0;
      const c = this.city;
      if (!c || !c.buckets) {
        if (c && c.blocks) for (const b of c.blocks) out.push(b);
        return out;
      }
      const s = c.bcell, bn = c.bn;
      const x0 = U.clamp(Math.floor((x - rad) / s), 0, bn - 1), x1 = U.clamp(Math.floor((x + rad) / s), 0, bn - 1);
      const y0 = U.clamp(Math.floor((y - rad) / s), 0, bn - 1), y1 = U.clamp(Math.floor((y + rad) / s), 0, bn - 1);
      const q = ++this._navQ;                                // 去重标记（楼体可能横跨多桶）
      for (let by = y0; by <= y1; by++) {
        const row = by * bn;
        for (let bx = x0; bx <= x1; bx++) {
          for (const b of c.buckets[row + bx]) {
            if (b._q === q) continue;
            b._q = q; out.push(b);
          }
        }
      }
      return out;
    }
    walkable(x, y, r) {
      if (!this.citySolid || !this.city || !this.city.blocks.length) return true;
      const g = C.CITY.MIN_GAP + (r || 0);
      for (const b of this._near(x, y, g, NB)) {
        if (x > b.x - g && x < b.x + b.w + g && y > b.y - g && y < b.y + b.h + g) return false;
      }
      return true;
    }
    collideCity(ent) {
      if (!this.citySolid || !this.city || !this.city.blocks.length) return;
      if (ent.boss) return;                                  // Boss 碾压建筑（设定明文）
      const r = ent.r || 0;
      for (const b of this._near(ent.x, ent.y, r, NB)) {
        const cx = U.clamp(ent.x, b.x, b.x + b.w), cy = U.clamp(ent.y, b.y, b.y + b.h);
        const dx = ent.x - cx, dy = ent.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2);
        if (d > 0.0001) {                                    // 圆心在楼外：沿法线推出
          const push = r - d;
          ent.x += dx / d * push; ent.y += dy / d * push;
        } else {                                             // 圆心在楼内（生成重叠等）：沿最浅轴弹出
          const l = ent.x - b.x, ri = b.x + b.w - ent.x, t = ent.y - b.y, bo = b.y + b.h - ent.y;
          const m = Math.min(l, ri, t, bo);
          if (m === l) ent.x = b.x - r; else if (m === ri) ent.x = b.x + b.w + r;
          else if (m === t) ent.y = b.y - r; else ent.y = b.y + b.h + r;
        }
      }
    }
    collideCircle(x, y, r) {                                 // 供 projectiles/dangers 等点状实体查询
      if (!this.citySolid || !this.city || !this.city.blocks.length) return false;
      for (const b of this._near(x, y, r, NB)) {
        const cx = U.clamp(x, b.x, b.x + b.w), cy = U.clamp(y, b.y, b.y + b.h);
        if (U.dist2(x, y, cx, cy) < r * r) return true;
      }
      return false;
    }

    /* ---------- 绕楼寻路（v0.13.1）----------
     * **把「指向玩家」投影到可走路径上**（不再朝墙里使劲）：
     *   ① 沿期望方向前视，畅通就直冲（快路径）；
     *   ② 被挡则取挡路墙面的法线，把方向里的**进墙分量扣掉** ⇒ 只剩沿墙切向
     *      （楼体轴对齐 ⇒ 切向就是 ±x/±y）——「滑墙」而不是「磨墙」；
     *   ③ 正对墙面时投影退化为零 ⇒ 用 navSide 滞回决定往哪一侧滑；
     *   ④ 投影仍被挡（凹角、夹缝）才退回角度阶梯 STEP 兜底。
     * 方向连续输出（无档位跳变），叠上 entities 侧的角速度上限（数据表 turn）
     * 即成为弧线绕行。写回 ent.navX/navY 并返回 true；直冲畅通返回 false。
     * 无分配（_hit 暂存复用）、无状态表、不消费随机流。 */
    steerCity(ent, dx, dy, dt) {
      if (!this.citySolid || !this.city || !this.city.blocks.length) return false;
      const r = (ent.r || 0) * 0.95, N = C.NAV, look = (ent.r || 0) + N.LOOK;
      const hit = this._blockHit(ent, dx, dy, look, r);
      if (!hit) { ent.navHold = 0; return false; }                 // 直冲畅通
      const hold = Math.max(0, (ent.navHold || 0) - (dt || 0));
      /* 墙面法线取自**敌人自身**在楼体上的最近点（不是前视采样点）：采样点会停在
       * 楼角上，法线随它在两面之间逐帧翻转 ⇒ 切向反复换向、朝向永远追不上而原地
       * 摆动（实测卡死 20 秒）。用自身位置则法线随位置连续变化，楼角自然成为
       * 圆角过渡（切向随之旋转），敌人绕角是弧线而不是折线。 */
      const b = hit.b;
      let nx = ent.x - U.clamp(ent.x, b.x, b.x + b.w), ny = ent.y - U.clamp(ent.y, b.y, b.y + b.h);
      const nl = Math.hypot(nx, ny);
      if (nl > 0.001) { nx /= nl; ny /= nl; } else { nx = -dx; ny = -dy; }   // 圆心落在楼内
      /* 该墙面的切向基准（楼体轴对齐 ⇒ ±x/±y）与玩家方向在它上面的带符号分量 */
      const wallTx = -ny, wallTy = nx;
      const along = dx * wallTx + dy * wallTy;
      /* 选绕向（滞回）：沿用上一帧的侧，除非沿墙分量**明确**指向另一边；首次被挡时
       * 按玩家意图选（分量太小＝正对墙面 ⇒ 比两侧通透度）。滞回是防止「绕远路」：
       * 只看玩家方向的话，分量在 0 附近抖一下就会改绕另一侧。 */
      let s = hold > 0 ? (ent.navSide || 0) : 0;
      if (s && along * s < -N.SIDE_K) s = along > 0 ? 1 : -1;
      else if (!s) {
        if (Math.abs(along) >= N.MIN_T) s = along > 0 ? 1 : -1;
        else {
          const c1 = this._clearance(ent, wallTx, wallTy, look, r);
          const c2 = this._clearance(ent, -wallTx, -wallTy, look, r);
          s = c1 >= c2 ? 1 : -1;
        }
      }
      /* 目标方向＝「指向玩家」扣掉进墙分量（**连续**：法线随位置旋转时目标方向也
       * 跟着旋转，楼角因此是弧线）。注意不能写成「朝墙里就取切向、否则取玩家方向」
       * 的分支——那在法线旋转时会每帧跳 90°，朝向永远追不上而原地打转。
       * 只有投影短到退化（正对墙面）才取选定的那一侧切向，且在边界上与投影一致。 */
      const into = dx * nx + dy * ny;
      let tx = dx - Math.min(0, into) * nx, ty = dy - Math.min(0, into) * ny;
      const tl = Math.hypot(tx, ty);
      if (tl < N.MIN_T) { tx = wallTx * s; ty = wallTy * s; }
      else { tx /= tl; ty /= tl; }
      if (!this._blocked(ent, tx, ty, look, r)) {                  // 选定方向畅通 → 采用
        ent.navX = tx; ent.navY = ty; ent.navSide = s; ent.navHold = N.HOLD;
        return true;
      }
      /* 兜底：选定方向也被挡（凹角、夹缝、两墙夹击）→ 角度阶梯两侧试探 */
      for (let pass = 0; pass < 2; pass++) {
        const ss = pass === 0 ? s : -s;
        for (const a of N.STEP) {
          const ca = Math.cos(a * ss), sa = Math.sin(a * ss);
          const ax = dx * ca - dy * sa, ay = dx * sa + dy * ca;
          if (this._blocked(ent, ax, ay, look, r)) continue;
          ent.navX = ax; ent.navY = ay; ent.navSide = ss; ent.navHold = N.HOLD;
          return true;
        }
      }
      return false;                                                // 全被挡：保持原方向，硬碰撞兜底
    }
    /* 逃逸方向（防打转看门狗专用）：在 8 个方位里挑**「走得开 ＋ 朝着玩家」**的那个
     * ——开阔度打底、离玩家方向越近越好（并列取先者 ⇒ 确定性）。只按「最开阔」挑会
     * 让敌人逃出去又立刻绕回同一个口袋（实测在楼群凹角里来回摆 25px 不前进）。
     * 结果写 ent.escX/escY；八向全被挡则返回 false（交给硬碰撞）。 */
    escapeDir(ent) {
      if (!this.citySolid || !this.city || !this.city.blocks.length) return false;
      const r = (ent.r || 0) * 0.95, N = C.NAV, look = (ent.r || 0) + N.LOOK;
      const p = this.player;
      const want = p ? Math.atan2(p.y - ent.y, p.x - ent.x) : 0;
      let bx = 0, by = 0, bestScore = -Infinity, any = false;
      for (let i = 0; i < 8; i++) {
        const a = i * (U.TAU / 8), nx = Math.cos(a), ny = Math.sin(a);
        if (this._blocked(ent, nx, ny, look, r)) continue;
        any = true;
        const c = this._clearance(ent, nx, ny, look, r);
        const score = c * 0.8 - 1.5 * Math.abs(U.angDiff(a, want));
        if (score > bestScore) { bestScore = score; bx = nx; by = ny; }
      }
      if (!any) return false;
      ent.escX = bx; ent.escY = by;
      return true;
    }
    /* 沿 (nx,ny) 前视 look 距离：分 3 段采样，返回**第一个**被挡的采样点与挡路楼体
     * （无则 null）。结果写在 this._hit 暂存对象上（零分配，调用方须立即取值）。 */
    _blockHit(ent, nx, ny, look, r) {
      const out = this._hit || (this._hit = { x: 0, y: 0, b: null });
      for (let i = 1; i <= 3; i++) {
        const k = look * (i / 3), px = ent.x + nx * k, py = ent.y + ny * k;
        for (const b of this._near(px, py, r, NS)) {
          const cx = U.clamp(px, b.x, b.x + b.w), cy = U.clamp(py, b.y, b.y + b.h);
          if (U.dist2(px, py, cx, cy) < r * r) { out.x = px; out.y = py; out.b = b; return out; }
        }
      }
      return null;
    }
    _blocked(ent, nx, ny, look, r) { return this._blockHit(ent, nx, ny, look, r) !== null; }
    /* 通透度：沿方向 5 段采样中「畅通」的段数（0〜5，越大越开阔）——仅用于选绕过哪一侧 */
    _clearance(ent, nx, ny, look, r) {
      let free = 0;
      for (let i = 1; i <= 5; i++) {
        const k = look * (i / 5) * 1.5, px = ent.x + nx * k, py = ent.y + ny * k;
        let hit = false;
        for (const b of this._near(px, py, r, NS)) {
          const cx = U.clamp(px, b.x, b.x + b.w), cy = U.clamp(py, b.y, b.y + b.h);
          if (U.dist2(px, py, cx, cy) < r * r) { hit = true; break; }
        }
        if (hit) break;
        free++;
      }
      return free;
    }
    /* 「圆心可站立」的物理版：只要不与楼体嵌入即可（移动挡墙用；
     * walkable 另加 MIN_GAP 间隙，是**生成/传送落点**专用语义）。 */
    freeAt(x, y, r) { return !this.collideCircle(x, y, r); }
    /* 把实体挪到最近的「圆心可站立」点（更新循环末尾兜底；找不到才消除）。
     * 敌人/片段生成处已走 walkable 落点，正常不会触发；这是极端 seed 的保险。 */
    walkableNearest(e) {
      const A = C.ARENA;
      for (let rad = C.CITY.GRID; rad <= A; rad += C.CITY.GRID) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * U.TAU + (this.rng ? this.rng() * 0.3 : 0);
          const x = U.clamp(e.x + Math.cos(a) * rad, e.r, A - e.r);
          const y = U.clamp(e.y + Math.sin(a) * rad, e.r, A - e.r);
          if (this.walkable(x, y, e.r)) { e.x = x; e.y = y; return true; }
        }
      }
      e.dead = true;                                         // 理论不可达：整城都是楼（不可能）
      return false;
    }

    /* ---------- 不可解空間（v0.18）----------
     * Boss 出现时掷一次骰：命中则 DELAY 秒后展开一处随机空間，规则临时改写，
     * 直到**这场 Boss 战结束**（场上所有 Boss 都被击破）才退回基础规则。
     * 治安战多体并存时：同一时间只允许一处空间（不叠加），且触发体先死、另一体还活着时
     * 空间不提前退——否则“另一体还在打，规则却突然变回去”。
     * 只借用世界观名词作随机规则变异外壳，**不得断言与『Q』等价**（lore §4.3）。 */
    maybeEnterSpace(boss) {
      if (this.space || this.spacePending) return false;
      const S = KUP.CONFIG.SPACE || {};
      const dbg = this.debug && this.debug.space;
      if (dbg === 'off') return false;                    // 调试：?space=off 关闭
      let def = null;
      if (dbg && dbg !== '1') def = KUP.SPACE_DEF(dbg);   // 调试：?space=<id> 指定
      if (!def) {
        if (!dbg && U.rng() >= (S.CHANCE != null ? S.CHANCE : 0.35)) return false;
        def = U.pick(KUP.SPACES);                         // ?space=1 → 随机
      }
      this.spacePending = { def: def, boss: boss || null, t: (S.DELAY != null ? S.DELAY : 1.6) };
      return true;
    }
    enterSpace(def, boss) {
      if (!def) return false;
      const first = !this.space;
      this.space = def;
      this.spaceBoss = boss || this.boss || null;
      this.spaceT = 0; this.spaceRotT = 0;
      this.spacesSeen.push(def.id);
      this._applySpace(def);
      KUP.UI.banner(KUP.I18N.t(first ? 'banner.space' : 'banner.spaceShift',
        { name: KUP.I18N.tv(def.name) }), first ? 2.8 : 2.0);
      KUP.Audio.sfx(first ? 'warning' : 'select');
      const p = this.player;
      if (p) {
        this.addText(p.x, p.y - 44, KUP.I18N.tv(def.name), def.color || '#ffe89a', 16);
        for (let i = 0; i < 18; i++) {
          const a = U.rng() * U.TAU;
          this.parts.push(new KUP.Particle(p.x, p.y, Math.cos(a) * U.rand(70, 200), Math.sin(a) * U.rand(70, 200),
            0.7, def.color || '#ffe89a', U.rand(1.8, 3.2)));
        }
        this.rings.push(new KUP.Ring(p.x, p.y, { maxR: 420, speed: 900, dmg: 0, kb: 0, color: def.color || '#ffe89a' }));
        this.shake(6);
      }
      return true;
    }
    /* 把「当前空間规则」写进 this.mods／玩家／场上敌人（敌人按比例缩放，而不是只影响新刷的怪） */
    _applySpace(def) {
      const old = this.mods || this.baseMods || {};
      this.mods = KUP.combineMods(this.baseMods || {}, def.mods || {});
      this.spaceFog = def.fog || 0;
      this._scaleLiveEnemies(old, this.mods);
      if (this.player) { this.player.mods = this.mods; this.player.recompute(); }
    }
    _scaleLiveEnemies(a, b) {
      const ratio = k => ((b && b[k] !== undefined ? b[k] : 1) / (a && a[k] !== undefined ? a[k] : 1));
      const rs = ratio('enemySpeed'), rd = ratio('enemyDmg'), rh = ratio('enemyHp');
      if (Math.abs(rs - 1) < 1e-9 && Math.abs(rd - 1) < 1e-9 && Math.abs(rh - 1) < 1e-9) return;
      for (const e of this.enemies) {
        if (e.dead) continue;
        e.speed *= rs; e.dmg *= rd;
        if (Math.abs(rh - 1) > 1e-9) { e.maxhp *= rh; e.hp *= rh; }
      }
    }
    exitSpace(silent) {
      if (!this.space) return false;
      const old = this.mods;
      this.space = null; this.spaceBoss = null; this.spaceFog = 0;
      this.mods = Object.assign({}, this.baseMods || {});
      this._scaleLiveEnemies(old, this.mods);
      if (this.player) { this.player.mods = this.mods; this.player.recompute(); }
      if (!silent && this.state === 'playing') {
        KUP.UI.banner(KUP.I18N.t('banner.spaceExit'), 2.0);
        KUP.Audio.sfx('select');
      }
      return true;
    }
    /* 场上是否还有活着的 Boss（治安战多体并存时，空间要跟着「整场 Boss 战」走） */
    hasLiveBoss() { return this.enemies.some(e => e.boss && !e.dead); }
    /* 每帧：延迟展开 / 触发体所在 Boss 战结束后退回 / 錯乱空間的规则改写 */
    _tickSpace(dt) {
      if (this.spacePending) {
        this.spacePending.t -= dt;
        if (this.spacePending.t <= 0) {
          const q = this.spacePending; this.spacePending = null;
          /* 延迟期间触发体就被击破 → 现象不成立（否则会「展开即崩壊」闪一下横幅） */
          if (!q.boss || !q.boss.dead) this.enterSpace(q.def, q.boss);
        }
      }
      if (!this.space) return;
      this.spaceT += dt;
      /* 治安战多体 Boss：**等整场 Boss 战结束**才退回，而不是触发体一死就退
       * （否则另一体还在打，规则却突然变回去）。番街只有一体，效果相同。 */
      if (this.spaceBoss && this.spaceBoss.dead && !this.hasLiveBoss()) { this.exitSpace(); return; }
      if (this.space.rotateEvery) {
        this.spaceRotT += dt;
        if (this.spaceRotT >= this.space.rotateEvery) {
          this.spaceRotT = 0;
          const next = U.pick(KUP.SPACES.filter(s => s.id !== this.space.id));
          this.space = next;
          this.spacesSeen.push(next.id);
          this._applySpace(next);
          KUP.UI.banner(KUP.I18N.t('banner.spaceShift', { name: KUP.I18N.tv(next.name) }), 1.8);
          KUP.Audio.sfx('select');
        }
      }
    }

    update(dt) {
      this.time += dt;
      const p = this.player;
      p.update(dt, this);
      for (const w of p.weapons) w.update(dt, this);
      this.director(dt);
      this._tickSpace(dt);   // v0.18 不可解空間：延迟展开／触发体击破后退回／錯乱改写
      // 调试：?gem=heal 周期生成指定片段（验证 HP 恢复第二路径）
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

      for (const e of this.enemies) { e.update(dt, this); this.collideCity(e); }
      /* 弹幕**掠过楼顶**（不阻挡）：「歌＝魔法」——音波不因楼体中断；
       * 建筑实体只影响**移动**（角色与敌人），输出经济不受墙影响。 */
      for (const pr of this.projs) pr.update(dt, this);
      this.collide();
      for (const r of this.rings) r.update(dt, this);
      for (const sl of this.slashes) sl.update(dt, this);
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
      for (const f of this.fx) f.update(dt);
      for (const dg of this.dangers) dg.update(dt, this);
      for (const g of this.gems) { g.update(dt, this); if (!g.dead) this.collideCity(g); }
      for (const pt of this.parts) pt.update(dt);
      for (const tx of this.texts) tx.update(dt);

      // 清理
      this.enemies = this.enemies.filter(e => !e.dead);
      this.projs = this.projs.filter(pr => !pr.dead);
      this.gems = this.gems.filter(g => !g.dead);
      this.rings = this.rings.filter(r => !r.dead);
      this.slashes = this.slashes.filter(s => !s.dead);
      this.beams = this.beams.filter(b => !b.dead);
      this.zones = this.zones.filter(z => !z.dead);
      this.tosses = this.tosses.filter(t => !t.dead);
      this.fx = this.fx.filter(f => !f.dead);
      this.dangers = this.dangers.filter(d => !d.dead);
      /* 敌袭预警 HUD：有未生效的 Danger 贴近玩家时提示 */
      this.dangerNear = this.dangers.some(d => !d.armed && d.nearPlayer(this.player));
      this.parts = this.parts.filter(pt => !pt.dead);
      this.texts = this.texts.filter(tx => !tx.dead);
      /* 滞留区域上限（防布局爆量） */
      if (this.zones.length > 140) this.zones.splice(0, this.zones.length - 140);
      if (this.dangers.length > 90) this.dangers.splice(0, this.dangers.length - 90);
      /* 被楼体挤入的敌人（穿透楼体时）挪到最近合法点——生成处已走 walkable 落点，
       * 这里只处理极端情况（兜底）；用物理嵌入判定，与 collideCity 的推出距离一致。 */
      for (const e of this.enemies) {
        if (!e.boss && !e.dead && this.collideCircle(e.x, e.y, e.r * 0.9)) this.walkableNearest(e);
      }

      // 相机
      const tx = this.clampCam(p.x - this.view.w / 2, this.view.w);
      const ty = this.clampCam(p.y - this.view.h / 2, this.view.h);
      const k = Math.min(1, C.CAM_LERP * dt);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
      this.cam.shake = Math.max(0, this.cam.shake - 14 * dt);
      /* 大招冷却（充能满后仍要等的秒数；与充能互不影响） */
      if (this.ult.cdT > 0) this.ult.cdT = Math.max(0, this.ult.cdT - dt);

      /* v0.15.3：Boss 血条改成**列表**——每帧把「所有存活 Boss」交给 UI 依次排列，
       * 多体并存时各自一行；击破其中一体只是少一行，其它血条不会跟着消失。 */
      if (KUP.UI.syncBosses) KUP.UI.syncBosses(this._liveBoss || []);
      else if (this.boss) KUP.UI.updateBoss(this.boss);
    }

    /* 敌人空间索引（v0.13.6）——每帧重建一次，供弹幕碰撞与「最近敌人」查询用。
     * 为什么需要：碰撞原本是 O(弹体×敌人) 的双重循环，高波次下（400 弹体 × 400 敌人）
     * 每帧约 16 万次 `Math.pow` + `Set.has`，实测单帧平均 **19.8ms、峰值 512ms** ⇒ 卡顿。
     * 桶边长 128；敌人按**自身包围盒**入桶（半径最大约 40，故最多 4 桶），
     * 查询时按「弹体半径 + 本帧最大敌人半径」取若干桶 —— 命中集合与逐个遍历完全一致。
     * 同一敌人可能跨桶被访问多次，但 pierce=0 命中即 break、pierce>0 有 `hits` 去重，
     * 因此不会重复结算；省掉额外的去重标记是为了少一层开销。 */
    enemyIndex() {
      const CELL = 128, ev = this.enemies;
      let idx = this._EIdx;
      if (!idx) idx = this._EIdx = { cell: CELL, map: new Map(), maxR: 16 };
      const map = idx.map;
      map.clear();
      let maxR = 16;
      for (const e of ev) {
        if (e.dead) continue;
        if (e.r > maxR) maxR = e.r;
        const x0 = Math.floor((e.x - e.r) / CELL), x1 = Math.floor((e.x + e.r) / CELL);
        const y0 = Math.floor((e.y - e.r) / CELL), y1 = Math.floor((e.y + e.r) / CELL);
        for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
          const k = (gx * 73856093) ^ (gy * 19349663);        // 整数键，避免每帧分配字符串
          let a = map.get(k);
          if (!a) { a = []; map.set(k, a); }
          a.push(e);
        }
      }
      idx.maxR = maxR;
      return idx;
    }

    /* ---------- 碰撞 ---------- */
    collide() {
      const p = this.player;
      // 敌人接触玩家（冷冻中的敌人无法造成接触伤害：完全停止＝安全的窗口）
      if (p.hitT <= 0) {
        for (const e of this.enemies) {
          if (e.dead || e.stunT > 0) continue;
          if (U.dist2(e.x, e.y, p.x, p.y) < Math.pow(e.r + p.r, 2)) {
            this.hurtPlayer(e.dmg, 'contact');
            break;
          }
        }
      }
      /* 弹幕 vs 敌人：走空间索引，只查弹体附近的桶（不再全表扫） */
      if (!this.projs.length || !this.enemies.length) return;
      const idx = this.enemyIndex(), CELL = idx.cell, map = idx.map;
      for (const pr of this.projs) {
        if (pr.dead) continue;
        const rad = pr.r + idx.maxR;
        const x0 = Math.floor((pr.x - rad) / CELL), x1 = Math.floor((pr.x + rad) / CELL);
        const y0 = Math.floor((pr.y - rad) / CELL), y1 = Math.floor((pr.y + rad) / CELL);
        for (let gy = y0; gy <= y1 && !pr.dead; gy++) {
          for (let gx = x0; gx <= x1 && !pr.dead; gx++) {
            const a = map.get((gx * 73856093) ^ (gy * 19349663));
            if (!a) continue;
            for (let i = 0; i < a.length; i++) {
              const e = a[i];
              if (e.dead) continue;
              const rr = e.r + pr.r;
              if (U.dist2(pr.x, pr.y, e.x, e.y) >= rr * rr) continue;
              /* 只有穿透弹需要去重（pierce=0 命中即结束，省掉 Set 的哈希开销） */
              if (pr.pierce > 0) { if (pr.hits.has(e)) continue; pr.hits.add(e); }
              this.damageEnemy(e, pr.dmg, pr.vx * 0.12, pr.vy * 0.12);
              if (pr.split) { this.spawnSplit(pr); pr.split = 0; }
              if (pr.pierce <= 0) { pr.dead = true; break; }
              pr.pierce--;
            }
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

    /* ---------- 伤害结算（唯一入口：玩家武器/弹幕/冲击环/滞留区都走这里） ----------
     * v0.18.3 暴击：在这里掷一次会心（`U.rng` 属玩法路径，可复现），
     * 命中后乘角色倍率（Boss 另乘 CONFIG.CRIT.BOSS_MULT）并触发角色专属特效。
     * opt.noCrit：特效追加伤害等"二手伤害"不得再暴击（避免连锁递归）。 */
    damageEnemy(e, dmg, kx, ky, opt) {
      if (e.dead) return 0;
      opt = opt || {};
      const p = this.player;
      let real = dmg, crit = false;
      if (!opt.noCrit && p && p.critRate > 0 && p.critMult > 1) {
        if (U.rng() < p.critRate) {
          crit = true;
          const bossMul = e.boss ? C.CRIT.BOSS_MULT : 1;
          real = dmg * Math.max(1, p.critMult * bossMul);
        }
      }
      e.hp -= real;
      e.flash = 0.09;
      if (kx) { e.kx += kx; e.ky += ky; }
      if (this.texts.length < C.MAX_TEXTS) {
        if (crit) {
          this.addText(e.x, e.y - e.r - 10, '会心 ' + Math.round(real), '#ffe27a', 17);
        } else {
          this.addText(e.x, e.y - e.r - 4, String(Math.round(real)),
            real >= 40 ? '#ffd25a' : '#fff', real >= 40 ? 15 : 12);
        }
      }
      if (crit) this.onCrit(e, real, kx, ky);
      if (e.hp <= 0) this.killEnemy(e);
      return real;
    }

    /* ---------- 会心结算（v0.18.3；v0.18.4 按人类要求**注释掉所有特殊触发**）----------
     * 目前只保留：统计（次数/最高单发）、会心音效与轻微震屏。
     * 原先按角色分派的七种特效（残响/冻弦/破勢/星屑/終結/聖歌/箭羽）**整段注释保留**，
     * 将来若要恢复（或换成"按武器"的触发），在这里重新接线即可；注意仍须遵守
     * "触发伤害不再会心（noCrit）"与"一次伤害最多触发一次"的纪律。 */
    onCrit(e, dealt, kx, ky) {
      const p = this.player;
      this.critCount = (this.critCount || 0) + 1;
      if (dealt > (this.critMax || 0)) this.critMax = dealt;
      KUP.Audio.sfx('crit');
      this.shake(2);
      /* ---- 特殊触发（已注释，保留代码与参数） ----
      switch (p.critFx) {
        case 'echo': {
          // 残响：30% 追加伤害（不再暴击）＋ 视觉冲击环
          this.damageEnemy(e, dealt * 0.3, 0, 0, { noCrit: true });
          this.fx.push(new KUP.Shockwave(e.x, e.y, { r0: 4, r1: 62, dur: 0.24, color: '#ffd25a', width: 3 }));
          break;
        }
        case 'chill':
          if (e.applySlow) e.applySlow(1.5, 0.55);      // 冻弦：减速 45% 1.5s（取最强来源）
          break;
        case 'break': {
          // 破勢：沿「玩家→目标」方向击退 160px
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          e.kx += Math.cos(a) * 160; e.ky += Math.sin(a) * 160;
          break;
        }
        case 'star':
          this.dropGem(e.x, e.y, 2);                     // 星屑：额外 +2 经验片段
          break;
        case 'charge':
          this.ult.charge = Math.min(100, this.ult.charge + 1.5);
          break;
        case 'hymn': {
          const heal = Math.max(1, Math.round(p.maxhp * 0.005));
          if (p.hp < p.maxhp) {
            p.hp = Math.min(p.maxhp, p.hp + heal);
            this.addText(p.x, p.y - 30, '+' + heal, '#ffd8f0', 12);
          }
          break;
        }
        case 'feather':
          p.dashCd = Math.max(0, p.dashCd - 0.35);       // 箭羽：冲刺 CD −0.35s
          break;
        default: break;
      }
      ---- 特殊触发结束 ---- */
      void p; void e; void kx; void ky;
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
        if (this.endless) {
          /* 治安战：击破 Boss **不是终点**——清场奖励 + 继续下一轮（director 会再排 Boss）。
           * 也不落記憶の卵／不发復興率：治安战的成绩只进治安战记录。
           * ⚠️ 只清「被击破的这一体」：可能同时存在多体 Boss（前一体没打完又来了一体），
           * 无条件 this.boss = null 会把还活着的那一体的行为/暴走/HUD 一起清掉。 */
          if (this.boss === e) this.boss = null;
          /* v0.15.3：**不再**整块 showBoss(false)——多体 Boss 并存时那会把其它 Boss 的
           * 血条一起抹掉（"被击退出场"）。血条由 game.update 的 syncBosses 每帧按存活列表维护。 */
          this.ult.charge = Math.min(100, this.ult.charge + 40);
          this.addText(p.x, p.y - 32, KUP.I18N.t('order.bossDown'), '#ffe08a', 16);
          KUP.UI.banner(KUP.I18N.t('banner.order.next'), 2);
          this.rings.push(new KUP.Ring(e.x, e.y, { maxR: 620, speed: 720, dmg: 90 * p.dmgMult, kb: 280, color: '#9ff3ff' }));
          this.dropGem(e.x, e.y, 60);
          return;
        }
        this.victory();
        return;
      }
      KUP.Audio.sfx(e.elite ? 'boom' : 'hit');
      this.dropGem(e.x, e.y, e.xp);
      if (e.elite) {
        this.shake(5);
        this.gems.push(new KUP.Gem(e.x + 16, e.y, 0, 'heal'));
      }
    }

    /* 掉落「片段」。
     * v0.18.1（人类 2026-10-21「上限改为 240px 方格内 160 个，超当前格上限再合并」）：
     *   ① 配额改**按空间格**——每 240px 方格里最多 GEM_CELL_CAP(160) 个，超出则合并；
     *   ② 合并**只并进 xp 片段**（旧版随机挑，挑到回复 ♥ 片段时会因 `type !== 'xp'`
     *      直接丢弃那笔经验 ⇒ 表现成「打怪不再掉经验」的隐性 bug）；
     *   ③ 优先并进**本格内**的片段（经验堆在附近、玩家看得见），本格没有才退回全场；
     *   ④ 全场只有回复 ❤/♥ 片段这种极端情况，宁可短暂超配额也要新建，绝不吞经验；
     *   ⑤ MAX_GEMS(480) 只是全局兜底，防止玩家长期不捡导致实体爆炸。
     * 随机数：每次掉落最多消费 1 次（先计数、再取第 k 个），消耗量与旧版同级。 */
    dropGem(x, y, xp) {
      const val = Math.max(1, Math.round(xp * this.mods.dropRate));
      const cell = C.GEM_CELL, cap = C.GEM_CELL_CAP;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      const sameCell = g => !g.dead && g.type === 'xp' &&
        Math.floor(g.x / cell) === gx && Math.floor(g.y / cell) === gy;
      const anyXp = g => !g.dead && g.type === 'xp';
      let cnt = 0;
      for (const g of this.gems) if (sameCell(g)) cnt++;
      if (cnt >= cap || this.gems.length >= C.MAX_GEMS) {
        /* 合并目标：优先本格 xp 片段，其次全场 xp 片段 */
        let pool = cnt > 0 ? sameCell : anyXp, total = 0;
        for (const g of this.gems) if (pool(g)) total++;
        if (total > 0) {
          let k = (U.rng() * total) | 0;
          for (const g of this.gems) {
            if (!pool(g)) continue;
            if (k-- === 0) { g.xp += val; return; }
          }
        }
        /* 没有任何 xp 片段：照常新建（宁可超配额，也不丢经验） */
      }
      this.gems.push(new KUP.Gem(x, y, val));
    }

    /* ---------- 記憶の卵（v0.17 局内「現象」卡）：抽取 / 选中 / 復活 ----------
     * 人类 2026-10-19 重设定位：卵不再是掉落物，也不再产出任何局外进度；
     * 它是升级时**低概率额外出现**的一张現象卡，选中后换 1 次復活。
     * 番街一局最多抽一次（eggOffered 永不复位）；治安战在充能用掉后可再次抽到
     * ⇒ 一场可復活多次，但每次仍受同一个低概率限制。 */
    eggEligible() {
      /* rollChoices 在 state==='levelup' 时调用（openLevelUp 先切状态），所以两态都算 */
      if (this.state !== 'playing' && this.state !== 'levelup') return false;
      if (!this.endless && this.eggOffered) return false;   // 番街：本局已抽过（无论选没选）
      return this.eggCharge <= 0;                            // 手里已有充能就不再抽
    }
    /* 升级抽卡时调用：命中则这一抽出现現象卡（并记下本局已抽过）。
     * 同一等级的多次 rollChoices（重掷／多级连升）只掷一次，避免"重掷刷卵"。 */
    rollEggCard() {
      if (this.eggCharge > 0) return false;                  // 手里已有充能：不再出现
      if (this._eggLevel === this.level) return !!this._eggHit; // 同等级重掷：结果不变（卡不会消失）
      if (!this.eggEligible()) return false;
      const C = KUP.CONFIG.EGG || {};
      this._eggLevel = this.level;
      this._eggHit = (this.debug && this.debug.egg) ? true
        : U.rng() < (C.CHANCE != null ? C.CHANCE : 0.006);
      if (this._eggHit) this.eggOffered = true;
      return this._eggHit;
    }
    /* 选中現象卡：获得 1 次復活充能（不附带其它成长——用一次升级换一条命） */
    takeEggCard() {
      this.eggCharge++;
      this.eggOffered = true;
      const p = this.player;
      this.addText(p.x, p.y - 34, KUP.I18N.t('hud.egg'), '#ffe89a', 16);
      KUP.UI.banner(KUP.I18N.t('banner.egg'), 2.2);
      KUP.Audio.sfx('egg');
    }
    /* HP 归零时尝试用卵復活；只在 `playing` 触发（胜利结局 / 结算后不再復活）。
     * 返回 true 表示已復活（调用方不要再 gameOver）。 */
    tryEggRevive() {
      if (this.state !== 'playing' || this.eggCharge <= 0 || !this.player) return false;
      const C = KUP.CONFIG.EGG || {};
      const p = this.player;
      this.eggCharge--; this.eggUsed++;
      p.hp = Math.max(1, Math.round(p.maxhp * (C.HP_PCT != null ? C.HP_PCT : 0.5)));
      /* 短暂无敌帧：沿用受击无敌计时（hurtPlayer 在 hitT > 0 时直接返回） */
      p.hitT = Math.max(p.hitT, C.IFRAME != null ? C.IFRAME : 2.5);
      p.flash = 0.3;
      /* 小 AOE：向外扩散的冲击环（伤害 + 击退），复用 Ring 实体 */
      this.rings.push(new KUP.Ring(p.x, p.y, {
        maxR: C.AOE_R != null ? C.AOE_R : 240, speed: 900,
        dmg: (C.AOE_DMG != null ? C.AOE_DMG : 80) * p.dmgMult,
        kb: C.KB != null ? C.KB : 300, color: '#ffe89a',
      }));
      for (let i = 0; i < 26; i++) {
        const a = U.rng() * U.TAU;
        this.parts.push(new KUP.Particle(p.x, p.y, Math.cos(a) * U.rand(90, 260), Math.sin(a) * U.rand(90, 260),
          0.8, '#ffe89a', U.rand(2, 3.5)));
      }
      this.shake(10);
      this.addText(p.x, p.y - 30, KUP.I18N.t('hud.egg'), '#ffe89a', 17);
      KUP.UI.banner(KUP.I18N.t('banner.revive'), 2.6);
      KUP.Audio.sfx('egg');
      return true;
    }

    /* ---------- 浄化の歌／角色大招（第2话副标题 ★；v0.14：按角色区分）----------
     * 规则（所有角色**共用**）：击破充能满 100 → Space 释放 → 充能清零 → 进入冷却。
     * 效果（**数据驱动**，见 js/data/char.js KUP.ULTIMATES）：每个角色一个大招 ——
     *   kaf 双极谐振（双重冲击环）／rim 静止帧（冻结+回血）／haru 九龍噴火（扇形烈焰）
     *   ／isekaijoucho 星海陷落（减速+滞留区）／koko 终结弹幕（环形贯穿弹幕）
     *   ／aru 救済の聖歌（大回血+长无敌）／asu 終楽章・箭雨（放射箭雨）
     * 加"新的大招"＝在数据表里加一条，这里不必改分派。 */
    ultimateDef() {
      const c = (this.player && this.player.def && this.player.def.id) || (this.run && this.run.char);
      return KUP.ULTIMATE(c);
    }
    /* 冷却时长（充能满后仍要等的秒数；各角色大招不同，缺省 3 秒）
     * 「派生之律」的冷却缩短对它有影响，让冷却流也有收益 */
    ultCooldown() {
      const UD = this.ultimateDef();
      return Math.max(0.5, (UD.cdMax || 3) * (this.player ? this.player.cdMult : 1));
    }
    ultReady() { return this.ult.charge >= 100 && (this.ult.cdT || 0) <= 0; }
    castUltimate() {
      if (this.state !== 'playing') return;
      const p = this.player, u = this.ult;
      if (!p || p.hp <= 0 || !this.ultReady()) return;
      /* v0.18 静音空間：浄化の歌被封印 */
      if (this.space && this.space.ultLock) {
        this.addText(p.x, p.y - 30, KUP.I18N.t('hud.ultLocked'), '#ff9a5a', 14);
        return;
      }
      const UD = this.ultimateDef();
      u.charge = 0;
      u.cdT = this.ultCooldown();
      p.hitT = Math.max(p.hitT, UD.invuln || 0.8);
      const aimA = (() => { const ad = this.aimDir(p); return Math.atan2(ad.y, ad.x); })();
      /* ① 冲击环（一道或多道；arcDeg 可做扇形，dir:'aim' 朝瞄准方向） */
      for (const r of (UD.rings || [])) {
        this.rings.push(new KUP.Ring(p.x, p.y, {
          maxR: r.maxR, speed: r.speed, dmg: (r.dmgMul || 1) * p.dmgMult, kb: r.kb || 0, color: r.color || '#9ff3ff',
          arc: r.arcDeg ? r.arcDeg * DEG : undefined,
          dir: r.dir === 'aim' ? aimA : 0,
        }));
      }
      /* ② 冲散敌方攻击（音波环/光束/毒区一并净化；已引爆的 bomb 不重复清） */
      if (UD.clearDanger) {
        for (const d of this.dangers) if (d.kind !== 'bomb' || d.armed) d.dead = true;
      }
      /* ③ 状态异常：冻结／减速（走统一入口，Boss/精英减免照旧） */
      if (UD.freeze) this.applyFreeze(UD.freeze);
      if (UD.slow) this.applySlow(UD.slow);
      /* ④ 回血 */
      if (UD.heal > 0 && p.hp < p.maxhp) {
        p.hp = Math.min(p.maxhp, p.hp + p.maxhp * UD.heal);
        this.addText(p.x, p.y - 30, '+' + Math.round(p.maxhp * UD.heal), '#8affc9', 15);
      }
      /* ⑤ 环形贯穿光束（koko：「终结弹幕」） */
      if (UD.beams) {
        const cnt = UD.beams.count || 8;
        for (let i = 0; i < cnt; i++) {
          this.beams.push(new KUP.Beam(p.x, p.y - 4, (i / cnt) * U.TAU, {
            len: UD.beams.len || 800, w: UD.beams.w || 12, dmg: UD.beams.dmgMul * p.dmgMult,
            color: UD.beams.color || '#7aa0ff', game: this, life: 0.22,
          }));
        }
      }
      /* ⑥ 放射箭雨（asu：「終楽章・箭雨」） */
      if (UD.shots) {
        const cnt = UD.shots.count || 8;
        for (let i = 0; i < cnt; i++) {
          const a = (i / cnt) * U.TAU, sp = UD.shots.speed || 760;
          this.projs.push(new KUP.Projectile(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp, {
            dmg: UD.shots.dmgMul * p.dmgMult, r: 8, life: UD.shots.life || 1.3, pierce: UD.shots.pierce || 3,
            color: UD.shots.color || '#7de0c8', kind: 'lance',
          }));
        }
      }
      /* ⑦ 星屑滞留区（isekaijoucho）：围绕玩家的 4 处减速音场 */
      if (UD.fields) {
        for (let i = 0; i < UD.fields; i++) {
          const a = (i / UD.fields) * U.TAU + aimA, d = 130;
          this.zones.push(new KUP.Zone(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
            r: 110, dmg: 6 * p.dmgMult, life: 5, kind: 'field', color: '#c9a6ff', slow: true, tickRate: 0.5,
          }));
        }
      }
      /* 演出：粒子爆发 + 震屏 + 横幅（显示**这个大招的名字**） */
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * U.TAU;
        this.parts.push(new KUP.Particle(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30,
          Math.cos(a) * 320, Math.sin(a) * 320, 0.8, '#bff7ff', 3.2));
      }
      this.shake(10);
      KUP.UI.banner(KUP.I18N.t('banner.ultName', { name: KUP.I18N.tv(UD.name) }), 2);
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

    /* ---------- 受伤结算（v0.8：回避 → 护盾 → 生命；v0.14：护盾改**减伤膜**） ----------
     * kind ＝ 伤害类型（contact／ring／field／bomb／beam），决定护盾的减伤比例。
     * 护盾**不是第二管血**：它按类型给减伤（贴靠 95%／音波 85%／毒区 75%／轰炸 70%／
     * 光束 50%），只减少扣到生命的伤害。v0.18.3 起护盾**会被挡下的伤害打薄**，
     * 打空后暂时没有减伤，脱战 3 秒后在 1.5 秒内回满（不是第二管血，也不提供回血）。 */
    hurtPlayer(d, kind) {
      const p = this.player;
      if (p.invuln || p.hitT > 0) return;
      p.noHitT = 0;
      const k = kind || 'contact';
      /* 残響回避（被动 dodge ＋瓦利斯「常連の勘」＋道具「無傷の符」）：完全回避 */
      const dc = p.effDodge();
      if (dc > 0 && U.rng() < dc) {
        this.addText(p.x, p.y - 24, KUP.I18N.t('hud.dodge'), '#c9ffe8', 14);
        KUP.Audio.sfx('select');
        /* 「無傷の譜」：回避成功时回流片段回血 */
        if (p.missHeal > 0 && p.hp < p.maxhp) {
          const heal = Math.max(1, Math.round(p.maxhp * p.missHeal));
          p.hp = Math.min(p.maxhp, p.hp + heal);
          this.addText(p.x, p.y - 40, '+' + heal, '#8affc9', 12);
        }
        p.hitT = C.PLAYER_HIT_CD * 0.5;
        return;
      }
      let rest = d;
      /* 护盾（减伤膜）：按类型减伤，并**按挡下的伤害打薄**（v0.18.3）。
       * kind 缺省（旧调用/调试）＝ contact —— 调 hurtPlayer(20) 仍会走贴靠膜。 */
      if (p.shieldTotal && p.shieldTotal() > 0) {
        const before = rest;
        rest = p.applyShield(rest, k);
        const blocked = Math.round(before - rest);
        if (blocked > 0) this.addText(p.x, p.y - 40, '🛡 -' + blocked, '#7dffe0', 12);
      } else {
        p.shieldRegenT = 0;   // 没有护盾可挡也算"挨打"：恢复计时重新开始
      }
      if (rest > 0) {
        p.hp -= rest;
        this.addText(p.x, p.y - 22, '-' + Math.max(1, Math.round(rest)), '#ff5a7a', 14);
      } else if (rest < d) {
        /* 完全挡下：只提示"护盾挡下"，不显示掉血 */
        this.addText(p.x, p.y - 22, KUP.I18N.t('hud.shieldBlock'), '#7dffe0', 13);
      }
      p.hitT = C.PLAYER_HIT_CD;
      p.flash = 0.25;
      this.shake(4);
      KUP.Audio.sfx('hurt');
      /* 反響（被动 retaliate）：受击迸发冲击环反击（被完全挡下也照常触发） */
      if (p.retaliateDmg > 0) {
        this.rings.push(new KUP.Ring(p.x, p.y, {
          maxR: 120 + 12 * (p.passives.retaliate || 0), speed: 460, dmg: p.retaliateDmg * p.dmgMult, kb: 150, color: '#ffb25a',
        }));
      }
      if (p.hp <= 0) {
        /* v0.17 記憶の卵：先尝试復活（只在 playing 生效；胜利结局 / 结算后不復活） */
        if (this.tryEggRevive()) return;
        p.hp = 0; this.gameOver();
      }
    }

    /* 冲刺（Shift / HUD 按钮）：主动回避，带无敌帧 */
    tryDash() {
      if (this.state !== 'playing' || !this.player) return false;
      const ok = this.player.dash();
      if (ok) this.addText(this.player.x, this.player.y - 26, KUP.I18N.t('hud.dash'), '#bfefff', 13);
      return ok;
    }

    /* ---------- 状态异常：僵直／冷冻 与 减速（v0.13）----------
     * 统一的施加入口（道具／武器／未来的共鸣进化都走这里）：
     *   applyFreeze({ seconds, x, y, radius, all })  全场或范围内的敌人**完全静止**
     *   applySlow({ seconds, mul, x, y, radius, all }) 减速（倍率取最强来源）
     * 体型减免：Boss ×0.5、精英 ×0.75（避免被永久锁死；Boss 仍需承受压力）。
     * 返回生效的敌人数量。 */
    statusTargets(opt) {
      const out = [];
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (!opt.all && opt.x !== undefined && opt.radius !== undefined) {
          if (U.dist2(e.x, e.y, opt.x, opt.y) > opt.radius * opt.radius) continue;
        }
        out.push(e);
      }
      return out;
    }
    statusScale(e) { return e.boss ? 0.5 : e.elite ? 0.75 : 1; }
    applyFreeze(opt) {
      opt = opt || {};
      const secs = opt.seconds || 2.5;
      let n = 0;
      for (const e of this.statusTargets(opt)) {
        if (e.applyStun(secs * this.statusScale(e))) n++;
      }
      return n;
    }
    applySlow(opt) {
      opt = opt || {};
      const secs = opt.seconds || 8, mul = opt.mul !== undefined ? opt.mul : 0.5;
      let n = 0;
      for (const e of this.statusTargets(opt)) {
        if (e.applySlow(secs * this.statusScale(e), mul)) n++;
      }
      return n;
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

    /* ---------- 「最近 N 个**不同**的敌人」（v0.14）----------
     * 人类 2026-10-17：「投掷/激光应该是**向最近的两个敌人分别投掷/发射**，而不是
     * 对着最近的一个撒一把，也不是朝最近的一个张开夹角」。为此需要"按距离排前 N 且
     * 互不重复"的目标表；同一次齐射的多个弹体各取一个，才能真正覆盖两个不同目标。
     * maxRange：超出距离的敌人不算（投掷/瞄准的距离感，缺省不限）。 */
    nearestEnemies(x, y, n, maxRange) {
      const out = [];
      const mr2 = maxRange ? maxRange * maxRange : Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = U.dist2(x, y, e.x, e.y);
        if (d > mr2) continue;
        /* 插入排序到前 n 名（n 很小，不必整体排序） */
        let i = out.length;
        if (i >= n && d >= out[n - 1].d) continue;
        while (i > 0 && out[i - 1].d > d) i--;
        out.splice(i, 0, { e, d });
        if (out.length > n) out.pop();
      }
      return out.map(o => o.e);
    }
    /* ---------- 齐射：count 个弹体 ↔ count 个方向（v0.14）----------
     * 人类 2026-10-17 的三条要求在这里统一成一套规则：
     *   「投掷型应该向最近的两个敌人投掷」→ 目标优先、且**互不重复**；
     *   「激光也是，而不是朝最近的一个张开夹角」→ 第二个弹体换一个敌人；
     *   「射弹类夹角应小一些」→ 补角用很小的 spread（缺省 0.085rad≈5°）。
     * 规则：
     *   ① 前 N 个弹体（N＝min(count, 不同目标数)）各对准**一个不同的敌人**（最近优先）；
     *   ② 剩下的弹体围绕基准方向补角，**跳过**已经用过的方向（避免两发打同一处）；
     *   ③ 完全没有目标时也照样发满（围成一圈小角度），不会对着空气只放一发。
     * 返回 { angles, targets }：angles 与 targets 一一对应（i < targets.length 时弹体 i 打 targets[i]）。 */
    volleyAngles(p, count, opt) {
      opt = opt || {};
      const spread = opt.spread !== undefined ? opt.spread : 0.085;
      const base = opt.base !== undefined ? opt.base
        : (() => { const d = this.aimDir(p, opt); return Math.atan2(d.y, d.x); })();
      const targets = (opt.targets || this.nearestEnemies(p.x, p.y, count, opt.maxRange)).slice(0, count);
      const angles = [];
      const near = a => angles.some(b => Math.abs(U.angDiff(a, b)) < spread * 0.5);
      for (const t of targets) angles.push(Math.atan2(t.y - p.y, t.x - p.x));
      /* 补角：先在基准方向两侧交替取，跳过已被目标占用的方向 */
      let k = 0, guard = 0;
      while (angles.length < count && guard++ < 200) {
        const step = Math.floor(k / 2) + 1;
        const a = base + (k % 2 === 0 ? -1 : 1) * step * spread;
        k++;
        if (near(a)) continue;
        angles.push(a);
      }
      while (angles.length < count) angles.push(base);   // 极端兜底
      return { angles, targets };
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
      /* v0.17 記憶の卵（現象卡）：低概率**额外**多出第 4 张（不进普通卡池、不可封禁、
       * 不占分桶保底配额）。选中＝用这次升级换 1 次復活。 */
      if (this.rollEggCard()) out.push({ kind: 'egg' });
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
        x.kind !== 'egg' &&                       // 現象卡不受封禁逻辑影响（不能当替换卡塞进来）
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
            /* v0.14：护盾＝减伤膜 → 「防音の符」＝追加 60 膜层（不是第二管血） */
            const r = p.addShield(it.amount);
            this.addText(p.x, p.y - 26, '+' + it.amount + ' 🛡', '#7dffe0', 15);
            KUP.UI.banner(KUP.I18N.t('banner.ward', { n: Math.round(r.shieldTmp) }), 1.4);
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
          } else if (it.kind === 'freeze') {
            /* v0.13 僵直／冷冻：全场完全静止（含接触伤害与 Boss 行动） */
            const n = this.applyFreeze({ seconds: it.seconds, all: true });
            this.addText(p.x, p.y - 26, KUP.I18N.t('item.freeze.text', { s: it.seconds }), '#bff0ff', 15);
            if (n > 0) KUP.UI.banner(KUP.I18N.t('banner.freeze'), 1.4);
          } else if (it.kind === 'slow') {
            /* v0.13 减速：全场减速（倍率取最强来源） */
            const n = this.applySlow({ seconds: it.seconds, mul: it.amount, all: true });
            this.addText(p.x, p.y - 26, KUP.I18N.t('item.slow.text', { p: Math.round((1 - it.amount) * 100) }), '#8fd0ff', 15);
            if (n > 0) KUP.UI.banner(KUP.I18N.t('banner.slow'), 1.4);
          }
          KUP.Audio.sfx('heal');
        }
      } else if (c.kind === 'egg') {
        /* v0.17 記憶の卵：獲得 1 次復活充能（局内現象卡） */
        this.takeEggCard();
      } else if (c.kind === 'heal') {
        p.hp = Math.min(p.maxhp, p.hp + p.maxhp * 0.4);
        this.addText(p.x, p.y - 26, '+HP', '#7dff9a', 15);
        KUP.Audio.sfx('heal');
      }
      this.pendingLevels--;
      KUP.Audio.sfx('select');
      /* 本次升级已结算：清掉「同等级卵卡结果」缓存（同一次选择内的重掷仍保留卵卡） */
      this._eggLevel = -1;
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
      if (this.endless) {
        /* 治安战：**没有败北**——HP 归零只是「战斗结束」。
         * 成绩记入**独立的**治安战最高记录（不发復興率、不写番街 best/通关）。 */
        this.orderScore = KUP.META.orderScore({ kills: this.kills, time: this.time, wave: this.orderWave });
        this.metaResult = KUP.META.addOrderResult(this.orderStats());
      } else {
        /* 復興率结算（败北也计上 1% 观测数据）＋市民票收入 */
        this.metaResult = KUP.META.addRunResult(this.run.area, false, this.runStats());
      }
      KUP.Audio.stopBGM();
      KUP.Audio.sfx('boss');
      KUP.UI.showEnd(false, this.stats());
    }
    victory() {
      if (this.state === 'victory') return;
      this.state = 'victory';
      /* 復興率结算（首通 +12% / 重复 +2% / 計上 +1%）＋现金收入
       * v0.17：記憶の卵不再由击破 Boss 必得（改为局内現象卡）。 */
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
        revives: this.eggUsed,
        areaIdx: KUP.META ? KUP.META.areaIndex(this.run.area) : 0,
        time: this.time,
      };
    }
    /* 治安战的成绩单（交给 META.addOrderResult；runId 同样是幂等键） */
    orderStats() {
      const wave = Math.max(1, this.orderWave || 1);
      const score = KUP.META.orderScore({ kills: this.kills, time: this.time, wave });
      return { runId: this.run.id || null, kills: this.kills, time: this.time, wave, score };
    }
    stats() {
      return {
        time: this.time, kills: this.kills, level: this.level, witch: this.player.def.name,
        /* run 元信息：结算「復興率」用；由 ?seed=&area=&mod= 复现同一局 */
        area: KUP.I18N.tv(this.area.name), mod: KUP.I18N.tv(this.mod.name),
        seed: this.run.seed,
        areaId: this.run.area,
        /* v0.17：記憶の卵＝局内復活（不再进图鉴）；统计只反映本局用了多少次 */
        revives: this.eggUsed,
        eggCharge: this.eggCharge,
        /* v0.18 不可解空間：本局遇到过的空間（结算徽章展示；结束时已退回规则，故记 last） */
        space: (this.spacesSeen && this.spacesSeen.length) ? this.spacesSeen[this.spacesSeen.length - 1] : null,
        spaceName: (() => {
          const seen = this.spacesSeen || [];
          const d = seen.length ? KUP.SPACE_DEF(seen[seen.length - 1]) : null;
          return d ? KUP.I18N.tv(d.name) : null;
        })(),
        spaceCount: (this.spacesSeen || []).length,
        spaceActive: this.space ? this.space.id : null,
        bossEnraged: !!this.bossEnraged,
        bossName: this.boss ? KUP.I18N.tv(this.boss.def.name) : null,
        /* 形態/皮膚/同伴：结算与调试用 */
        form: this.player.form.id,
        formLabel: KUP.I18N.tv(this.player.form.name),
        companion: this.recruit ? this.recruit.name : null,
        companionForm: this.player.recruitForm.id,
        companionFormLabel: KUP.I18N.tv(this.player.recruitForm.name),
        /* v0.13.3：支援物品（取代同伴槽） */
        support: this.support ? this.support.id : null,
        supportName: this.support ? KUP.I18N.tv(this.support.name) : null,
        /* v0.18.3 暴击：次数、最高单发、当前会心率/倍率/特效 */
        crits: this.critCount || 0,
        critMax: Math.round(this.critMax || 0),
        critRate: this.player ? this.player.critRate : 0,
        critMult: this.player ? this.player.critMult : 1,
        critName: this.player && this.player.critName ? KUP.I18N.tv(this.player.critName) : null,
        /* v0.13 治安战：模式标记、波次、点数、治安战最高记录 */
        order: !!this.endless,
        wave: this.orderWave || 1,
        score: KUP.META ? KUP.META.orderScore({ kills: this.kills, time: this.time, wave: this.orderWave || 1 }) : 0,
        orderBest: (KUP.META && KUP.META.orderBest()) ? KUP.META.orderBest().score : 0,
      };
    }
  }

  KUP.Game = Game;
})();
