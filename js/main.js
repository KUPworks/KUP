window.KUP = window.KUP || {};

/* ================= 启动入口 ================= */
(function () {
  const canvas = document.getElementById('game');
  const game = new KUP.Game(canvas);
  KUP.game = game; // 调试句柄
  KUP.Input = { keys: {}, mx: 0, my: 0, mdown: false };

  /* URL 调试参数：?t=235&lv=12&god=1&char=kaf&skip=1&xp=10&mv=1&lang=ja&hurt=0.5&pick=heart&gem=heal&ult=1&reset=1
    * run 配置：?seed=&area=area0..area6&mod=&companion=&form=&cform=
    *   companion: ciel（同伴，需已招募）／form: ouranchou|himerenjaku（魔女之子皮肤）
    *   或 kuro|shiro（可招募角色·魔女候補皮肤）／cform: kuro|shiro（同伴皮肤）
    *   （同 seed+area+mod+companion+form 可复现同一局；URL 指定 seed 时锁定，不随机化）
    *
    * v0.7 存档相关调试参数：
    *   ?slot=s2   切到指定槽位后再执行其余调试（把调试写在一份独立档上）
    *   ?reset=1   重置**当前槽**进度（不再影响其它槽位）
    *   ?wipe=1    删除**全部**槽位存档（只剩一个空槽）
    *   ⚠️ ?tickets= / ?recruit=1 只改**内存**、不落盘：随便开一局正常游玩才会持久化，
    *      因此可以直接用来验证商店/招募而不会污染存档。 */
  try {
    const q = new URLSearchParams(location.search);
    /* 槽位：先切档，后续调试（reset/tickets/recruit）都作用在这一档上 */
    const dbgSlot = q.get('slot');
    if (dbgSlot && KUP.META && KUP.META.slots.list().some(s => s.id === dbgSlot)) {
      KUP.META.slots.switchTo(dbgSlot);
      console.info('[KUP] 调试：已切换到槽位 ' + dbgSlot);
    }
    game.debug.t = parseFloat(q.get('t')) || 0;
    game.debug.lv = parseInt(q.get('lv'), 10) || 0;
    game.debug.god = q.get('god') === '1';
    game.debug.char = q.get('char');
    game.debug.xp = parseFloat(q.get('xp')) || 0;
    game.debug.mv = q.get('mv') === '1';
    game.debug.dmg = parseFloat(q.get('dmg')) || 0;
    game.debug.lang = q.get('lang');
    game.debug.hurt = parseFloat(q.get('hurt')) || 0; // 初始损失 HP 比例
    game.debug.pick = q.get('pick');                  // 强制升级选项（逗号分隔）
    game.debug.egg = q.get('egg') === '1';            // v0.17 调试：下一次升级必出記憶の卵（現象卡）
    game.debug.revive = q.get('revive') === '1';      // v0.17 调试：开局带 1 次復活充能（验证復活手感）
    game.debug.space = q.get('space');                // v0.18 调试：?space=<id> 指定 / ?space=1 随机 / ?space=off 关闭
    /* v0.20.4 调试：强制本局 Boss（如 ?boss=boss7 直接看射弹 Boss〈弹片〉）；
     * 缺省不填＝按番街表走，主线七区不受影响。 */
    game.debug.boss = q.get('boss');
    /* v0.14：?auto=first|last 自动采升级卡（验证被动/护盾 HUD 等需要频繁升级的效果） */
    const autoQ = q.get('auto');
    if (autoQ === 'first') game.debug.autoPick = 0;
    else if (autoQ === 'last') game.debug.autoPick = 3;
    game.debug.gem = q.get('gem');                    // 周期生成片段类型
    game.debug.ult = q.get('ult') === '1';            // 开局即充满浄化の歌（验证大招）
    game.debug.recruit = q.get('recruit') === '1';    // 调试：临时解锁全部招募（角色/同伴）
    game.debug.w = q.get('w');                        // 调试：追加初始武器（逗号分隔，如 toss,bomb,mine）
    /* 升级池体验（v0.10）：?reroll=N 指定本局重掷次数（默认 3） */
    const rr = parseInt(q.get('reroll'), 10);
    if (!isNaN(rr)) game.debug.reroll = Math.max(0, rr);
    /* 建筑实体（v0.11）：?solid=0 关闭楼体碰撞（对比「有无实体」的效果）；=1 强制开启 */
    if (q.get('solid') === '0') game.debug.solid = false;
    else if (q.get('solid') === '1') game.debug.solid = true;
    /* 瞄准模式：?aim=auto|mouse|move（默认 auto＝自动瞄准最近的怪异） */
    const aimQ = q.get('aim');
    if (aimQ === 'auto' || aimQ === 'mouse' || aimQ === 'move') game.run.aim = aimQ;
    const seed = parseInt(q.get('seed'), 10);
    if (!isNaN(seed)) { game.run.seed = seed; game.debug.seedLocked = true; } // URL seed → 锁定
    if (q.get('area')) game.run.area = q.get('area');
    if (q.get('mod')) game.run.mod = q.get('mod');
    if (q.get('companion')) game.run.companion = q.get('companion');  // 同伴（需已招募）
    if (q.get('form')) game.run.form = q.get('form');                 // 皮肤（形態）
    if (q.get('cform')) game.run.companionForm = q.get('cform');      // 同伴皮肤
    game.applyRun(true);                             // 让菜单预览也用上 URL 指定的番街/种子
    if (q.get('wipe') === '1' && KUP.META) KUP.META.wipe();   // 删除全部存档（危险，供清档测试）
    if (q.get('reset') === '1' && KUP.META) KUP.META.reset(); // 重置当前槽进度
    const dbgTickets = parseInt(q.get('tickets'), 10); // 调试：临时发放市民票（仅内存）
    if (!isNaN(dbgTickets) && KUP.META) {
      KUP.META.ensure().tickets = Math.max(0, dbgTickets);
      console.info('[KUP] 调试：市民票 → ' + dbgTickets + '（仅内存，未写入存档）');
    }
    const dbgCash = parseInt(q.get('cash'), 10);       // 调试：临时发放现金（v0.16，仅内存）
    if (!isNaN(dbgCash) && KUP.META) {
      KUP.META.ensure().cash = Math.max(0, dbgCash);
      console.info('[KUP] 调试：现金 → ' + dbgCash + ' 元（仅内存，未写入存档）');
    }
    if (game.debug.recruit && KUP.META) {            // 调试：临时解锁全部招募（仅内存）
      KUP.CHARS.filter(c => c.recruit).forEach(c => { if (!KUP.META.isCharUnlocked(c.id)) KUP.META.data.chars.push(c.id); });
      KUP.COMPANIONS.forEach(c => { if (!KUP.META.isCompanionUnlocked(c.id)) KUP.META.data.companions.push(c.id); });
      /* v0.13.3：支援物品也一并解锁（方便实机验证「出击时选一件」） */
      if (KUP.SUPPORTS && KUP.META.data.supports) {
        KUP.SUPPORTS.forEach(s => { if (!KUP.META.isSupportUnlocked(s.id)) KUP.META.data.supports.push(s.id); });
      }
      console.info('[KUP] 调试：已临时解锁全部招募（含支援物品；仅内存，未写入存档）');
    }
    if (q.get('skip') === '1') {
      game.debug.char = game.debug.char || 'kaf';
      game.debug.autoStart = true;
    }
  } catch (e) { console.warn('[KUP] URL 参数解析失败', e); }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    game.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    game.view = { w: w, h: h };
  }
  window.addEventListener('resize', resize);
  resize();

  /* 键盘：功能键（Esc/M/Space/Shift/1/2/3）不进入移动键位表，避免粘键 */
  window.addEventListener('keydown', ev => {
    const k = (ev.key || '').toLowerCase();
    if (k === 'escape') {
      if (game.state === 'playing') KUP.UI.pause();
      else if (game.state === 'paused') KUP.UI.resume();
      return;
    }
    if (k === 'm') { KUP.UI.toggleMute(); return; }
    if (k === ' ') { game.castUltimate(); return; } // 浄化の歌（大招，不参与移动）
    if (k === 'shift') { if (!ev.repeat) game.tryDash(); return; } // 冲刺（主动回避，不参与移动）
    if (k === 'v') { if (!ev.repeat) game.cycleAim(); return; }    // 瞄准模式：自动/鼠标/移动
    /* 升级屏（v0.10）：R 重掷 / B 切换封禁模式（之后按 1–4 封禁该卡） */
    if (game.state === 'levelup') {
      if (k === 'r') { if (!ev.repeat) game.rerollChoices(); return; }
      if (k === 'b') { if (!ev.repeat) KUP.UI.toggleBanMode(); return; }
      if (k === '1' || k === '2' || k === '3' || k === '4') {
        const idx = parseInt(k, 10) - 1;
        if (game.banMode) game.banChoice(idx); else game.choose(idx);
        return;
      }
    }
    KUP.Input.keys[k] = true;
    if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') {
      ev.preventDefault();
    }
  });
  window.addEventListener('keyup', ev => {
    const k = (ev.key || '').toLowerCase();
    if (k === 'm' || k === 'escape' || k === ' ' || k === 'shift' || k === 'v' || k === 'r' || k === 'b') return; // 功能键不参与移动
    KUP.Input.keys[k] = false;
  });

  /* 指针 / 触摸 */
  window.addEventListener('mousemove', ev => { KUP.Input.mx = ev.clientX; KUP.Input.my = ev.clientY; });
  window.addEventListener('mousedown', () => { KUP.Input.mdown = true; KUP.Audio.init(); KUP.Audio.resume(); });
  window.addEventListener('mouseup', () => { KUP.Input.mdown = false; });
  window.addEventListener('touchstart', ev => {
    KUP.Input.mdown = true;
    KUP.Input.mx = ev.touches[0].clientX; KUP.Input.my = ev.touches[0].clientY;
    KUP.Audio.init(); KUP.Audio.resume();
  }, { passive: true });
  window.addEventListener('touchmove', ev => {
    KUP.Input.mx = ev.touches[0].clientX; KUP.Input.my = ev.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', () => { KUP.Input.mdown = false; }, { passive: true });

  /* UI 初始化 */
  KUP.UI.init(game);
  KUP.I18N.init(game.debug.lang); // ?lang=zh/en/ja，或读 localStorage

  /* 调试：?ult=1 开局即充满浄化の歌（验证大招） */
  if (game.debug.ult) {
    const origStart = game.start.bind(game);
    game.start = opts => { origStart(opts); game.ult.charge = 100; };
  }

  /* 主循环 */
  let last = performance.now();
  /* v0.13.6 性能：**菜单/选择屏不再跟着 60fps 重绘**。
   * canvas 每帧重绘会让浏览器把「静止的 DOM 覆盖层 + 变化的背景」整体重新合成，
   * 而 `.screen` 上原本还有全屏 `backdrop-filter: blur()`（已移除），等于每帧全屏重模糊
   * ⇒ 菜单里操作也卡。这里把非游玩状态的渲染降到 ~20fps（背景只是缓慢平移，肉眼无差）。 */
  let menuAcc = 0;
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const playing = game.state === 'playing';
    if (playing) {
      if (game.debug.mv) KUP.Input.keys['w'] = true; // 调试自动行走
      game.update(dt);
      game.render(now / 1000);
    } else {
      /* 调试：?auto=first|last 自动采升级卡（验证被动/护盾/大招 HUD 的便捷入口）
       * —— 升级会让状态变成 'levelup'，所以这一段必须放在 else 分支里；
       * 只在调试参数存在时生效，正常游玩永远走玩家的键盘/触屏选择。 */
      if (game.debug.autoPick !== undefined && game.state === 'levelup' && game.choices && game.choices.length) {
        game.choose(Math.min(game.debug.autoPick | 0, game.choices.length - 1));
      }
      if (game.state === 'menu' || game.state === 'select') {
        // 菜单/番街选择背景缓慢平移
        game.cam.x += 16 * dt;
        if (game.cam.x > KUP.CONFIG.ARENA - game.view.w) game.cam.x = 0;
        game.cam.y = (KUP.CONFIG.ARENA - game.view.h) / 2;
      }
      menuAcc += dt;
      if (menuAcc >= 1 / 20) { menuAcc = 0; game.render(now / 1000); }
    }
    if (game.state !== 'menu' && game.state !== 'select' && game.state !== 'area' && game.state !== 'memory') {
      KUP.UI.updateHUD(game);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* 调试自动开始 */
  if (game.debug.autoStart) game.start({ char: game.debug.char });
})();
