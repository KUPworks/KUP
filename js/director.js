window.KUP = window.KUP || {};

/* ================= 生成导演（从 game.js 拆分） =================
 * - 波次/精英/Boss 调度；街区可覆盖：area.waves / area.eliteTimes / area.bossTime
 * - 章节演出事件（area.events）：banner + 增援余波（surge）+ 视野遮蔽（fog）
 * - Boss 召唤混合異能个体（待修 #3：glitch/tank/elite）
 */
(function () {
  const U = KUP.U, C = KUP.CONFIG;

  const DirectorMixin = {
    /* ---------- 生成导演 ---------- */
    director(dt) {
      if (this.endless) return this.orderDirector(dt);   // v0.13 治安战：程序化无尽波次
      const t = this.time, area = this.area || {};
      /* 街区独立波次表（area.waves），缺省回落到全局表 */
      const table = area.waves || KUP.WAVES;
      let wave = table[0];
      for (const w of table) if (t >= w.t) wave = w;
      const capScale = this.enemies.length > C.MAX_ENEMIES * 0.7 ? 0.35 : 1;
      this.spawnAcc += wave.rate * this.mods.spawnRate * capScale * dt;
      // 章节演出的增援余波（不加成 mods —— 演出是演出）
      if (this.surgeT > 0) {
        this.surgeT -= dt;
        this.spawnAcc += this.surgePerSec * dt;
      }
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (this.enemies.length < C.MAX_ENEMIES) this.spawnEnemy(U.weightedPick(wave.types));
      }
      // 章节演出事件（各话副标题 → 变则波次/演出名）
      const events = area.events || [];
      while (this.evIdx < events.length && t >= events[this.evIdx].t) {
        this.fireAreaEvent(events[this.evIdx]);
        this.evIdx++;
      }
      // 精英（街区可覆盖时刻）
      const eliteTimes = area.eliteTimes || C.ELITE_TIMES;
      while (this.eliteIdx < eliteTimes.length && t >= eliteTimes[this.eliteIdx]) {
        this.eliteIdx++;
        this.spawnEnemy('elite');
        KUP.UI.banner(KUP.I18N.t('banner.elite'), 1.6, 'warn');
        KUP.Audio.sfx('warning');
      }
      // Boss（街区可覆盖时刻；每番街一体 Boss：area.boss）
      const bossTime = area.bossTime || C.BOSS_TIME;
      if (!this.bossSpawned && t >= bossTime) {
        this.bossSpawned = true;
        this.boss = this.spawnEnemy(area.boss || 'boss0');
        KUP.UI.banner(KUP.I18N.t('banner.boss', { name: KUP.I18N.tv(this.boss.def.name) }), 2.6, 'warn');
        KUP.Audio.sfx('boss');
        /* v0.15.3：血条不再在这里手动 showBoss —— 统一由 game.update 的 syncBosses
         * 按「存活 Boss 列表」每帧维护（多体并存时逐行显示、击破一体只减一行）。 */
      }
    },

    /* 章节演出事件：banner + 增援余波 + 可选视野遮蔽 */
    fireAreaEvent(ev) {
      if (ev.name) KUP.UI.banner(KUP.I18N.tv(ev.name), 2.2, 'warn');
      if (ev.surge) {
        const dur = ev.surgeT || 3;
        this.surgeT = dur;
        this.surgePerSec = ev.surge / dur;
      }
      if (ev.fog) {
        this.fogBoost = ev.fog;
        this.fogBoostT = ev.fogT || 6;
      }
      KUP.Audio.sfx('warning');
    },

    /* ---------- v0.13 治安战：无尽波次调度 ----------
     * 与番街的区别：不读 area.waves，而是按 CONFIG.ENDLESS 程序化生成——
     *   波次：每 WAVE_T 秒推进（横幅 + 增援余波），刷怪率与怪种逐波升级；
     *   精英：每 ELITE_EVERY 秒一体；
     *   Boss：每 BOSS_EVERY 秒一体（7 体轮换，第 n 体血量 ×(1 + n×HP_STEP)），
     *         击破**不会结束战斗**（game.killEnemy 走 endless 分支），Boss 出生
     *         BOSS_ENRAGE 秒后暴走（见 updateBossBehavior 的 endless 分支）。
     * 全部走同一随机流 → 同 seed 的治安战仍可复现。 */
    orderDirector(dt) {
      const EN = C.ENDLESS;
      /* 波次推进 */
      const wave = Math.floor(this.time / EN.WAVE_T) + 1;
      if (wave !== this.orderWave) {
        this.orderWave = wave;
        KUP.UI.banner(KUP.I18N.t('banner.order.wave', { n: wave }), 1.8);
        this.surgeT = Math.max(this.surgeT, 2.2);
        this.surgePerSec = 3 + wave * 0.7;
        KUP.Audio.sfx('warning');
      }
      /* 刷怪：率随波次增长，怪种分档 */
      const rate = Math.min(EN.RATE_MAX, EN.RATE_BASE + (wave - 1) * EN.RATE_STEP);
      const capScale = this.enemies.length > C.MAX_ENEMIES * 0.7 ? 0.35 : 1;
      this.spawnAcc += rate * this.mods.spawnRate * capScale * dt;
      if (this.surgeT > 0) {
        this.surgeT -= dt;
        this.spawnAcc += this.surgePerSec * dt;
      }
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (this.enemies.length < C.MAX_ENEMIES) this.spawnEnemy(this.orderType(wave));
      }
      /* 精英 */
      this.orderEliteT -= dt;
      if (this.orderEliteT <= 0) {
        this.orderEliteT = EN.ELITE_EVERY;
        this.spawnEnemy('elite');
        KUP.UI.banner(KUP.I18N.t('banner.elite'), 1.6, 'warn');
        KUP.Audio.sfx('warning');
      }
      /* Boss（轮换 + 血量递增） */
      this.orderBossT -= dt;
      if (this.orderBossT <= 0) {
        this.orderBossT = EN.BOSS_EVERY;
        this.orderBossIdx++;
        const b = this.spawnEnemy('boss' + ((this.orderBossIdx - 1) % 7));
        if (b) {
          const k = 1 + (this.orderBossIdx - 1) * EN.HP_STEP;
          b.maxhp = Math.round(b.def.hp * KUP.HP_SCALE(this.time) * this.mods.enemyHp * k);
          b.hp = b.maxhp;
          b.bornAt = this.time;              // 暴走计时以「出生」为基准（无尽模式）
          this.boss = b;
          KUP.UI.banner(KUP.I18N.t('banner.order.boss', { name: KUP.I18N.tv(b.def.name), n: this.orderBossIdx }), 2.4, 'warn');
          KUP.Audio.sfx('boss');
        }
      }
    },
    /* 治安战的怪种分档（越往后越凶；tank 逐渐加入） */
    orderType(wave) {
      const tiers = [
        { noise: 1 },
        { noise: 4, glitch: 1 },
        { noise: 3, glitch: 1.6, tank: 0.25 },
        { noise: 2.4, glitch: 2, tank: 0.5 },
        { noise: 2, glitch: 2.2, tank: 0.8 },
        { noise: 1.6, glitch: 2.4, tank: 1.1 },
      ];
      const idx = Math.max(0, Math.floor((wave - 1) / 3));
      return U.weightedPick(tiers[Math.min(tiers.length - 1, idx)]);
    },

    /* Boss 行为：按 def.pattern 分派——每番街一体（详见 data.js KUP.BOSSES）。
     * v0.13：Boss 行为**逐体**处理。
     * 治安战里前一体未被击破就又到点时，会同时存在多体 Boss：旧版只跑 this.boss，
     * 后来者会把前一体「顶掉」（前一体从此不再行动、HUD 也只显示一方），击破旧的一体
     * 还会把新一体的 this.boss 清空（行为/暴走/HUD 一起失效）——这就是「Boss 冲突」。
     * 各 Boss 的计时器（ringT/minionT/t2/t3）本就在 Enemy 构造器里逐体初始化，故逐体
     * 处理即可；this.boss 只作「HUD/结算看哪一体」的指针，始终指向最新出现的存活个体。 */
    updateBossBehavior(dt) {
      const live = this._liveBoss || (this._liveBoss = []);
      live.length = 0;
      for (const e of this.enemies) if (e.boss && !e.dead) live.push(e);
      if (!this.boss || this.boss.dead) this.boss = live.length ? live[live.length - 1] : null;
      for (const b of live) this._bossStep(b, dt);
    },
    _bossStep(b, dt) {
      const p = this.player;
      /* 共通：暴走（结局分歧触发点；治安战以「该 Boss 出生时刻」为基准） */
      const enrageAt = this.endless ? ((b.bornAt || 0) + C.ENDLESS.BOSS_ENRAGE) : C.ENRAGE_TIME;
      if (this.time > enrageAt && !b.enraged) {
        b.enraged = true;
        this.bossEnraged = true;
        b.speed *= 1.8;
        /* {name}：多体 Boss 并存时，暴走横幅要报**这一体**的名字（i18n 词典由
         * 另一位 Agent 正在改为 '{name}暴走'；词典未落地时回落旧文案，不会报错）。 */
        KUP.UI.banner(KUP.I18N.t('banner.enrage', { name: KUP.I18N.tv(b.def.name) }), 2, 'warn');
        KUP.Audio.sfx('warning');
      }
      /* v0.13：被冷冻／僵直的 Boss 暂停行动（计时器冻结、解冻后继续）——
       * 这是「冷冻」作为应急手段的核心价值：不仅停住移动，也停住敌袭节奏。 */
      if (b.stunT > 0) return;
      const mode = b.def.pattern || 'mute';
      /* 〈再生〉陸番街：两阶段 */
      if (mode === 'regen' && b.phaseNo === 1 && b.hp <= b.maxhp * 0.5) {
        b.phaseNo = 2;
        b.speed *= 1.15;
        KUP.UI.banner(KUP.I18N.t('banner.bossPhase'), 2.4, 'warn');
        KUP.Audio.sfx('boss');
      }
      switch (mode) {
        /* 〈消音〉零番街：音波环 + 混合召唤（预警 0.5s，可走出来） */
        case 'mute': {
          b.ringT -= dt;
          if (b.ringT <= 0) {
            b.ringT = b.enraged ? 2.6 : 4;
            this.dangers.push(new KUP.Danger(b.x, b.y, { kind: 'ring', maxR: 250, speed: 320, dmg: 22, color: '#ff2e88', arm: 0.5 }));
            KUP.Audio.sfx('warning');
          }
          b.minionT -= dt;
          if (b.minionT <= 0) {
            b.minionT = 5;
            const table = b.enraged ? { glitch: 2, tank: 1.4, elite: 0.35 } : { glitch: 2.2, noise: 1.4, tank: 0.7 };
            for (let i = 0; i < 3; i++) this.spawnEnemy(U.weightedPick(table), b.x, b.y);
          }
          break;
        }
        /* 〈緘黙〉壱番街：沉默冲锋（含预警线），沿途留下滞留伤害带 */
        case 'chase': {
          b.t2 -= dt;
          if (b.t2 <= 0 && b.dashT <= 0) {
            b.t2 = b.enraged ? 2.2 : 3.4;
            const a = Math.atan2(p.y - b.y, p.x - b.x);
            b.dashX = Math.cos(a) * b.speed * 3.2;
            b.dashY = Math.sin(a) * b.speed * 3.2;
            b.dashT = 0.9;
            b.chargeDir = a;
            /* 冲锋预警线（0.45s）：给玩家横向躲开或冲刺的时间 */
            this.dangers.push(new KUP.Danger(b.x, b.y, { kind: 'beam', dir: a, len: 420, w: 54, dmg: 15, color: '#55e0ff', arm: 0.45 }));
            KUP.Audio.sfx('warning');
          }
          b.t3 -= dt;
          if (b.t3 <= 0 && b.dashT > 0) {
            b.t3 = 0.16;
            this.dangers.push(new KUP.Danger(b.x, b.y, { kind: 'field', r: 46, dmg: 12, life: 2.4, color: '#55e0ff', tickRate: 0.6 }));
          }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 6.5; this.spawnEnemy('noise', b.x, b.y); }
          break;
        }
        /* 〈誘惑〉弐番街：三段音波环（错开预警，形成"缝隙"）+ 高速群 */
        case 'swarm': {
          b.ringT -= dt;
          if (b.ringT <= 0) {
            b.ringT = b.enraged ? 1.9 : 2.8;
            for (let i = 0; i < 3; i++) {
              this.dangers.push(new KUP.Danger(b.x, b.y, {
                kind: 'ring', maxR: 210 + i * 70, speed: 300 + i * 90, dmg: 16,
                color: '#ff7ad9', arm: 0.42 + i * 0.3,
              }));
            }
            KUP.Audio.sfx('warning');
          }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 4.5; for (let i = 0; i < 4; i++) this.spawnEnemy('glitch', b.x, b.y); }
          break;
        }
        /* 〈枯死〉参番街：散播毒区（预警 0.9s 后生效，可绕开） */
        case 'blight': {
          b.t2 -= dt;
          if (b.t2 <= 0) {
            b.t2 = b.enraged ? 1.5 : 2.4;
            const a = U.rng() * U.TAU, d = U.rand(30, 120);
            this.dangers.push(new KUP.Danger(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, {
              kind: 'field', r: 62, dmg: 11, life: 6, color: '#7dff6a', tickRate: 0.6, arm: 0.9,
            }));
            KUP.Audio.sfx('warning');
          }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 5.5; this.spawnEnemy('tank', b.x, b.y); }
          break;
        }
        /* 〈観測〉肆番街：**指向玩家**的光束（预警期内近段持续预瞄）＋分裂体
         * ⚠️ 只使用 Danger（敌方专属）：**不会对破维魔造成任何伤害**，也不再复用玩家 Beam。
         * v0.14（人类 2026-10-17「BOSS 的激光角度不能太死，要能打中 player」）：
         * 旧版是固定角速度的自转扫射（1.5s 才转一圈，玩家站着不动都可能擦不到），
         * 现在每条光束**发射时朝向玩家**、预警期里近段还会追着玩家转（Danger.aimAt），
         * 所以：
         *   ① 站着不动 → 多半被命中（这就叫"能打中"）；
         *   ② 横向移动/冲刺 → 能在 0.3s 预警里走出光路（可躲避，不是必中）。
         * 暴走时改为**双光束**（玩家两侧各一条，中间留一条缝隙），压力更大但仍可躲。 */
        case 'scan': {
          b.t2 -= dt;
          if (b.t2 <= 0) {
            b.t2 = b.enraged ? 0.5 : 0.68;
            const aim = Math.atan2(p.y - b.y, p.x - b.x);
            const mk = off => this.dangers.push(new KUP.Danger(b.x, b.y, {
              kind: 'beam', dir: aim + off, len: 620, w: 22, dmg: 13, color: '#b58cff', arm: 0.3,
              aimAt: { x: b.x, y: b.y }, aimF: 0.55, aimTurn: 1.9,
            }));
            mk(0);
            if (b.enraged) mk(0.34);                 // 第二道：偏移 19°，玩家只需侧移一步
            KUP.Audio.sfx('laser');
          }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 7; this.spawnEnemy('glitch', b.x, b.y); this.spawnEnemy('glitch', b.x, b.y); }
          break;
        }
        /* 〈爆塵〉伍番街：轰炸**压在玩家附近**（而不是远远绕开）＋视野遮蔽
         * v0.14（人类「轰炸区域应更靠近 player 但 player 容易跑出」）：
         * 旧版落点距玩家 150–300px 的环状带——既不压身又常常离得远，读感像"乱炸"。
         * 现在：落点距玩家 40–160px，且**至少一部分直接瞄准"预判位置"**
         * （玩家当前位置 + 当前速度 × 0.6s），爆炸半径 86 与信管 0.95–1.15s 不变
         * ⇒ 站着不动会被压到，持续移动就能跑出（预警时长 > 爆炸半径 / 走速）。 */
        case 'smog': {
          b.t2 -= dt;
          if (b.t2 <= 0) {
            b.t2 = b.enraged ? 1.25 : 1.9;
            const n = b.enraged ? 3 : 2;
            const base = U.rng() * U.TAU;
            /* 玩家速度（简化：用位移差/帧 1 阶估计，见 _playerVel 注释） */
            const vel = this._playerVel(p, dt);
            for (let i = 0; i < n; i++) {
              /* 第 0 个直接压预判点，其余散布在玩家周围 40–160px */
              const lead = i === 0 ? 0 : U.rand(40, 160);
              const a = i === 0 ? 0 : base + (i / n) * U.TAU + U.rand(-0.35, 0.35);
              const tx = p.x + vel.x * 0.6 + Math.cos(a) * lead;
              const ty = p.y + vel.y * 0.6 + Math.sin(a) * lead;
              this.dangers.push(new KUP.Danger(tx, ty, {
                kind: 'bomb', r: 86, dmg: 17, color: '#ffb25a', arm: b.enraged ? 0.95 : 1.15,
              }));
            }
            KUP.Audio.sfx('warning');
          }
          b.t3 -= dt;
          if (b.t3 <= 0) { b.t3 = 11; this.fogBoost = 0.3; this.fogBoostT = 3.5; }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 6; this.spawnEnemy('noise', b.x, b.y); this.spawnEnemy('noise', b.x, b.y); }
          break;
        }
        /* 〈再生〉陸番街（终盘）：阶段1 音波环+高速群 → 阶段2 轰炸+精英召唤
         * v0.14：阶段2 的轰炸同样改为「压在玩家附近、并能被跑出」（同 〈爆塵〉口径）。 */
        case 'regen':
        default: {
          if (b.phaseNo === 1) {
            b.ringT -= dt;
            if (b.ringT <= 0) {
              b.ringT = 3.4;
              this.dangers.push(new KUP.Danger(b.x, b.y, { kind: 'ring', maxR: 260, speed: 330, dmg: 22, color: '#8fd0ff', arm: 0.5 }));
              KUP.Audio.sfx('warning');
            }
            b.minionT -= dt;
            if (b.minionT <= 0) { b.minionT = 4.5; for (let i = 0; i < 4; i++) this.spawnEnemy('glitch', b.x, b.y); }
          } else {
            b.t2 -= dt;
            if (b.t2 <= 0) {
              b.t2 = 1.5;
              const vel = this._playerVel(p, dt);
              for (let i = 0; i < 3; i++) {
                const lead = i === 0 ? 0 : U.rand(40, 170);
                const a = U.rng() * U.TAU;
                const tx = p.x + vel.x * 0.55 + Math.cos(a) * lead;
                const ty = p.y + vel.y * 0.55 + Math.sin(a) * lead;
                this.dangers.push(new KUP.Danger(tx, ty, {
                  kind: 'bomb', r: 92, dmg: 19, color: '#8fd0ff', arm: 1.05,
                }));
              }
              KUP.Audio.sfx('warning');
            }
            b.minionT -= dt;
            if (b.minionT <= 0) { b.minionT = 6.5; this.spawnEnemy('elite', b.x, b.y); }
          }
          break;
        }
      }
    },

    /* ---------- 玩家速度估计（v0.14：轰炸的"预判位置"用）----------
     * 不读输入、不改玩家状态：用本帧与上一帧的位置差 / dt（一阶差分），
     * 再钳到玩家最大移速以内（冲刺那一下不当作持续速度）。
     * 首帧（无上帧记录）返回 (0,0) —— 此时落点就等于玩家脚下，同样符合"压在附近"。 */
    _playerVel(p, dt) {
      const last = this._pvLast;
      let vx = 0, vy = 0;
      if (last && dt > 0) {
        vx = (p.x - last.x) / dt; vy = (p.y - last.y) / dt;
        const cap = (p.speed || 200) * 1.1, sp = Math.hypot(vx, vy);
        if (sp > cap) { vx = vx / sp * cap; vy = vy / sp * cap; }
      }
      if (!last) this._pvLast = {}; 
      this._pvLast.x = p.x; this._pvLast.y = p.y;
      return { x: vx, y: vy };
    },

    spawnEnemy(typeId, nx, ny) {
      const def = KUP.ENEMIES[typeId];
      const p = this.player;
      let x, y;
      if (nx !== undefined) {
        x = nx + U.rand(-80, 80); y = ny + U.rand(-80, 80);
      } else {
        const R = Math.hypot(this.view.w, this.view.h) / 2 + 70;
        const a = U.rng() * U.TAU;
        x = U.clamp(p.x + Math.cos(a) * R, 30, C.ARENA - 30);
        y = U.clamp(p.y + Math.sin(a) * R, 30, C.ARENA - 30);
      }
      /* v0.11 建筑实体：敌人不可生成在楼体里——挤到最近的「圆心可站立」点。
       * Boss 豁免（碾压建筑，与碰撞规则一致）。 */
      if (this.citySolid && !def.boss && !this.walkable(x, y, def.r)) {
        const probe = { x, y, r: def.r, boss: false, dead: false };
        this.walkableNearest(probe);
        if (probe.dead) return null;                          // 极端 seed 找不到落点
        x = probe.x; y = probe.y;
      }
      const e = new KUP.Enemy(def, x, y,
        KUP.HP_SCALE(this.time) * this.mods.enemyHp,
        KUP.DMG_SCALE(this.time) * this.mods.enemyDmg);
      e.speed *= this.mods.enemySpeed;
      this.enemies.push(e);
      return e;
    },
  };

  /* 混入 Game 原型（game.js 先于本文件加载） */
  if (KUP.Game) Object.assign(KUP.Game.prototype, DirectorMixin);
  KUP.DirectorMixin = DirectorMixin;
})();
