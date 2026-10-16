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
        KUP.UI.showBoss(true, this.boss.def);
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

    /* Boss 行为：按 def.pattern 分派——每番街一体（详见 data.js KUP.BOSSES） */
    updateBossBehavior(dt) {
      const b = this.boss;
      if (!b || b.dead) return;
      const p = this.player;
      /* 共通：5:00 暴走（结局分歧触发点） */
      if (this.time > C.ENRAGE_TIME && !b.enraged) {
        b.enraged = true;
        this.bossEnraged = true;
        b.speed *= 1.8;
        KUP.UI.banner(KUP.I18N.t('banner.enrage'), 2, 'warn');
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
        /* 〈観測〉肆番街：旋转光束扫射（先显示光路 0.3s 再发射）＋分裂体
         * ⚠️ 只使用 Danger（敌方专属）：**不会对破维魔造成任何伤害**，也不再复用玩家 Beam。 */
        case 'scan': {
          b.angle += (b.enraged ? 1.5 : 0.95) * dt;
          b.t2 -= dt;
          if (b.t2 <= 0) {
            b.t2 = b.enraged ? 0.45 : 0.62;
            this.dangers.push(new KUP.Danger(b.x, b.y, {
              kind: 'beam', dir: b.angle, len: 620, w: 22, dmg: 13, color: '#b58cff', arm: 0.3,
            }));
            KUP.Audio.sfx('laser');
          }
          b.minionT -= dt;
          if (b.minionT <= 0) { b.minionT = 7; this.spawnEnemy('glitch', b.x, b.y); this.spawnEnemy('glitch', b.x, b.y); }
          break;
        }
        /* 〈爆塵〉伍番街：轰炸**远离玩家**落点（留出安全区）＋视野遮蔽 */
        case 'smog': {
          b.t2 -= dt;
          if (b.t2 <= 0) {
            b.t2 = b.enraged ? 1.3 : 2.0;
            const n = b.enraged ? 3 : 2;
            /* 环状落点：距玩家 150–300px（绝不砸在脚下）＋信管 1.1s（能跑出去） */
            const base = U.rng() * U.TAU;
            for (let i = 0; i < n; i++) {
              const a = base + (i / n) * U.TAU + U.rand(-0.25, 0.25);
              const d = U.rand(150, 300);
              this.dangers.push(new KUP.Danger(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
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
        /* 〈再生〉陸番街（终盘）：阶段1 音波环+高速群 → 阶段2 轰炸+精英召唤 */
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
              const base = U.rng() * U.TAU;
              for (let i = 0; i < 3; i++) {
                const a = base + (i / 3) * U.TAU + U.rand(-0.3, 0.3);
                const d = U.rand(150, 290);
                this.dangers.push(new KUP.Danger(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {
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
