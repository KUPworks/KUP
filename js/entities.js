window.KUP = window.KUP || {};

/* ================= 实体层 ================= */
(function () {
  const U = KUP.U, C = KUP.CONFIG;

  /* ---------- 玩家（主角＝魔女之子；带特殊歌唱用形態与同行同伴） ---------- */
  class Player {
    constructor(def, mods, opt) {
      opt = opt || {};
      this.def = def;
      this.mods = mods || {};       // 本局规则修正乘数（KUP.modsFor），由 Game.start 注入
      /* 皮膚＝「形態」：魔女之子的特殊歌唱用形態 + 魔女候補（同伴）皮膚「黑／白」 */
      this.form = opt.form || KUP.FORM('none');
      this.recruit = opt.recruit || null;
      this.recruitForm = opt.recruitForm || KUP.FORM('none');
      this.perk = opt.perk || null;   // 同伴 perk（gather 型在此结算；regen 型由 game.update 计时）
      this.shopMods = opt.shopMods || null; // 瓦利斯局外强化（小幅永久强化）
      this.color = this.form.id !== 'none' ? this.form.color : def.color;
      this.color2 = this.form.id !== 'none' ? this.form.color2 : def.color2;
      this.x = C.ARENA / 2; this.y = C.ARENA / 2;
      this.r = C.PLAYER_R;
      this.base = Object.assign({}, def.stats);
      this.passives = {};
      this.weapons = []; // WeaponRuntime 由 game 填充
      /* v0.8 生存机制状态：护盾 / 回避 / 吸血 / 反響 / 冲刺 */
      this.shield = 0; this.shieldMax = 0; this.noHitT = 0;
      this.dodgeChance = 0; this.drainPct = 0; this.retaliateDmg = 0;
      this.regenRate = 0; this.missHeal = 0;   // 持续回血 / 回避成功回血
      /* 局内道具的限时 BUFF（v0.8）：MISS/回血加成；v0.11 追加磁石の符（经验磁铁） */
      this.buffs = { miss: 0, missAmt: 0, regen: 0, regenAmt: 0, magnet: 0 };
      this.dashMax = C.DASH.CHARGES; this.dashCharge = this.dashMax;
      this.dashT = 0; this.dashCd = 0; this.dashCdMax = C.DASH.CD;
      this.dashX = 0; this.dashY = 0; this.ghosts = [];
      this.recompute();
      this.hp = this.maxhp;
      this.shield = this.shieldMax;
      this.aim = { x: 0, y: -1 };
      this.hitT = 0; this.flash = 0; this.walkT = 0; this.moving = false;
      this.invuln = false;
    }
    recompute() {
      const p = this.passives, lv = id => p[id] || 0, b = this.base;
      const m = k => (this.mods[k] === undefined ? 1 : this.mods[k]); // 规则修正，缺省 1
      /* 形態/皮膚修正（缺省 1）：魔女之子的特殊歌唱用形態 × 同伴皮膚 */
      const fmod = (obj, k) => (obj && obj.mods && obj.mods[k] !== undefined ? obj.mods[k] : 1);
      const fm = k => fmod(this.form, k) * fmod(this.recruitForm, k);
      /* 瓦利斯局外强化（市民票购买的小幅永久强化） */
      const sm = k => (this.shopMods && this.shopMods[k] !== undefined ? this.shopMods[k] : 1);
      /* 同伴 perk（魔女候補）：gather 型在此并入拾取/经验；regen 型由 game.update 计时 */
      const pk = this.perk || {};
      const gatherPickup = (pk.type === 'gather' && pk.pickup) ? pk.pickup : 1;
      const gatherXp = (pk.type === 'gather' && pk.xp) ? pk.xp : 1;
      this.maxhp = Math.round(b.hp * (1 + 0.25 * lv('heart')) * fm('hp') * sm('hp'));
      this.dmgMult = b.dmg * (1 + 0.12 * lv('power')) * m('playerDmg') * fm('dmg') * fm('playerDmg') * sm('playerDmg') * sm('dmg');
      this.cdMult = b.cd * Math.pow(0.91, lv('tempo')) * m('cooldown') * fm('cd') * sm('cd');
      this.areaMult = b.area * (1 + 0.12 * lv('field')) * fm('area');
      this.speed = b.speed * (1 + 0.09 * lv('steps')) * m('playerSpeed') * fm('speed') * sm('speed');
      this.pickup = C.PICKUP_BASE * (1 + 0.3 * lv('mic')) * m('pickup') * fm('pickup') * gatherPickup * sm('pickup');
      this.xpMult = b.xp * (1 + 0.15 * lv('stream')) * fm('xp') * gatherXp * sm('xp'); // 经验另由 mods.xpGain 在 addXP 结算
      /* ---- 机制型被动（v0.8） ---- */
      const prevShieldMax = this.shieldMax || 0;
      this.shieldMax = Math.round(22 * lv('shield'));
      if (this.shieldMax > prevShieldMax) this.shield = Math.min(this.shieldMax, (this.shield || 0) + (this.shieldMax - prevShieldMax));
      if (this.shieldMax < (this.shield || 0)) this.shield = this.shieldMax;
      /* 回避率 = 被动「残响回避」7%/级 ＋ 瓦利斯「常連の勘」3%/级，上限 60% */
      this.dodgeChance = Math.min(0.6, 0.07 * lv('dodge') + (this.shopMods && this.shopMods.dodgeAdd ? this.shopMods.dodgeAdd : 0));
      this.drainPct = 0.006 * lv('drain');
      this.retaliateDmg = 15 * lv('retaliate');
      /* 随时间持续回血 = 被动「余韵之癒」1.0/级 ＋ 瓦利斯「薬膳スープ」0.5/级（HP/秒） */
      this.regenRate = 1.0 * lv('regen') + (this.shopMods && this.shopMods.regenAdd ? this.shopMods.regenAdd : 0);
      /* 回避成功（MISS）时回血：最大生命的 1.5%/级（被动「無傷の譜」） */
      this.missHeal = 0.015 * lv('grace');
      this.dashMax = C.DASH.CHARGES + (lv('dashup') >= 1 ? 1 : 0) + (lv('dashup') >= 3 ? 1 : 0);
      this.dashCdMax = C.DASH.CD * Math.pow(0.85, lv('dashup'));
      this.dashCharge = Math.min(this.dashCharge === undefined ? this.dashMax : this.dashCharge, this.dashMax);
      if (this.hp !== undefined && this.hp > this.maxhp) this.hp = this.maxhp;
    }
    addPassive(id) { this.passives[id] = (this.passives[id] || 0) + 1; this.recompute(); }
    /* ---------- 局内道具（护盾 / MISS / 回血）---------- */
    addShield(n) { this.shield = Math.max(0, this.shield + n); return this.shield; }   // 可暂时超过 shieldMax
    addBuff(kind, seconds, amount) {
      const b = this.buffs;
      if (kind === 'miss') { b.miss = Math.max(b.miss, 0) + seconds; b.missAmt = Math.max(b.missAmt, amount); }
      else if (kind === 'regen') { b.regen = Math.max(b.regen, 0) + seconds; b.regenAmt = Math.max(b.regenAmt, amount); }
      else if (kind === 'magnet') { b.magnet = Math.max(b.magnet, 0) + seconds; } // 可重复选 → 时长叠加
    }
    /* 有效回避率（被动＋瓦利斯＋限时道具） */
    effDodge() { return Math.min(0.85, this.dodgeChance + (this.buffs.miss > 0 ? this.buffs.missAmt : 0)); }
    /* 有效每秒回血（被动＋瓦利斯＋限时道具） */
    effRegen() { return this.regenRate + (this.buffs.regen > 0 ? this.buffs.regenAmt : 0); }
    /* BUFF 计时（由 game.update 调用） */
    tickBuffs(dt) {
      const b = this.buffs;
      if (b.miss > 0) { b.miss -= dt; if (b.miss <= 0) { b.miss = 0; b.missAmt = 0; } }
      if (b.regen > 0) { b.regen -= dt; if (b.regen <= 0) { b.regen = 0; b.regenAmt = 0; } }
      if (b.magnet > 0) { b.magnet -= dt; if (b.magnet <= 0) b.magnet = 0; }
    }
    /* 冲刺：向当前瞄准方向位移，带无敌帧（可躲开 Danger 的预警攻击） */
    dash() {
      if (this.dashCharge <= 0 || this.dashT > 0) return false;
      const a = Math.atan2(this.aim.y, this.aim.x);
      this.dashX = Math.cos(a); this.dashY = Math.sin(a);
      this.dashT = C.DASH.DUR;
      this.dashCharge--;
      this.hitT = Math.max(this.hitT, C.DASH.IFRAME);
      this.ghosts.push({ x: this.x, y: this.y, age: 0 });
      KUP.Audio.sfx('select');
      return true;
    }
    update(dt, game) {
      const input = KUP.Input;
      let mx = ((input.keys.d || input.keys.arrowright) ? 1 : 0) - ((input.keys.a || input.keys.arrowleft) ? 1 : 0);
      let my = ((input.keys.s || input.keys.arrowdown) ? 1 : 0) - ((input.keys.w || input.keys.arrowup) ? 1 : 0);
      if (input.mdown) { // 按住鼠标 / 触摸 → 朝指针移动
        const wx = input.mx + game.cam.x, wy = input.my + game.cam.y;
        const dx = wx - this.x, dy = wy - this.y, d = Math.hypot(dx, dy);
        if (d > 10) { mx = dx / d; my = dy / d; }
      }
      const l = Math.hypot(mx, my);
      this.moving = l > 0.01;
      if (this.moving) {
        if (l > 1) { mx /= l; my /= l; }
        this.aim.x = mx; this.aim.y = my;
        this.walkT += dt * 10;
      }
      const A = C.ARENA;
      /* 冲刺位移（带无敌帧；位移期间忽略普通移动，视觉更"闪避"） */
      if (this.dashT > 0) {
        this.dashT -= dt;
        const k = Math.max(0, this.dashT / C.DASH.DUR);
        this.x += this.dashX * C.DASH.DIST * dt / C.DASH.DUR;
        this.y += this.dashY * C.DASH.DIST * dt / C.DASH.DUR;
        if (U.rng() < dt * 40) this.ghosts.push({ x: this.x, y: this.y, age: 0 });
        void k;
      } else {
        this.x += mx * this.speed * dt;
        this.y += my * this.speed * dt;
      }
      this.x = U.clamp(this.x, this.r, A - this.r);
      this.y = U.clamp(this.y, this.r, A - this.r);
      this.hitT -= dt; this.flash -= dt;
      /* 冲刺充能回复 */
      if (this.dashCharge < this.dashMax) {
        this.dashCd -= dt;
        if (this.dashCd <= 0) { this.dashCharge++; this.dashCd = this.dashCdMax; }
      }
      /* 残影寿命 */
      for (const gh of this.ghosts) gh.age += dt;
      this.ghosts = this.ghosts.filter(gh => gh.age < 0.3).slice(-10);
      /* 护盾：一段时间未受伤后自动回复 */
      this.noHitT += dt;
      if (this.shieldMax > 0 && this.noHitT > C.SHIELD_REGEN_DELAY && this.shield < this.shieldMax) {
        this.shield = Math.min(this.shieldMax, this.shield + this.shieldMax * C.SHIELD_REGEN_RATE * dt);
      }
      // 移动拖尾
      if (this.moving && U.rng() < dt * 22) {
        game.parts.push(new KUP.Particle(this.x - mx * 8, this.y - my * 8 + 4, U.rand(-12, 12), U.rand(-20, -4), 0.4, this.color, 2.2));
      }
    }
    /* 形態のアクセント（羽飾 plume／冠羽 crest／面紗 veil／光暈 halo）——比纯颜色更可辨的轮廓差异 */
    _accent(ctx, accent, bob, c) {
      if (!accent || accent === 'none') return;
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = c;
      if (accent === 'plume') {            // 花魁鳥：金色羽飾
        ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(1 + i * 2, bob - 22 - i);
          ctx.quadraticCurveTo(9 + i * 3, bob - 34 - i * 2, 15 + i * 4, bob - 30 - i * 3);
          ctx.stroke();
        }
      } else if (accent === 'crest') {     // 姬連雀：冠羽
        ctx.strokeStyle = '#c9ffe8'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 3, bob - 20);
          ctx.lineTo(i * 6, bob - 31 - Math.abs(i) * -2);
          ctx.stroke();
        }
      } else if (accent === 'veil') {      // 黑：夜之面紗
        ctx.globalAlpha = 0.5; ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(-11, bob - 8);
        ctx.quadraticCurveTo(0, bob + 4, 11, bob - 8);
        ctx.quadraticCurveTo(0, bob - 14, -11, bob - 8);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (accent === 'halo') {      // 白：昼之光暈
        ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(0, bob - 24, 9, 3, 0, 0, U.TAU); ctx.stroke();
      } else if (accent === 'sailor') {    // JK制服・夏服：白襟セーラー（水手领）
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-10, bob - 10);
        ctx.lineTo(-4, bob - 15); ctx.lineTo(0, bob - 10); ctx.lineTo(4, bob - 15); ctx.lineTo(10, bob - 10);
        ctx.lineTo(9, bob - 4); ctx.lineTo(-9, bob - 4);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#7fb0e6'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-8, bob - 5); ctx.lineTo(8, bob - 5); ctx.stroke();
        ctx.fillStyle = '#e05a7a';           // 領のリボン
        ctx.beginPath(); ctx.moveTo(0, bob - 9); ctx.lineTo(-3, bob - 6); ctx.lineTo(3, bob - 6); ctx.closePath(); ctx.fill();
      } else if (accent === 'blazer') {    // JK制服・冬服：深蓝ブレザー + 校章
        ctx.fillStyle = '#1d2a52';
        ctx.beginPath();
        ctx.moveTo(-10, bob - 12); ctx.lineTo(0, bob - 6); ctx.lineTo(10, bob - 12);
        ctx.lineTo(10, bob - 3); ctx.lineTo(-10, bob - 3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd98a';           // 校章
        ctx.beginPath(); ctx.arc(-5, bob - 8, 1.6, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = '#c9d6f5'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(1, bob - 5); ctx.lineTo(7, bob - 9); ctx.stroke();
      }
      ctx.restore();
    }
    draw(ctx, t) {
      const c = this.color, c2 = this.color2;
      const bob = this.moving ? Math.sin(this.walkT) * 2 : Math.sin(t * 2) * 1.2;
      // 同行同伴（魔女候補）——先画，位于主角侧后
      if (this.recruit) {
        const rc = this.recruitForm.id !== 'none' ? this.recruitForm.color : this.recruit.color;
        const rc2 = this.recruitForm.id !== 'none' ? this.recruitForm.color2 : this.recruit.color2;
        const cb = Math.sin(t * 2.4) * 2.2;
        const cxp = this.x - 17, cyp = this.y + 9;
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.shadowColor = rc; ctx.shadowBlur = 12;
        const rg = ctx.createRadialGradient(-2, -3 + cb, 1, 0, cb, 8);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.45, rc); rg.addColorStop(1, rc2);
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0, cb, 6.5, 0, U.TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = rc2;
        ctx.beginPath(); ctx.moveTo(-5, cb - 4); ctx.quadraticCurveTo(0, cb - 13, 5, cb - 4); ctx.closePath(); ctx.fill();
        // 皮膚アクセント（同伴侧）
        if (this.recruitForm.accent === 'halo') {
          ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.ellipse(0, cb - 13, 5, 1.8, 0, 0, U.TAU); ctx.stroke();
        } else if (this.recruitForm.accent === 'veil') {
          ctx.globalAlpha = 0.45; ctx.fillStyle = rc2;
          ctx.beginPath(); ctx.ellipse(0, cb + 1, 7, 5, 0, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
        } else if (this.recruitForm.accent === 'sailor') {   // JK制服・夏服：白襟
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-6, cb - 5); ctx.lineTo(-2.5, cb - 8.5); ctx.lineTo(0, cb - 5.5);
          ctx.lineTo(2.5, cb - 8.5); ctx.lineTo(6, cb - 5); ctx.lineTo(5, cb - 1.5); ctx.lineTo(-5, cb - 1.5);
          ctx.closePath(); ctx.fill();
        } else if (this.recruitForm.accent === 'blazer') {   // JK制服・冬服：ブレザー
          ctx.fillStyle = '#1d2a52';
          ctx.beginPath();
          ctx.moveTo(-6, cb - 6); ctx.lineTo(0, cb - 2.5); ctx.lineTo(6, cb - 6);
          ctx.lineTo(6, cb - 0.5); ctx.lineTo(-6, cb - 0.5);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      /* 冲刺残影（闪避轨迹） */
      for (const gh of this.ghosts) {
        const a = 1 - gh.age / 0.3;
        ctx.save();
        ctx.translate(gh.x - this.x, gh.y - this.y);
        ctx.globalAlpha = a * 0.4;
        ctx.fillStyle = '#bfefff';
        ctx.beginPath(); ctx.arc(0, 0, 10 * (0.7 + a * 0.3), 0, U.TAU); ctx.fill();
        ctx.restore();
      }
      /* 无敌帧（冲刺中）→ 半透明闪烁，明确"此刻不会受伤" */
      if (this.hitT > 0) {
        ctx.globalAlpha = 0.45 + 0.35 * Math.abs(Math.sin(t * 30));
      }
      /* 护盾：外圈薄膜（有护盾时明显可见，受损后变薄） */
      if (this.shieldMax > 0 && this.shield > 0) {
        const sk = this.shield / this.shieldMax;
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.35 * sk;
        ctx.strokeStyle = '#8fd0ff';
        ctx.lineWidth = 2 + 2 * sk;
        ctx.shadowColor = '#8fd0ff'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, bob, 16 + 2 * sk, 0, U.TAU); ctx.stroke();
        ctx.globalAlpha = 0.10 + 0.12 * sk;
        ctx.fillStyle = '#8fd0ff';
        ctx.beginPath(); ctx.arc(0, bob, 16 + 2 * sk, 0, U.TAU); ctx.fill();
        ctx.restore();
      }
      ctx.shadowColor = c; ctx.shadowBlur = 16;
      // 披风（朝向的反方向）
      const ang = Math.atan2(this.aim.y, this.aim.x);
      ctx.save();
      ctx.rotate(ang + Math.PI / 2);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-9, -2); ctx.quadraticCurveTo(0, 15, 9, -2); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      // 身体
      const g = ctx.createRadialGradient(-3, -6 + bob, 2, 0, bob, 12);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, c); g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, bob, 10, 0, U.TAU); ctx.fill();
      // 魔女帽
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.ellipse(0, bob - 8, 11, 4, 0, 0, U.TAU); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, bob - 8);
      ctx.quadraticCurveTo(-2, bob - 25, 6, bob - 20);
      ctx.quadraticCurveTo(1, bob - 14, 7, bob - 8);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(2, bob - 18, 1.6, 0, U.TAU); ctx.fill();
      // 形態アクセント
      this._accent(ctx, this.form.accent, bob, c);
      // 受击闪白
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(1, this.flash * 6);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, bob - 3, 13, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  /* ---------- 敌人（ノイズ） ---------- */
  class Enemy {
    constructor(def, x, y, hpScale, dmgScale) {
      this.def = def;
      this.x = x; this.y = y;
      this.r = def.r;
      this.maxhp = def.hp * hpScale; this.hp = this.maxhp;
      this.speed = def.speed * U.rand(0.92, 1.1);
      this.dmg = def.dmg * dmgScale;
      this.xp = def.xp;
      this.flash = 0; this.orbitT = 0; this.kx = 0; this.ky = 0;
      this.phase = U.rng() * U.TAU;
      this.dead = false;
      this.elite = !!def.elite; this.boss = !!def.boss;
      this.enraged = false; this.ringT = 3; this.minionT = 4;
      /* Boss 模式用计时器 / 滞留区减速 / 冲锋 */
      this.t2 = 2; this.t3 = 1.2; this.phaseNo = 1;
      this.slowT = 0; this.dashT = 0; this.dashX = 0; this.dashY = 0; this.angle = 0;
    }
    update(dt, game) {
      const p = game.player;
      const dx = p.x - this.x, dy = p.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      const wob = Math.sin(game.time * 2.2 + this.phase) * 0.35;
      const spd = this.speed * (this.slowT > 0 ? 0.55 : 1); // 滞留区减速
      this.x += (ux * spd - uy * wob * spd * 0.4 + this.kx) * dt;
      this.y += (uy * spd + ux * wob * spd * 0.4 + this.ky) * dt;
      this.kx *= Math.max(0, 1 - 7 * dt); this.ky *= Math.max(0, 1 - 7 * dt);
      this.flash -= dt; this.orbitT -= dt; this.slowT -= dt;
      if (this.dashT > 0) { // 冲锋系 Boss（壱番街〈緘黙〉）
        this.dashT -= dt;
        this.x += this.dashX * dt; this.y += this.dashY * dt;
        this.x = U.clamp(this.x, this.r, C.ARENA - this.r);
        this.y = U.clamp(this.y, this.r, C.ARENA - this.r);
      }
    }
    _shape(ctx, t, ox, oy) {
      const def = this.def, ph = this.phase;
      const n = def.sides || 7;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * U.TAU + t * (def.sides === 3 ? 3 : 0.6);
        const rr = this.r * (0.82 + 0.18 * Math.sin(a * 3 + t * 5 + ph));
        const x = Math.cos(a) * rr + ox, y = Math.sin(a) * rr + oy;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      if (this.boss) { // 核心「眼」
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ox, oy, this.r * 0.3, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#1a0f2e';
        ctx.beginPath(); ctx.arc(ox + Math.cos(t * 2) * this.r * 0.12, oy, this.r * 0.15, 0, U.TAU); ctx.fill();
      }
    }
    draw(ctx, t) {
      const c = this.def.color;
      ctx.save();
      ctx.translate(this.x, this.y);
      const jx = U.rand(-1.2, 1.2), jy = U.rand(-1.2, 1.2); // 每帧抖动 → 数字故障感
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = '#ff2bd6'; this._shape(ctx, t, -1.6 + jx, jy);
      ctx.fillStyle = '#2be0ff'; this._shape(ctx, t, 1.6 + jx, jy);
      ctx.globalAlpha = 1;
      ctx.fillStyle = c; this._shape(ctx, t, jx, jy);
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(1, this.flash * 10);
        ctx.fillStyle = '#fff'; this._shape(ctx, t, 0, 0);
        ctx.globalAlpha = 1;
      }
      // 精英 / Boss 血条
      if (this.elite || this.boss) {
        const w = this.r * 2.2, ratio = Math.max(0, this.hp / this.maxhp);
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(-w / 2, -this.r - 14, w, 4);
        ctx.fillStyle = this.boss ? '#ff2e88' : '#ff7a5a';
        ctx.fillRect(-w / 2, -this.r - 14, w * ratio, 4);
      }
      ctx.restore();
    }
  }

  /* ---------- 弹幕（音符 / 长枪） ---------- */
  class Projectile {
    constructor(x, y, vx, vy, opt) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.dmg = opt.dmg; this.r = opt.r || 6;
      this.life = opt.life || 2;
      this.pierce = opt.pierce || 0;
      this.homing = opt.homing || 0;
      this.target = opt.target || null;
      this.color = opt.color || '#fff';
      this.kind = opt.kind || 'orb';   // note | lance | mini
      this.split = opt.split || 0;
      this.hits = new Set();
      this.dead = false;
    }
    update(dt, game) {
      if (this.homing > 0) {
        if (!this.target || this.target.dead) this.target = game.nearestEnemy(this.x, this.y);
        if (this.target) {
          const ta = Math.atan2(this.target.y - this.y, this.target.x - this.x);
          const ca = Math.atan2(this.vy, this.vx);
          const na = U.aimAngle(ca, ta, this.homing, dt);
          const sp = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp;
        }
      }
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }
    draw(ctx, t) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color; ctx.shadowBlur = 8;
      if (this.kind === 'note') {
        ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.split ? '♬' : '♪', 0, 0);
      } else if (this.kind === 'lance') {
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(13, 0); ctx.lineTo(-4, 4.5); ctx.lineTo(-8, 0); ctx.lineTo(-4, -4.5);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.arc(0, 0, this.r * 0.45, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- 音片（フラグメント ★：经验 / 回复 / 記憶の卵） ---------- */
  class Gem {
    constructor(x, y, xp, type) {
      this.x = x; this.y = y; this.xp = xp;
      this.type = type || 'xp';   // xp | heal | egg（記憶の卵）
      this.vx = U.rand(-40, 40); this.vy = U.rand(-40, 40);
      this.t = U.rng() * U.TAU;
      this.dead = false;
    }
    update(dt, game) {
      const p = game.player;
      const dx = p.x - this.x, dy = p.y - this.y;
      const d2 = dx * dx + dy * dy;
      /* v0.11 经验磁铁（磁石の符）：激活期间拾取半径近乎全场，
       * 音片（含回复 ♥／記憶の卵）被强吸向魔女；远处吸力更大，保证能穿越半张图收回。 */
      const magnet = p.buffs && p.buffs.magnet > 0;
      const pr = magnet ? 4200 : p.pickup;
      if (d2 < pr * pr) {
        const d = Math.sqrt(d2) || 1;
        const pull = magnet
          ? 950 + 850 * (1 - Math.min(1, d / pr))
          : 320 + (1 - d / pr) * 520;
        this.vx = dx / d * pull; this.vy = dy / d * pull;
      } else {
        this.vx *= Math.max(0, 1 - 4 * dt); this.vy *= Math.max(0, 1 - 4 * dt);
      }
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.t += dt * 5;
      if (d2 < 16 * 16) {
        this.dead = true;
        if (this.type === 'heal') {
          const amt = Math.round(game.player.maxhp * 0.3);
          game.player.hp = Math.min(game.player.maxhp, game.player.hp + amt);
          game.addText(p.x, p.y - 24, '+' + amt, '#7dff9a', 14);
          KUP.Audio.sfx('heal');
        } else if (this.type === 'egg') {
          // 記憶の卵 ★：解锁记忆片段 + 復興率 +1%（KUP.META）
          game.onEggCollected(this);
        } else {
          game.gemCount += this.xp;
          game.addXP(this.xp);
          KUP.Audio.sfx('pickup');
        }
      }
    }
    draw(ctx, t) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.type === 'heal') {
        ctx.fillStyle = '#7dff9a'; ctx.shadowColor = '#7dff9a'; ctx.shadowBlur = 10;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
      } else if (this.type === 'egg') {
        // 記憶の卵 ★（动画第6話）：发光的卵形收集物
        const s = 1 + Math.sin(this.t) * 0.12;
        ctx.scale(s, s);
        ctx.fillStyle = '#fff6dd'; ctx.shadowColor = '#ffdf8a'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 8.2, 0, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#ffd25a';
        ctx.beginPath(); ctx.ellipse(-1.5, -2.5, 1.6, 2.2, -0.4, 0, U.TAU); ctx.fill();
      } else {
        const big = this.xp >= 10;
        const s = 1 + Math.sin(this.t) * 0.15;
        ctx.fillStyle = big ? '#ffd25a' : '#5ad0ff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7;
        const r = (big ? 6.5 : 4.5) * s;
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r, -r, r * 2, r * 2);
      }
      ctx.restore();
    }
  }

  /* ---------- 冲击环（**玩家武器专用**：只伤害破维魔） ----------
   * ⚠️ 敌方的音波环/光束/区域一律走 kUP.Danger（见下），不再复用本类——
   *    避免"Boss 借用玩家武器逻辑"导致对破维魔造成伤害、视觉也混淆。 */
  class Ring {
    constructor(x, y, opt) {
      this.x = x; this.y = y; this.r = opt.r0 || 6;
      this.maxR = opt.maxR; this.speed = opt.speed || 300;
      this.dmg = opt.dmg; this.kb = opt.kb || 0;
      this.color = opt.color || '#8fd0ff';
      this.hit = new Set();
      this.dead = false;
    }
    update(dt, game) {
      this.r += this.speed * dt;
      if (this.r >= this.maxR) { this.dead = true; return; }
      for (const e of game.enemies) {
        if (e.dead || this.hit.has(e)) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (Math.abs(d - this.r) < e.r + 9) {
          this.hit.add(e);
          const a = Math.atan2(e.y - this.y, e.x - this.x);
          game.damageEnemy(e, this.dmg, Math.cos(a) * this.kb, Math.sin(a) * this.kb);
        }
      }
    }
    draw(ctx, t) {
      const a = 1 - this.r / this.maxR;
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.25 + a * 0.6;
      ctx.lineWidth = 5 + a * 5;
      ctx.shadowColor = this.color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, U.TAU); ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------- 光束（**玩家武器专用**：即时判定 + 短暂残影） ---------- */
  class Beam {
    constructor(x, y, dir, opt) {
      this.x = x; this.y = y; this.dir = dir;
      this.len = opt.len; this.w = opt.w; this.dmg = opt.dmg;
      this.life = opt.life || 0.16; this.age = 0;
      this.color = opt.color || '#aef0ff';
      this.dead = false;
      // 立即结算（只对破维魔）
      const cs = Math.cos(dir), sn = Math.sin(dir);
      const game = opt.game;
      for (const e of game.enemies) {
        if (e.dead) continue;
        const tt = U.clamp((e.x - x) * cs + (e.y - y) * sn, 0, this.len);
        const px = x + cs * tt, py = y + sn * tt;
        if (U.dist2(e.x, e.y, px, py) < Math.pow(this.w / 2 + e.r, 2)) game.damageEnemy(e, this.dmg);
      }
    }
    update(dt) { this.age += dt; if (this.age >= this.life) this.dead = true; }
    draw(ctx, t) {
      const a = 1 - this.age / this.life;
      ctx.save();
      ctx.translate(this.x, this.y); ctx.rotate(this.dir);
      ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(0, 0, this.len, 0);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.25, this.color);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.shadowColor = this.color; ctx.shadowBlur = 16;
      const h = this.w / 2 * (0.5 + a * 0.5);
      ctx.fillRect(0, -h, this.len, h * 2);
      ctx.restore();
    }
  }

  /* ---------- 敌方攻击（Danger）：**与玩家武器完全分离** ----------
   * 为什么单独一类：Boss 若复用玩家武器（Ring/Beam/Zone），会 ①误伤破维魔 ②视觉与玩家武器混淆
   * ③难以统一做"可躲避"的预警。因此敌方攻击全部走本类，且：
   *   - **只伤害玩家**（命中判定自带，不依赖 Boss 逻辑，避免伤害写在别处）
   *   - 统一的**预警期**：arm>0 时先示警（斜纹 + 收缩倒计时环 + 「!」），到点才生效 → 可被躲开
   *   - 统一的高对比外观：品红/橙 + 斜纹 + 虚线边缘（与玩家青/金的柔和光圈明显区分）
   * kind: 'beam' 直线光束 | 'ring' 扩散音波环 | 'field' 持续伤害区 | 'bomb' 延迟爆炸 */
  class Danger {
    constructor(x, y, opt) {
      opt = opt || {};
      this.x = x; this.y = y;
      this.kind = opt.kind || 'field';
      this.r = opt.r || 60;
      this.dmg = opt.dmg || 10;
      this.color = opt.color || '#ff4d8d';
      this.age = 0;
      this.dead = false;
      this.hitPlayer = false;
      this.arm = opt.arm || 0;
      this.armed = this.arm <= 0;
      this.life = opt.life || 0;
      this.tickRate = opt.tickRate || 0.5;
      this.tick = 0;
      /* beam */
      this.dir = opt.dir || 0;
      this.len = opt.len || 600;
      this.w = opt.w || 20;
      this.beamLife = opt.beamLife || 0.22;
      /* ring */
      this.r0 = opt.r0 || 8;
      this.maxR = opt.maxR || 220;
      this.speed = opt.speed || 300;
      this.cur = this.r0;
      if (this.kind === 'beam' && this.armed) this.strikeBeam();
    }
    strikeBeam(game) {
      if (this.hitPlayer) return;
      this.hitPlayer = true;
      const g = game || KUP.game;
      if (!g || !g.player) return;
      const p = g.player;
      const cs = Math.cos(this.dir), sn = Math.sin(this.dir);
      const tt = U.clamp((p.x - this.x) * cs + (p.y - this.y) * sn, 0, this.len);
      const px = this.x + cs * tt, py = this.y + sn * tt;
      if (U.dist2(p.x, p.y, px, py) < Math.pow(this.w / 2 + p.r, 2)) g.hurtPlayer(this.dmg);
    }
    detonate(game) {
      if (!this.hitPlayer && U.dist2(game.player.x, game.player.y, this.x, this.y) < Math.pow(this.r + game.player.r, 2)) {
        game.hurtPlayer(this.dmg);
      }
      this.hitPlayer = true;
      game.shake(4);
      for (let i = 0; i < 14; i++) {
        const a = U.rng() * U.TAU;
        game.parts.push(new KUP.Particle(this.x, this.y, Math.cos(a) * U.rand(60, 200), Math.sin(a) * U.rand(60, 200), 0.5, this.color, 2.6));
      }
      KUP.Audio.sfx('boom');
    }
    update(dt, game) {
      this.age += dt;
      /* 预警阶段：只示警，不伤害（这就是"可躲避"的窗口） */
      if (!this.armed) {
        if (this.age >= this.arm) {
          this.armed = true;
          if (this.kind === 'bomb' || this.kind === 'field') this.detonate(game);
          else if (this.kind === 'beam') this.strikeBeam(game);
          this.age = 0;
        }
        return;
      }
      if (this.kind === 'beam') { if (this.age >= this.beamLife) this.dead = true; return; }
      if (this.kind === 'bomb') { if (this.age >= 0.16) this.dead = true; return; }
      if (this.kind === 'ring') {
        this.cur += this.speed * dt;
        if (!this.hitPlayer) {
          const p = game.player;
          const d = Math.hypot(p.x - this.x, p.y - this.y);
          if (Math.abs(d - this.cur) < p.r + 9) { this.hitPlayer = true; game.hurtPlayer(this.dmg); }
        }
        if (this.cur >= this.maxR) this.dead = true;
        return;
      }
      /* field：周期伤害（走 hurtPlayer 的无敌帧，站进去会被反复警告） */
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = this.tickRate;
        const p = game.player;
        if (U.dist2(p.x, p.y, this.x, this.y) < Math.pow(this.r, 2)) game.hurtPlayer(this.dmg);
      }
      if (this.life && this.age >= this.life) this.dead = true;
    }
    nearPlayer(p, pad) { return U.dist2(p.x, p.y, this.x, this.y) < Math.pow(this.r + (pad || 90), 2); }
    draw(ctx, t) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (!this.armed) {                       // 预警：斜纹 + 收缩倒计时
        const k = Math.max(0, Math.min(1, this.age / this.arm));
        if (this.kind === 'beam') {
          ctx.save(); ctx.rotate(this.dir);
          ctx.globalAlpha = 0.22 + 0.3 * Math.abs(Math.sin(t * 14));
          ctx.fillStyle = this.color;
          ctx.fillRect(0, -this.w / 2, this.len, this.w);
          ctx.globalAlpha = 0.95;
          ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 2;
          ctx.setLineDash([14, 9]);
          ctx.strokeRect(0, -this.w / 2, this.len, this.w);
          ctx.setLineDash([]);
          ctx.restore();
        } else {
          ctx.globalAlpha = 0.22 + 0.3 * Math.abs(Math.sin(t * 14));
          ctx.fillStyle = this.color;
          ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.fill();
          ctx.save();
          ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.clip();
          ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3;
          for (let i = -this.r; i < this.r * 2; i += 16) { ctx.beginPath(); ctx.moveTo(i, -this.r); ctx.lineTo(i + this.r, this.r); ctx.stroke(); }
          ctx.restore();
          ctx.globalAlpha = 0.95;
          ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, Math.max(6, this.r * k), 0, U.TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.stroke();
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#ffd25a';
          ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, 0);
        }
        ctx.restore();
        return;
      }
      if (this.kind === 'beam') {
        const a = Math.max(0, 1 - this.age / this.beamLife);
        ctx.rotate(this.dir);
        ctx.globalAlpha = a * 0.92;
        const g = ctx.createLinearGradient(0, 0, this.len, 0);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, this.color);
        g.addColorStop(1, 'rgba(255,77,141,0)');
        ctx.fillStyle = g;
        ctx.shadowColor = this.color; ctx.shadowBlur = 18;
        const h = this.w / 2;
        ctx.fillRect(0, -h, this.len, h * 2);
        ctx.globalAlpha = a * 0.75;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -h * 0.32, this.len, h * 0.64);
        ctx.restore();
        return;
      }
      if (this.kind === 'ring') {
        const a = 1 - this.cur / this.maxR;
        ctx.globalAlpha = 0.35 + a * 0.55;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6 + a * 6;
        ctx.setLineDash([18, 10]);
        ctx.shadowColor = this.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, 0, this.cur, 0, U.TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        return;
      }
      /* bomb/field：敌方区域（斜纹 + 虚线边缘） */
      const left = this.life ? Math.max(0, 1 - this.age / this.life) : 1;
      ctx.globalAlpha = this.kind === 'bomb' ? 0.7 : 0.18 + 0.24 * left;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.clip();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3;
      for (let i = -this.r; i < this.r * 2; i += 16) { ctx.beginPath(); ctx.moveTo(i, -this.r); ctx.lineTo(i + this.r, this.r); ctx.stroke(); }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  /* ---------- 滞留区域（**玩家武器专用**：音场・空爆・地雷） ----------
   * ⚠️ 敌方的毒区/轰炸一律走 KUP.Danger（见上），本类不再承担敌对分支。 */
  class Zone {
    constructor(x, y, opt) {
      opt = opt || {};
      this.x = x; this.y = y;
      this.r = opt.r || 60;
      this.dmg = opt.dmg || 0;
      this.color = opt.color || '#8fd0ff';
      this.kind = opt.kind || 'field';       // field 滞留音场 | bomb 空爆 | mine 地雷
      this.life = opt.life || 0;             // 0＝无时限（由 arm/引爆决定）
      this.age = 0;
      this.arm = opt.arm || 0;               // 引爆延迟（空爆的起爆前摇）
      this.armed = this.arm <= 0;
      this.tickRate = opt.tickRate || 0.45;
      this.tick = 0;
      this.slow = !!opt.slow;                // 是否给敌人减速（滞留效果）
      this.dead = false;
      this.hit = new Set();
    }
    detonate(game) {
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (U.dist2(e.x, e.y, this.x, this.y) < Math.pow(this.r + e.r, 2)) game.damageEnemy(e, this.dmg);
      }
      game.shake(this.kind === 'bomb' ? 5 : 3);
      const col = this.color;
      for (let i = 0; i < 14; i++) {
        const a = U.rng() * U.TAU;
        game.parts.push(new KUP.Particle(this.x, this.y, Math.cos(a) * U.rand(60, 200), Math.sin(a) * U.rand(60, 200), 0.5, col, 2.6));
      }
      KUP.Audio.sfx('boom');
    }
    update(dt, game) {
      this.age += dt;
      /* 地雷：待机 → 敌人触碰即引爆 → 消失 */
      if (this.kind === 'mine') {
        for (const e of game.enemies) {
          if (e.dead) continue;
          if (U.dist2(e.x, e.y, this.x, this.y) < Math.pow(this.r + e.r, 2)) {
            this.detonate(game);
            this.dead = true;
            return;
          }
        }
        if (this.life && this.age >= this.life) this.dead = true;
        return;
      }
      /* 空爆：前摇（警示圈）→ 引爆 → 短暂余像后消失 */
      if (this.kind === 'bomb') {
        if (!this.armed) {
          if (this.age >= this.arm) { this.armed = true; this.detonate(game); }
          return;
        }
        if (this.age >= this.arm + 0.15) this.dead = true;
        return;
      }
      /* 滞留音场：持续 tick（可减速敌人） */
      this.tick -= dt;
      const doTick = this.tick <= 0;
      if (doTick) this.tick = this.tickRate;
      for (const e of game.enemies) {
        if (e.dead) continue;
        if (U.dist2(e.x, e.y, this.x, this.y) < Math.pow(this.r + e.r, 2)) {
          if (this.slow) e.slowT = 0.4;
          if (doTick) game.damageEnemy(e, this.dmg);
        }
      }
      if (this.life && this.age >= this.life) this.dead = true;
    }
    draw(ctx, t) {
      const left = this.life ? Math.max(0, 1 - this.age / this.life) : 1;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (!this.armed) {                       // 起爆前摇：警示圈收缩
        const k = Math.max(0, this.age / this.arm);
        ctx.strokeStyle = '#ff8a5a';
        ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 12));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, this.r * (1 - k * 0.8), 0, U.TAU); ctx.stroke();
        ctx.restore();
        return;
      }
      const a = this.oneShot ? 0.75 : 0.16 + 0.2 * left;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, 0, this.r, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = Math.min(1, a + 0.28);
      ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, this.r * (this.kind === 'field' ? (0.9 + 0.08 * Math.sin(t * 4)) : 1), 0, U.TAU); ctx.stroke();
      if (this.kind === 'mine') {              // 地雷本体
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- 投掷物（残留音块：抛物线飞向落点，落地生成滞留区） ---------- */
  class Toss {
    constructor(x, y, tx, ty, opt) {
      opt = opt || {};
      this.x0 = x; this.y0 = y; this.tx = tx; this.ty = ty;
      this.x = x; this.y = y;
      this.dur = opt.fly || 0.4; this.t = 0;
      this.zone = opt.zone || null;            // 落地后生成的区域参数
      this.color = opt.color || '#ffd25a';
      this.dead = false;
    }
    update(dt, game) {
      this.t += dt;
      const k = Math.min(1, this.t / this.dur);
      this.x = this.x0 + (this.tx - this.x0) * k;
      this.y = this.y0 + (this.ty - this.y0) * k;
      if (k >= 1) {
        this.dead = true;
        if (this.zone) game.zones.push(new Zone(this.tx, this.ty, this.zone));
        KUP.Audio.sfx('hit');
      }
    }
    draw(ctx) {
      const k = Math.min(1, this.t / this.dur);
      const h = Math.sin(k * Math.PI) * 26;    // 抛物线高度（视觉）
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = this.color;
      ctx.beginPath(); ctx.arc(this.tx, this.ty, 8, 0, U.TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.translate(this.x, this.y - h);
      ctx.shadowColor = this.color; ctx.shadowBlur = 10;
      ctx.fillStyle = this.color;
      ctx.rotate(k * 6);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
    }
  }

  /* ---------- 粒子 / 飘字 ---------- */
  class Particle {
    constructor(x, y, vx, vy, life, color, size) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.life = life; this.age = 0;
      this.color = color; this.size = size || 3;
      this.dead = false;
    }
    update(dt) {
      this.age += dt;
      if (this.age >= this.life) { this.dead = true; return; }
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.vx *= Math.max(0, 1 - 3 * dt); this.vy *= Math.max(0, 1 - 3 * dt);
    }
    draw(ctx) {
      const a = 1 - this.age / this.life;
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * a + 0.5, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  class FloatText {
    constructor(x, y, txt, color, size) {
      this.x = x + U.rand(-6, 6); this.y = y;
      this.txt = txt; this.color = color || '#fff';
      this.size = size || 12;
      this.life = 0.7; this.age = 0;
      this.dead = false;
    }
    update(dt) { this.age += dt; this.y -= 42 * dt; if (this.age >= this.life) this.dead = true; }
    draw(ctx) {
      ctx.globalAlpha = 1 - this.age / this.life;
      ctx.fillStyle = this.color;
      ctx.font = 'bold ' + this.size + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.txt, this.x, this.y);
      ctx.globalAlpha = 1;
    }
  }

  KUP.Player = Player;
  KUP.Enemy = Enemy;
  KUP.Projectile = Projectile;
  KUP.Gem = Gem;
  KUP.Ring = Ring;
  KUP.Beam = Beam;
  KUP.Danger = Danger;
  KUP.Zone = Zone;
  KUP.Toss = Toss;
  KUP.Particle = Particle;
  KUP.FloatText = FloatText;
})();
