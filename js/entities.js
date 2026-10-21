window.KUP = window.KUP || {};

/* ================= 实体层 ================= */
(function () {
  const U = KUP.U, C = KUP.CONFIG;
  const DEG = Math.PI / 180;   // 数据表的角速度以**度/秒**书写（与武器 arc 同约定）

  /* 护盾对某类伤害的**减伤百分比**（只读计算，不触发任何副作用）——
   * HUD 显示与回归测试共用同一口径，避免"显示 95% 实际不是 95%"。
   * 口径（与 Player.applyShield 一字不差）：
   *   强度系数 k   ＝ 总强度 / 满值，钳到 [0,1]（22 护盾＝0.22，+60 膜＝0.82，满值＝1）
   *   查表基础值 b ＝ C.SHIELD.REDUCE[类型]
   *   减伤        ＝ 1 - (1-b) × 0.15 × (0.3 + 0.7k)       （满值 k=1 时精确等于 b；HARD_CAP 封顶）
   *   贴靠特例：被光束/轰炸打穿（taint）或**持续贴靠已失效**（touchT≤0 且 touchUsed）
   *            或总强度 < 满值 × TOUCH_UNIT ⇒ 0%。
   * p 可为玩家实例；缺 shieldTotal 时返回 0。 */
  KUP.shieldReducePct = (p, kind) => {
    const S = C.SHIELD, RU = S.REDUCE || {};
    const total = p && p.shieldTotal ? p.shieldTotal() : 0;
    if (total <= 0) return 0;
    if (kind === 'contact') {
      if (p.shieldTaintT > 0 || p.shieldTouchUsed || total < S.AURA_MAX * S.TOUCH_UNIT) return 0;
    }
    const base = RU[kind] !== undefined ? RU[kind] : RU.contact;
    const k = U.clamp(total / S.AURA_MAX, 0, 1);
    /* 强度曲线：满值＝基础值 base，强度低时按 SCALE_MUL/SCALE_OFF 打折、且不超过 base */
    const exp = base * (S.SCALE_OFF + S.SCALE_MUL * k);
    return Math.round(U.clamp(Math.min(exp, base), 0, S.HARD_CAP) * 100);
  };

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
      /* v0.8 生存机制状态：回避 / 吸血 / 反響 / 冲刺 */
      this.noHitT = 0;
      /* v0.14 护盾＝**减伤膜**（不是第二管血）：
       *   shield    ＝ 被动「防音护盾」的护盾值（0～C.SHIELD.AURA_MAX）
       *   shieldMax ＝ 该被动的上限（22/级，显示总强度用）
       *   shieldTmp ＝ 「防音の符」追加的膜层（+60，只减伤、到期消失）
       *   charge    ＝ **显示用**能量：记下最近一次被挡下的伤害量，随后衰减 ≠ 血量
       *   touchT/taintT ＝ 贴靠膜的持续判定与被光束/轰炸干扰的禁令
       * 总强度 shieldTotal() = 护盾值 + 膜层，减伤按**伤害类型**查表（C.SHIELD.REDUCE），
       * 上限 C.SHIELD.HARD_CAP。结算只改生命，护盾值**从不被扣光**。 */
      this.shield = 0; this.shieldMax = 0; this.shieldTmp = 0;
      this.shieldTmpT = 0;   // 膜层剩余秒数（到期归零 → 护盾回到被动给的那一层）
      this.shieldCharge = 0; this.shieldHitFx = 0;
      this.shieldTouchT = 0; this.shieldTaintT = 0; this.shieldTouchUsed = false;
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
      /* v0.14 护盾＝减伤强度：升级时把**新增的护盾值**直接加到当前护盾上（旧版是"回满"），
       * 因为护盾已不是一条会被扣空的血条，不存在"补满"的概念；上限＝C.SHIELD.AURA_MAX。 */
      const prevShieldMax = this.shieldMax || 0;
      this.shieldMax = Math.min(C.SHIELD.AURA_MAX, Math.round(C.SHIELD.AURA_LEVEL * lv('shield')));
      if (this.shieldMax > prevShieldMax) this.shield = Math.min(this.shieldMax, (this.shield || 0) + (this.shieldMax - prevShieldMax));
      if (this.shield > this.shieldMax) this.shield = this.shieldMax;
      this.shieldTmp = Math.min(C.SHIELD.TEMP_MAX, this.shieldTmp || 0);
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
    /* v0.14：「防音の符」＝在现有护盾之上**追加膜层**（上限 C.SHIELD.TEMP_MAX，存活
     * C.SHIELD.TEMP_SECONDS）。没有护盾时也照样生效——所以"无护盾直接 +60"一定有
     * 可见来源（膜层 60）。返回 { shieldTmp, shield, seconds }，供 HUD/漂浮字显示。 */
    addShield(n) {
      this.shieldTmp = Math.min(C.SHIELD.TEMP_MAX, (this.shieldTmp || 0) + n);
      this.shieldTmpT = C.SHIELD.TEMP_SECONDS;
      return { shieldTmp: this.shieldTmp, shield: this.shield || 0, seconds: this.shieldTmpT };
    }
    /* 护盾总强度（护盾值＋膜层）——只决定**减伤比例**，不是血量 */
    shieldTotal() { return (this.shield || 0) + (this.shieldTmp || 0); }
    /* ---------- 护盾减伤结算（v0.14）----------
     * kind：contact／ring／field／bomb／beam（未知名按 contact 处理）
     * 返回实际扣到生命的伤害；**不修改护盾值本身**，只记「能量」用于显示。
     * 贴靠膜：挡下第一击后 TOUCH_ARM 秒内失效（要持续贴靠才算"挡开"），
     * 被光束/轰炸打穿后 TAINT_T 秒内也失效 —— 被围住时不是无敌，而是争取脱身时间。 */
    applyShield(dmg, kind) {
      const S = C.SHIELD;
      const total = this.shieldTotal();
      if (total <= 0 || dmg <= 0) return dmg;
      if (kind === 'contact' &&
          (this.shieldTaintT > 0 || this.shieldTouchUsed || total < S.AURA_MAX * S.TOUCH_UNIT)) return dmg;
      const pct = KUP.shieldReducePct(this, kind) / 100;
      const blocked = dmg * pct;
      if (kind === 'contact') { this.shieldTouchT = S.TOUCH_ARM; this.shieldTouchUsed = true; }
      /* 光束/轰炸**打穿**膜层：贴靠膜失灵 TAINT_T 秒（其它类型的减伤照旧） */
      if (kind === 'beam' || kind === 'bomb') this.shieldTaintT = S.TAINT_T;
      this.shieldCharge = U.clamp(this.shieldCharge + blocked, 0, 100);
      this.shieldHitFx = 0.35;
      return dmg - blocked;
    }
    /* 护盾对某类伤害的减伤百分比（0～95）——HUD 与测试共用 KUP.shieldReducePct 的同一算法 */
    reducePct(kind) { return KUP.shieldReducePct(this, kind); }
    /* 被光束/轰炸**打穿**：贴靠膜失灵 TAINT_T 秒（护盾仍有其它类型的减伤） */
    shieldTaint() { this.shieldTaintT = C.SHIELD.TAINT_T; }
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
      } else if (this.moving) {
        /* v0.11 建筑实体：分轴移动——某轴被楼体挡住就只走另一轴（贴墙滑行，
         * 不会「顶住墙一动不动」）。判定用「物理嵌入」检查（freeAt），
         * 而非落点间隙（walkable），否则贴墙平行移动会被误挡。 */
        const ox = this.x, oy = this.y;
        this.x += mx * this.speed * dt;
        if (game.citySolid && !game.freeAt(this.x, oy, this.r)) this.x = ox;
        this.y += my * this.speed * dt;
        if (game.citySolid && !game.freeAt(this.x, this.y, this.r)) this.y = oy;
      } else {
        this.x += mx * this.speed * dt;
        this.y += my * this.speed * dt;
      }
      this.x = U.clamp(this.x, this.r, A - this.r);
      this.y = U.clamp(this.y, this.r, A - this.r);
      if (game.collideCity) game.collideCity(this);   // 兜底：冲刺穿墙/推挤角弹出
      this.hitT -= dt; this.flash -= dt;
      /* 冲刺充能回复 */
      if (this.dashCharge < this.dashMax) {
        this.dashCd -= dt;
        if (this.dashCd <= 0) { this.dashCharge++; this.dashCd = this.dashCdMax; }
      }
      /* 残影寿命 */
      for (const gh of this.ghosts) gh.age += dt;
      this.ghosts = this.ghosts.filter(gh => gh.age < 0.3).slice(-10);
      /* 护盾（v0.14）：减伤膜的计时——贴靠膜的持续判定、被打穿的失灵时间、
       * 显示用能量的衰减。护盾值/膜层**不会**随时间"回复"或"被扣"（不是血条）。 */
      this.noHitT += dt;
      if (this.shieldTouchT > 0) {
        this.shieldTouchT -= dt;
        if (this.shieldTouchT <= 0) { this.shieldTouchT = 0; this.shieldTouchUsed = false; }  // 脱离接触 → 贴靠膜重新可用
      }
      if (this.shieldTaintT > 0) this.shieldTaintT -= dt;
      if (this.shieldTmpT > 0) { this.shieldTmpT -= dt; if (this.shieldTmpT <= 0) { this.shieldTmpT = 0; this.shieldTmp = 0; } }
      if (this.shieldCharge > 0) this.shieldCharge = Math.max(0, this.shieldCharge - 100 * dt / C.SHIELD.DECAY_T);
      if (this.shieldHitFx > 0) this.shieldHitFx -= dt;
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
      } else if (accent === 'sparrow_wing') {   // 青雀（化歩）：背の青雀翼羽 ＋ 袖口の白線
        ctx.strokeStyle = '#8ff0ff'; ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(-6 - i * 3, bob - 12);
          ctx.quadraticCurveTo(-14 - i * 4, bob - 20 - i * 3, -20 - i * 5, bob - 16 - i * 4);
          ctx.stroke();
        }
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-7, bob - 5); ctx.lineTo(-2, bob - 8); ctx.stroke();
      } else if (accent === 'star_ring') {      // 幼年期の終わり（狸眼）：銀のリング ＋ 星屑
        ctx.strokeStyle = '#e8ecf6'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(0, bob - 26, 11, 4, -0.35, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(-8 + i * 8, bob - 33 + (i % 2) * 3, 1.2, 0, U.TAU); ctx.fill();
        }
      } else if (accent === 'koi_sash') {       // 九紋龍（派流）：紅金の龍紋帯 ＋ 肩の鯉鱗
        ctx.save();
        ctx.rotate(-0.5);
        ctx.fillStyle = '#c9203f';
        ctx.fillRect(-14, bob - 12, 28, 4.5);
        ctx.fillStyle = '#ffd98a';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.arc(i * 8, bob - 9.8, 1.7, 0, U.TAU); ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = '#ffb25a'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(9, bob - 13, 3.4, 0.6, 3.4); ctx.stroke();
      } else if (accent === 'flower_crown') {   // Heliotrope（世界）：天芥菜の花冠
        for (let i = -1; i <= 1; i++) {
          ctx.fillStyle = i === 0 ? '#efe0ff' : '#b98cff';
          ctx.beginPath(); ctx.arc(i * 7, bob - 22 - (i === 0 ? 2 : 0), 2.6, 0, U.TAU); ctx.fill();
          ctx.fillStyle = '#ffe9a8';
          ctx.beginPath(); ctx.arc(i * 7, bob - 22 - (i === 0 ? 2 : 0), 1, 0, U.TAU); ctx.fill();
        }
      } else if (accent === 'bird_plume') {     // 花譜系：頭上の羽根飾り（3 枚扇状）
        ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 4, bob - 20);
          ctx.quadraticCurveTo(i * 9, bob - 32, i * 13, bob - 38 + Math.abs(i) * 4);
          ctx.stroke();
        }
      } else if (accent === 'bird_tail') {      // 花譜系（尾羽型）：右下へ流れる長い尾羽
        ctx.strokeStyle = '#cfe8ff'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, bob - 8);
        ctx.quadraticCurveTo(16, bob - 2, 22, bob + 10);
        ctx.stroke();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(2, bob - 6);
        ctx.quadraticCurveTo(15, bob - 8, 24, bob + 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (accent === 'sf_visor') {       // 理芽系：SF 風のバイザー ＋ 軌道点
        ctx.fillStyle = 'rgba(232,236,246,0.55)';
        ctx.beginPath();
        ctx.moveTo(-9, bob - 13); ctx.lineTo(9, bob - 13); ctx.lineTo(7, bob - 9); ctx.lineTo(-7, bob - 9);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#9fe8ff';
        ctx.beginPath(); ctx.arc(11, bob - 20, 1.6, 0, U.TAU); ctx.fill();
      } else if (accent === 'koi_scales') {     // 春猿火系：肩の鯉鱗（重ねた 3 枚）
        ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(-2 + i * 5, bob - 7 + (i % 2) * 2, 3.2, Math.PI * 0.15, Math.PI * 0.95);
          ctx.stroke();
        }
      } else if (accent === 'flower_veil') {    // 世界系：花のヴェール ＋ 花びら
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#c9a6ff';
        ctx.beginPath();
        ctx.moveTo(-12, bob - 16);
        ctx.quadraticCurveTo(0, bob - 4, 12, bob - 16);
        ctx.quadraticCurveTo(0, bob - 24, -12, bob - 16);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#efe0ff';
        for (let i = 0; i < 2; i++) {
          ctx.beginPath(); ctx.ellipse(-8 + i * 16, bob - 24 - i * 3, 2.4, 1.4, i ? 0.6 : -0.6, 0, U.TAU); ctx.fill();
        }
      } else if (accent === 'star_orbit') {     // 幸祜系：傾いた軌道リング ＋ 星
        ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(0, bob - 24, 13, 5, 0.28, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(12, bob - 22, 1.8, 0, U.TAU); ctx.fill();
      } else if (accent === 'star_tiara') {     // アルナイル（此処）：星のティアラ
        ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-9, bob - 21); ctx.quadraticCurveTo(0, bob - 25, 9, bob - 21); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, bob - 36); ctx.lineTo(2.2, bob - 30); ctx.lineTo(8, bob - 28);
        ctx.lineTo(2.2, bob - 26); ctx.lineTo(0, bob - 20); ctx.lineTo(-2.2, bob - 26);
        ctx.lineTo(-8, bob - 28); ctx.lineTo(-2.2, bob - 30);
        ctx.closePath(); ctx.fill();
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
      /* 护盾（v0.14 减伤膜）：**厚度＝总强度**（护盾＋膜层），不是"血量比例"。
       *   颜色＝淡蓝（只有护盾）／青绿（含膜层）；被挡下的瞬间闪亮；
       *   被光束/轰炸打穿后 3 秒呈破碎虚线（贴靠膜失灵）；
       *   膜层即将过期（<1.5s）时收缩闪烁 —— 一眼能看出"还剩多少保护"。 */
      const shTotal = this.shieldTotal();
      if (shTotal > 0) {
        const k = U.clamp(shTotal / C.SHIELD.AURA_MAX, 0.15, 1.4);
        const hasTmp = (this.shieldTmp || 0) > 0;
        const shColor = hasTmp ? '#7dffe0' : '#8fd0ff';
        const tainted = this.shieldTaintT > 0;
        const pulse = this.shieldHitFx > 0 ? 0.35 + this.shieldHitFx : 0;
        ctx.save();
        ctx.globalAlpha = 0.30 + 0.35 * Math.min(1, k) + pulse;
        ctx.strokeStyle = tainted ? '#ff8a5a' : shColor;
        ctx.lineWidth = 1.5 + 2.6 * Math.min(1, k);
        ctx.shadowColor = tainted ? '#ff8a5a' : shColor; ctx.shadowBlur = 12 + 10 * Math.min(1, k) + pulse * 20;
        if (tainted) ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(0, bob, 13 + 5 * Math.min(1, k), 0, U.TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.07 + 0.10 * Math.min(1, k) + pulse * 0.5;
        ctx.fillStyle = shColor;
        ctx.beginPath(); ctx.arc(0, bob, 13 + 5 * Math.min(1, k), 0, U.TAU); ctx.fill();
        /* 膜层标记：外圈一道细环（有「防音の符」的膜层时才出现） */
        if (hasTmp) {
          ctx.globalAlpha = 0.5 + 0.3 * Math.abs(Math.sin(t * 6));
          ctx.strokeStyle = '#bff7ff'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, bob, 20 + 3 * Math.min(1, (this.shieldTmp || 0) / C.SHIELD.TEMP_MAX), 0, U.TAU); ctx.stroke();
        }
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
      /* v0.13 状态异常：
       *   stunT  ＝ 僵直／冷冻剩余秒数（完全停止：不移动、不行动、不造成接触伤害）
       *   slowT  ＝ 减速剩余秒数；slowMul ＝ 减速倍率（越小越慢，取「最强」来源） */
      this.stunT = 0; this.slowMul = 1; this.stunMax = 0;
      /* v0.13.1 绕楼寻路：navX/navY ＝ 避障后的可走方向；navSide/navHold ＝
       * 「粘住哪一侧」的滞回（见 game.steerCity）；freezeAt ＝ 冻住那一刻的
       * 视觉时钟（冻僵的敌人连形变与故障抖动都定格，一眼可辨）。 */
      this.navX = 0; this.navY = 0; this.navSide = 0; this.navHold = 0;
      /* dirA ＝ 当前朝向角（懒初始化：第一次 update 时对准玩家）。朝向以
       * **角速度上限** `def.turn`（度/秒，数据表）转向可走方向——贴墙绕行与
       * 进入/脱离贴墙都成为弧线，不再是逐档跳变的折线。
       * spinAcc/chkX/chkY ＝ 防打转看门狗（转过多少 & 从哪开始量的位移）；
       * escX/escY/escT ＝ 逃逸方向与剩余时间（极窄楼缝里的脱困手段）。 */
      this.dirA = null;
      this.spinAcc = 0; this.chkX = null; this.chkY = null;
      this.escX = 0; this.escY = 0; this.escT = 0;
      this.freezeAt = null;
    }
    update(dt, game) {
      const p = game.player;
      this.flash -= dt; this.orbitT -= dt;
      if (this.stunT > 0) { this.stunT -= dt; this.kx = 0; this.ky = 0; return; }  // 冷冻：完全静止
      if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) { this.slowT = 0; this.slowMul = 1; } }
      const dx = p.x - this.x, dy = p.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      /* 目标方向：默认指向玩家；被楼体挡住时由 steerCity 投影到可走路径上。
       * 逃逸期（看门狗触发后）改走「最开阔方向」，决定性离开窄缝。 */
      let tx = dx / d, ty = dy / d, wobK = 1;
      if (this.escT > 0) {
        this.escT -= dt;
        tx = this.escX; ty = this.escY; wobK = C.NAV.WOBBLE;
      } else if (game.steerCity && game.steerCity(this, tx, ty, dt)) {
        tx = this.navX; ty = this.navY; wobK = C.NAV.WOBBLE;      // 绕行时收敛蛇行
      }
      /* 朝向以角速度上限转向目标方向（数据表 turn，度/秒；缺省 CONFIG.NAV.TURN） */
      const want = Math.atan2(ty, tx);
      if (this.dirA === null) { this.dirA = want; this.chkX = this.x; this.chkY = this.y; }
      const turn = (this.def.turn || C.NAV.TURN) * DEG;
      const prevA = this.dirA;
      this.dirA = U.aimAngle(prevA, want, turn, dt);
      const ux = Math.cos(this.dirA), uy = Math.sin(this.dirA);
      const wob = Math.sin(game.time * 2.2 + this.phase) * 0.35 * wobK;
      const spd = this.speed * (this.slowT > 0 ? this.slowMul : 1); // 减速（滞留区／鈍足の符）
      this.x += (ux * spd - uy * wob * spd * 0.4 + this.kx) * dt;
      this.y += (uy * spd + ux * wob * spd * 0.4 + this.ky) * dt;
      /* 防打转看门狗：极少数「斜对角楼缝」会把敌人夹在 ~34px 的口袋里，投影方向随之
       * 逐帧翻转、朝向按上限空转却寸步难行。累计转向超过 SPIN 弧度而净位移不足一个
       * 半径 ⇒ 判定卡住，改走最开阔方向逃逸 ESC_T 秒（此后自动恢复常规绕行）。 */
      this.spinAcc += Math.abs(U.angDiff(this.dirA, prevA));
      if (this.spinAcc > C.NAV.SPIN) {
        if (Math.hypot(this.x - this.chkX, this.y - this.chkY) < this.r &&
            game.escapeDir && game.escapeDir(this)) {
          this.escT = C.NAV.ESC_T;
          this.dirA = Math.atan2(this.escY, this.escX);   // 逃逸要果断：朝向直接对准，别再转半圈
        }
        this.spinAcc = 0; this.chkX = this.x; this.chkY = this.y;
      }
      this.kx *= Math.max(0, 1 - 7 * dt); this.ky *= Math.max(0, 1 - 7 * dt);
      if (this.dashT > 0) { // 冲锋系 Boss（壱番街〈緘黙〉）
        this.dashT -= dt;
        this.x += this.dashX * dt; this.y += this.dashY * dt;
      }
      /* v0.15.3：**所有敌人**都被夹在竞技场内（含 Boss）。
       * 旧版只有冲锋位移那一段做了 clamp，普通移动与**击退**（kx/ky）不受约束——
       * 治安战里多体 Boss 会被浄化の歌/冲击环的击退一路推出场外（相机贴着竞技场边界，
       * 于是 Boss 跑到画面外、玩家打不到），这就是「会被击退出场」。
       * 与玩家的处理一致：位置夹在 [r, ARENA-r]，击退仍然生效（只是不会再出界）。 */
      this.x = U.clamp(this.x, this.r, C.ARENA - this.r);
      this.y = U.clamp(this.y, this.r, C.ARENA - this.r);
    }
    /* 施加减速（取最强来源：倍率更低者胜出；时间取较长者）。
     * 返回是否生效（同类更弱的效果不会覆盖更强的）。 */
    applySlow(seconds, mul) {
      const cur = this.slowT > 0 ? this.slowMul : 1;
      const stronger = mul < cur;
      if (!stronger && this.slowT >= seconds) return false;
      this.slowMul = stronger ? mul : cur;
      this.slowT = Math.max(this.slowT, seconds);
      return true;
    }
    /* 施加僵直／冷冻（取较长者） */
    applyStun(seconds) {
      if (seconds <= 0) return false;
      this.stunT = Math.max(this.stunT, seconds);
      this.stunMax = Math.max(this.stunMax, this.stunT);
      return true;
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
      /* 数字故障抖动（v0.13.1）：
       *   原版每帧取一次 U.rand 白噪声——观感对，却在渲染路径消费随机流
       *   （违反 AGENTS §3，帧率会打乱同 seed 复现）；v0.13.0 改为 sin(t*61)
       *   后观感随刷新率漂移（60Hz 每帧跳 58°、144Hz 却是平滑绕圈），
       *   不再是「跳变的故障感」。
       *   现在用**离散故障时钟**：按 GLITCH.HZ 对时间取整数刻度，偏移由整数散列
       *   给出 ⇒ 定频跳变、跨刷新率一致、不碰随机流；品红/青两层各自错位，
       *   做出「信号撕裂」而不是整体平移。
       *   冻僵（stunT>0）时把视觉时钟定格在冻住的那一刻：抖动与形变一起停。 */
      const G = C.GLITCH;
      if (this.stunT > 0) { if (this.freezeAt == null) this.freezeAt = t; } else this.freezeAt = null;
      const vt = this.freezeAt == null ? t : this.freezeAt;
      const sd = (this.phase * 4096) | 0, gs = Math.floor(vt * G.HZ);
      const nx = U.hash01(gs * 2 + sd), ny = U.hash01(gs * 2 + 1 + sd);
      const jx = (nx * 2 - 1) * G.JITTER, jy = (ny * 2 - 1) * G.JITTER;
      const ds = (U.hash01(gs * 5 + 7 + sd) * 2 - 1) * G.SPLIT * 0.55;   // 色散错位的抖动
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = '#ff2bd6'; this._shape(ctx, vt, -G.SPLIT + ds + jx, jy);
      ctx.fillStyle = '#2be0ff'; this._shape(ctx, vt, G.SPLIT + ds + jx, jy);
      ctx.globalAlpha = 1;
      ctx.fillStyle = c; this._shape(ctx, vt, jx, jy);
      if (this.flash > 0) {
        ctx.globalAlpha = Math.min(1, this.flash * 10);
        ctx.fillStyle = '#fff'; this._shape(ctx, vt, 0, 0);
        ctx.globalAlpha = 1;
      }
      /* v0.13 状态异常视觉：
       *   冷冻（stunT）＝冰晶覆盖 + 三根冰棱（完全静止，一眼可辨）
       *   减速（slowT）＝外圈蓝色光环（强度随倍率） */
      if (this.stunT > 0) {
        ctx.globalAlpha = 0.42 + 0.18 * Math.abs(Math.sin(t * 4 + this.phase));
        ctx.fillStyle = '#bff0ff'; this._shape(ctx, vt, 0, 0);
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) {
          const a = this.phase + i * (U.TAU / 3);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * this.r * 0.15, Math.sin(a) * this.r * 0.15);
          ctx.lineTo(Math.cos(a) * this.r * 1.3, Math.sin(a) * this.r * 1.3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (this.slowT > 0) {
        const k = 1 - Math.min(1, this.slowMul);            // 减速越强，光环越亮
        ctx.globalAlpha = 0.3 + 0.5 * k;
        ctx.strokeStyle = '#8fd0ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, this.r + 4, 0, U.TAU); ctx.stroke();
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
    draw(ctx, t, glow) {
      ctx.save();
      ctx.translate(this.x, this.y);
      /* v0.13.6：辉光（canvas shadow）＝**每个弹体一次独立模糊 pass**，高密度下极贵
       * （实测 400 弹体时 render 单帧冲到 15ms+）。由渲染侧按密度决定是否开：
       * 弹体数 ≤ 阈值照旧发光，超了只画实心形状——正常密度下外观完全不变。 */
      if (glow !== false) { ctx.shadowColor = this.color; ctx.shadowBlur = 8; }
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

  /* ---------- 片段（フラグメント ★：经验 / 回复 / 記憶の卵） ---------- */
  class Gem {
    constructor(x, y, xp, type) {
      this.x = x; this.y = y; this.xp = xp;
      this.type = type || 'xp';   // xp | heal（v0.17：記憶の卵不再是掉落物）
      this.vx = U.rand(-40, 40); this.vy = U.rand(-40, 40);
      this.t = U.rng() * U.TAU;
      /* v0.18.1（人类 2026-10-21「五分钟过期直接消失」）：未拾取的片段有存活时间，
       * 到点直接消失、**不结算经验**——避免玩家不捡时片段无限堆积触发配额合并。 */
      this.life = C.GEM_LIFE;
      this.dead = false;
    }
    update(dt, game) {
      this.life -= dt;
      if (this.life <= 0) { this.dead = true; return; }     // 超时消失（不吞不结算）
      const p = game.player;
      const dx = p.x - this.x, dy = p.y - this.y;
      const d2 = dx * dx + dy * dy;
      /* v0.11 经验磁铁（磁石の符）：激活期间拾取半径近乎全场，
       * 片段（含回复 ♥／記憶の卵）被强吸向魔女；远处吸力更大，保证能穿越半张图收回。 */
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
      } else {
        const big = this.xp >= 10;
        const s = 1 + Math.sin(this.t) * 0.15;
        ctx.fillStyle = big ? '#ffd25a' : '#d8f3ff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7;
        const r = (big ? 6.5 : 4.5) * s;
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r, -r, r * 2, r * 2);
      }
      ctx.restore();
    }
  }

  /* ---------- 挥砍（近战扇形）· v0.12 新武器模组 ----------
   * 「斬音の太刀」的攻击实体：以玩家为圆心、朝 aim 方向挥出的**扇形**。
   * 两个关键参数（全部由数据表 KUP.WEAPONS[*].levels 提供）：
   *   len ＝ 刀长（半径，px）
   *   arc ＝ 扇形角度（弧度；数据表里写「度」，由武器分派换算）
   * 判定：整个挥砍窗口（life）内逐帧检测，每个敌人每次挥砍**只吃一次**伤害
   *      （hit 集合）；角度容差按敌人半径放宽（atan2(e.r, d)），贴边也能扫到。 */
  class Slash {
    constructor(x, y, dir, opt) {
      opt = opt || {};
      this.x = x; this.y = y;
      this.dir = dir || 0;                          // 扇形中心方向
      this.len = opt.len || 110;                    // 刀长（px）
      this.arc = opt.arc || Math.PI * 0.6;          // 扇形角度（rad）
      this.dmg = opt.dmg || 0; this.kb = opt.kb || 0;
      this.color = opt.color || '#ffd9a0';
      this.life = opt.life || 0.18;                 // 判定窗口＝挥砍动画时长
      this.age = 0;
      this.follow = opt.follow !== false;            // 挥砍期间贴身跟随玩家
      this.hit = new Set();
      this.dead = false;
    }
    /* 扇形判定（含敌人半径的角度容差与刀长容差） */
    contains(x, y, r) {
      const dx = x - this.x, dy = y - this.y;
      const d = Math.hypot(dx, dy);
      if (d - (r || 0) > this.len) return false;
      if (this.arc >= U.TAU - 1e-6) return true;
      const da = Math.abs(U.angDiff(Math.atan2(dy, dx), this.dir));
      return da <= this.arc / 2 + Math.atan2(r || 0, Math.max(10, d));
    }
    update(dt, game) {
      this.age += dt;
      const p = game.player;
      if (this.follow && p) { this.x = p.x; this.y = p.y; }
      for (const e of game.enemies) {
        if (e.dead || this.hit.has(e)) continue;
        if (!this.contains(e.x, e.y, e.r)) continue;
        this.hit.add(e);
        const a = Math.atan2(e.y - this.y, e.x - this.x);
        game.damageEnemy(e, this.dmg, Math.cos(a) * this.kb, Math.sin(a) * this.kb);
      }
      if (this.age >= this.life) this.dead = true;
    }
    draw(ctx, t) {
      const k = Math.min(1, this.age / this.life);
      const half = this.arc / 2;
      const a0 = this.dir - half, a1 = this.dir + half;
      const fade = 1 - k;
      ctx.save();
      ctx.translate(this.x, this.y);
      /* 挥砍观感＝**一道扫过去的刀光**，不画扇形范围框：
       * 旧版画了整片扇形底面 ＋ 整段外弧 ＋ 两条半径边界线，等于把「判定范围」
       * 直接摊在屏幕上（人类 2026-10-16 反馈「不要显示范围框」）。
       * 现在只保留：① 刃线（当前扫到哪）② 紧跟其后的弧形残影（长度 = 已扫过的角度）。 */
      const sweep = a0 + (a1 - a0) * k;
      const trail = Math.min(sweep - a0, Math.min(this.arc, 1.25));   // 残影最多 1.25rad，短刀也跟手
      ctx.globalAlpha = 0.5 + 0.45 * fade;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = this.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, this.len, sweep - trail, sweep); ctx.stroke();
      /* 刃线：从刀身内侧扫向刀尖 */
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sweep) * this.len * 0.16, Math.sin(sweep) * this.len * 0.16);
      ctx.lineTo(Math.cos(sweep) * this.len, Math.sin(sweep) * this.len);
      ctx.stroke();
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
      /* v0.12 圆形波的**角度参数**：
       *   arc ＝ 扇形角度（rad），缺省 TAU＝整圆（既有武器行为不变）
       *   dir ＝ 扇形中心方向（rad）
       * 传入 arc < TAU 时，波只在扇形内判定与绘制（定向冲击波）。 */
      this.arc = opt.arc !== undefined ? opt.arc : U.TAU;
      this.dir = opt.dir || 0;
      /* edges ＝ 是否补画两条半径边（「扇形角度」的可视化）。缺省 true；
       * 近战挥刀（斩音太刀）的冲击波传 false —— 那一刀只想看到"扫过去的光"，
       * 不想在屏幕上摊出判定范围的框（人类 2026-10-16 反馈）。 */
      this.edges = opt.edges !== false;
      this.hit = new Set();
      this.dead = false;
    }
    /* 扇形判定：整圆时恒真 */
    inArc(x, y) {
      if (this.arc >= U.TAU - 1e-6) return true;
      return Math.abs(U.angDiff(Math.atan2(y - this.y, x - this.x), this.dir)) <= this.arc / 2;
    }
    update(dt, game) {
      this.r += this.speed * dt;
      if (this.r >= this.maxR) { this.dead = true; return; }
      for (const e of game.enemies) {
        if (e.dead || this.hit.has(e)) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (Math.abs(d - this.r) < e.r + 9 && this.inArc(e.x, e.y)) {
          this.hit.add(e);
          const a = Math.atan2(e.y - this.y, e.x - this.x);
          game.damageEnemy(e, this.dmg, Math.cos(a) * this.kb, Math.sin(a) * this.kb);
        }
      }
    }
    draw(ctx, t) {
      const a = 1 - this.r / this.maxR;
      const full = this.arc >= U.TAU - 1e-6;
      const a0 = full ? 0 : this.dir - this.arc / 2;
      const a1 = full ? U.TAU : this.dir + this.arc / 2;
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = 0.25 + a * 0.6;
      ctx.lineWidth = 5 + a * 5;
      ctx.shadowColor = this.color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, a0, a1); ctx.stroke();
      if (!full && this.edges) {
        /* 扇形波：补两条半径边，明确「角度参数」的边界（近战挥刀不画，见 edges） */
        ctx.globalAlpha = 0.18 + a * 0.45;
        ctx.lineWidth = 3 + a * 3;
        ctx.beginPath();
        ctx.moveTo(this.x + Math.cos(a0) * this.r, this.y + Math.sin(a0) * this.r);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(a1) * this.r, this.y + Math.sin(a1) * this.r);
        ctx.stroke();
      }
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
      /* v0.14：kind 同时就是**伤害类型**（contact 由接触伤害另行传入），
       * 玩家护盾按它查减伤表（C.SHIELD.REDUCE）：beam 50%／bomb 70%／field 75%／ring 85%。 */
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
      /* v0.14：**指向型光束的中段预瞄**（人类 2026-10-17：「激光角度不能太死」）。
       * follow>0 时，预警期内光路的前 len*aimF 段会持续转向玩家（角速度 turn rad/s），
       * 但**远端（len*aimF 之后）保持"发射瞬间"的方向**——即打提前量的位置。
       * 于是站在预警线里不动会被命中，**横向移动/冲刺**就能走出光路：可躲避，但不呆板。 */
      this.aimAt = opt.aimAt || null;          // 预瞄起点（Boss 坐标）；缺省＝x,y
      this.aimF = opt.aimF !== undefined ? opt.aimF : 0.6;
      this.aimTurn = opt.aimTurn !== undefined ? opt.aimTurn : 1.5;   // rad/s
      if (this.kind === 'beam' && this.armed) this.strikeBeam();
    }
    /* 预警期的预瞄（由 update 每帧调用）：只转**近段**，远端不动 =>
     * 近处贴着玩家、远处是提前量 → 光束看起来"会追人"，但仍然躲得开。 */
    aimStep(dt, game) {
      if (!this.aimAt || !game || !game.player || this.armed) return;
      const p = game.player, o = this.aimAt;
      const want = Math.atan2(p.y - o.y, p.x - o.x);
      this.dir = U.aimAngle(this.dir, want, this.aimTurn, dt);
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
      if (U.dist2(p.x, p.y, px, py) < Math.pow(this.w / 2 + p.r, 2)) {
        g.hurtPlayer(this.dmg, 'beam');
        /* 光束打穿：贴靠膜失灵（其它类型的减伤照旧） */
        if (p.shieldTaint) p.shieldTaint();
      }
    }
    detonate(game) {
      if (!this.hitPlayer && U.dist2(game.player.x, game.player.y, this.x, this.y) < Math.pow(this.r + game.player.r, 2)) {
        game.hurtPlayer(this.dmg, this.kind === 'bomb' ? 'bomb' : 'field');
        if (this.kind === 'bomb' && game.player.shieldTaint) game.player.shieldTaint();
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
        this.aimStep(dt, game);                 // v0.14：指向型光束的近段预瞄
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
          if (Math.abs(d - this.cur) < p.r + 9) { this.hitPlayer = true; game.hurtPlayer(this.dmg, 'ring'); }
        }
        if (this.cur >= this.maxR) this.dead = true;
        return;
      }
      /* field：周期伤害（走 hurtPlayer 的无敌帧，站进去会被反复警告） */
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = this.tickRate;
        const p = game.player;
        if (U.dist2(p.x, p.y, this.x, this.y) < Math.pow(this.r, 2)) game.hurtPlayer(this.dmg, 'field');
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
          /* v0.14 预瞄显示：近段（会追人）用实心亮条，远端（提前量）用淡色 —— 玩家一眼
           * 知道「贴着我的这一段在动，远处那段不动」，于是知道往哪边挪能走出光路。 */
          if (this.aimAt) {
            const f = U.clamp(this.aimF, 0.2, 1) * this.len;
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, -this.w * 0.22, f, this.w * 0.44);
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.moveTo(f, -this.w / 2); ctx.lineTo(f, this.w / 2); ctx.stroke();
            ctx.setLineDash([]);
          }
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

  /* ---------- 冲击波（**纯表现**：不结算伤害） ----------
   * v0.15.1：地雷起爆时用它把"真实作用范围"推给玩家看——地雷平时画得很小（vis），
   * 玩家看不出它到底覆盖多大；起爆瞬间两道圆向外推到
   *   ① 触发半径（triggerR，敌人踩进哪一圈就会引爆）
   *   ② 击杀半径（r，真正吃伤害的范围）
   * 于是"看起来小、实际很大"这件事被可视化，而不是靠玩家记忆。
   * 与 KUP.Ring 的区别：Ring 会走判定（damageEnemy），本类**只画不做任何结算**。 */
  class Shockwave {
    constructor(x, y, opt) {
      opt = opt || {};
      this.x = x; this.y = y;
      this.r0 = opt.r0 !== undefined ? opt.r0 : 0;
      this.r1 = opt.r1 !== undefined ? opt.r1 : 60;
      this.dur = opt.dur || 0.28;
      this.t = 0;
      this.color = opt.color || '#7de0c8';
      this.width = opt.width || 3;
      this.fill = !!opt.fill;          // 是否填一层淡色（近距离的"爆开"感）
      this.dash = !!opt.dash;
      this.dead = false;
    }
    update(dt) { this.t += dt; if (this.t >= this.dur) this.dead = true; }
    draw(ctx) {
      const k = Math.min(1, this.t / this.dur);
      const r = this.r0 + (this.r1 - this.r0) * (1 - Math.pow(1 - k, 2));   // 先快后慢
      const a = 1 - k;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.width * (0.5 + a * 0.8);
      ctx.shadowColor = this.color; ctx.shadowBlur = 14;
      if (this.dash) ctx.setLineDash([9, 7]);
      ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r), 0, U.TAU); ctx.stroke();
      ctx.setLineDash([]);
      if (this.fill) {
        ctx.globalAlpha = a * 0.16;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r), 0, U.TAU); ctx.fill();
      }
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
      /* v0.15.1：地雷的**触发半径**与**爆炸半径**分开（缺省相同＝旧行为）。
       * 触发只看 triggerR，伤害只看 r；起爆时用 Shockwave 把两个半径都推一遍。 */
      this.triggerR = opt.triggerR || this.r;
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
      this.vis = opt.vis || 1;               // **显示**缩放（判定/作用范围仍用 this.r）
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
      /* v0.15.1：地雷起爆＝**两道向外推的圆**（纯表现，不结算）：
       *   ① 触发半径：敌人踏进哪一圈就引爆（虚线、快、亮）
       *   ② 击杀半径：真正吃伤害的范围（实线、稍慢、带淡填充）
       * 让"HUD 画得很小、实际范围不小"在起爆瞬间被看见。 */
      if (this.kind === 'mine' && game.fx) {
        game.fx.push(new Shockwave(this.x, this.y, {
          r0: this.triggerR * 0.25, r1: this.triggerR, dur: 0.22, color: '#ffffff', width: 2.4, dash: true,
        }));
        game.fx.push(new Shockwave(this.x, this.y, {
          r0: this.triggerR, r1: this.r, dur: 0.45, color: col, width: 4, fill: true,
        }));
        /* 起爆闪光（一圈很短的亮环，读感上是"啪"） */
        game.fx.push(new Shockwave(this.x, this.y, { r0: 2, r1: this.r * 0.45, dur: 0.16, color: '#ffffff', width: 6, fill: true }));
      }
      for (let i = 0; i < 14; i++) {
        const a = U.rng() * U.TAU;
        game.parts.push(new KUP.Particle(this.x, this.y, Math.cos(a) * U.rand(60, 200), Math.sin(a) * U.rand(60, 200), 0.5, col, 2.6));
      }
      KUP.Audio.sfx('boom');
    }
    update(dt, game) {
      this.age += dt;
      /* 地雷：待机 → 敌人踏进**触发半径**即引爆（伤害按**爆炸半径**结算）→ 消失 */
      if (this.kind === 'mine') {
        for (const e of game.enemies) {
          if (e.dead) continue;
          if (U.dist2(e.x, e.y, this.x, this.y) < Math.pow(this.triggerR + e.r, 2)) {
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
          /* v0.13：滞留区减速走统一的 applySlow（0.4s / ×0.55，取最强来源合并） */
          if (this.slow) e.applySlow(0.4, 0.55);
          if (doTick) game.damageEnemy(e, this.dmg);
        }
      }
      if (this.life && this.age >= this.life) this.dead = true;
    }
    draw(ctx, t) {
      const left = this.life ? Math.max(0, 1 - this.age / this.life) : 1;
      /* 显示半径：地雷等模组可只缩小**画面**（vis < 1），判定半径 r 不变 */
      const vr = this.r * this.vis;
      ctx.save();
      ctx.translate(this.x, this.y);
      /* v0.15.1：地雷——画得**更小**（vis 0.32），并只保留一枚小核心 + 一圈很淡的
       * 触发圈提示（triggerR × vis，虚线、呼吸），真实爆炸范围不常驻显示，
       * 改由起爆瞬间的两道 Shockwave 揭示（见 Zone.detonate）。 */
      if (this.kind === 'mine') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 5);
        const tr = this.triggerR * this.vis;
        ctx.globalAlpha = 0.16 + 0.14 * pulse;
        ctx.strokeStyle = this.color; ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.arc(0, 0, tr, 0, U.TAU); ctx.stroke();
        ctx.setLineDash([]);
        /* 核心：小三角钉（比纯圆更像"埋着的东西"） */
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const s = Math.max(3, 4 * this.vis * 2.2);
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.9, s * 0.7); ctx.lineTo(-s * 0.9, s * 0.7);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, Math.max(1.4, s * 0.34), 0, U.TAU); ctx.fill();
        ctx.restore();
        return;
      }
      if (!this.armed) {                       // 起爆前摇：警示圈收缩
        const k = Math.max(0, this.age / this.arm);
        ctx.strokeStyle = '#ff8a5a';
        ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 12));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, vr, 0, U.TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, vr * (1 - k * 0.8), 0, U.TAU); ctx.stroke();
        ctx.restore();
        return;
      }
      const a = this.oneShot ? 0.75 : 0.16 + 0.2 * left;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(0, 0, vr, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = Math.min(1, a + 0.28);
      ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, vr * (this.kind === 'field' ? (0.9 + 0.08 * Math.sin(t * 4)) : 1), 0, U.TAU); ctx.stroke();
      if (this.kind === 'mine') {              // 地雷本体（随显示缩放）
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 4 * this.vis, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ---------- 投掷物（残留音块：抛物线飞向落点，落地生成滞留区） ---------- */
  class Toss {
    constructor(x, y, tx, ty, opt) {
      opt = opt || {};
      this.x0 = x; this.y0 = y; this.tx = tx; this.ty = ty; this.x = x; this.y = y;
      this.dur = opt.fly || 0.4; this.t = 0;
      this.zone = opt.zone || null;
      this.color = opt.color || '#ffd25a';
      this.target = opt.homing || null;
      this.dead = false;
    }
    update(dt, game) {
      this.t += dt;
      if (this.target && this.target.dead) this.target = null;
      if (this.target && game && game.player) { this.tx = this.target.x; this.ty = this.target.y; }
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
  KUP.Slash = Slash;
  KUP.Beam = Beam;
  KUP.Danger = Danger;
  KUP.Zone = Zone;
  KUP.Shockwave = Shockwave;
  KUP.Toss = Toss;
  KUP.Particle = Particle;
  KUP.FloatText = FloatText;
})();
