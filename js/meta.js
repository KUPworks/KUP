window.KUP = window.KUP || {};

/* ================= 元进度（局与局之间的循环）· v0.7 存档重构 =================
 * ★★ 復興率 —— 協奏中官方正典机制：「リズムゲームをプレイして舞台となる神椿市の復興率を上げることで、ストーリーが開放」。
 * 本作映射：一局结束 → 提升**神椿市復興率** → 达阈值**解锁下一番街**（零番街〜陸番街）。
 *
 * ★ 記憶の卵 —— 动画第6話副标题「記憶の卵 -Piece of memory-」：
 * 拾取记忆卵 → 解锁一条**记忆片段**（观测者的记忆，见 menu 记忆图鉴）＋ 復興率 +1%。
 *
 * ★ 招募 —— 魔女候補（天祢亜留／地邑阿栖，ヰ世界救済教団）按条件加入；皮肤/形態选择亦持久化。
 *
 * 本作设定解读（lore §4.4／§4.13，**非官方文本**）：復興率与记忆跨局保留＝
 * 「現象」＝索菲娅为保护魔女而设的时间回溯机制**回溯不彻底**——見 README「現象与本作的元进度」。
 *
 * ---------- 存储结构（v0.7 起全部经由 KUP.STORE，见 js/store.js） ----------
 *   kup.slots      槽位索引 { active, seq, list:[{id,name,createdAt,playedAt,playtime,runs,wins}] }
 *   kup.save.<id>  每槽进度（本文件注册的 'progress' schema）：
 *     { fukkou, cash, tickets, cleared: {areaId: count}, eggs: [fragId...], eggCount,
 *       chars: [charId...], companions: [id...], shop: {itemId: lv},
 *       form, companion, companionForm,
 *       best: { win, time, kills, level, witch, area, at } | null,
 *       lastRun: { char, area, mod, seed, companion, form, companionForm, at } | null,
 *       lastRunId: string | null,        ← 结算幂等键（同一局只结算一次）
 *       stats: { runs, wins, playtime } }
 *
 * ---------- 与旧版的差异（本次重构要点） ----------
 *  1. **多槽位**：进度按槽位隔离；设置（语言/音量）跨槽共享。切换槽位经 META.switchSlot()。
 *  2. **幂等结算**：addRunResult 用 runId 去重，不再依赖 UI 状态机（game.state）防止重复加復興率。
 *  3. **结构校验 + 迁移**：normalizeProgress 负责钳制/过滤；migrations 负责版本升级。
 *  4. **不静默失败**：save() 立即落盘并返回是否成功；STORE.lastError 供 UI 提示。
 */
(function () {
  const STORE = KUP.STORE;
  const SC = (KUP.CONFIG && KUP.CONFIG.SAVE) || {};
  const THRESHOLDS = SC.THRESHOLDS || [0, 0, 0, 0, 0, 0, 0];
  const FIRST_CLEAR = SC.FIRST_CLEAR != null ? SC.FIRST_CLEAR : 12;
  const REPEAT_CLEAR = SC.REPEAT_CLEAR != null ? SC.REPEAT_CLEAR : 2;
  const RUN_MEASURED = SC.RUN_MEASURED != null ? SC.RUN_MEASURED : 1;
  const EGG_BONUS = SC.EGG_BONUS != null ? SC.EGG_BONUS : 1;
  /* v0.16：**现金**（每局结束发放的局外主货币）
   *   · 发放量 ＝ 原市民票收入的 CASH_INCOME_MUL 倍（沿用同一套来源：净化数／通关／
   *     首通／記憶の卵／番街深度），所以"手感节奏"与旧版一致，只是数值放大；
   *   · 瓦利斯的价格同步 ×CASH_PRICE_MUL（＝同一个倍数），因此升级节奏不变；
   *   · 市民票改由现金**小比例兑换**（CASH_PER_TICKET 枚 → 1 张），
   *     招募价统一 1 张 ⇒ "一张市民票即可招募"。
   * 这三个常数是这次经济改造的**唯一调参处**。 */
  const CASH_INCOME_MUL = 4;
  const CASH_PRICE_MUL = 4;
  const CASH_PER_TICKET = 100;
  const RECRUIT_TICKETS = 1;

  const int = (v, d) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : (d || 0));
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : (d || 0));

  /* ---------- progress schema：结构校验 / 钳制 / 迁移 ----------
   * normalize 是**唯一的**存档形状权威：任何来源（磁盘、导入、迁移、旧档）都经过它。 */
  function normalizeProgress(raw) {
    const d = (raw && typeof raw === 'object') ? raw : {};
    const frags = KUP.FRAGMENTS || [];
    const charsAll = KUP.CHARS || [];
    const compsAll = KUP.COMPANIONS || [];
    const forms = KUP.FORMS || [];
    const shopDefs = KUP.SHOP || [];

    /* 记忆碎片：只保留当前数据表里存在的 id，且不超过总数 */
    const eggs = Array.isArray(d.eggs)
      ? d.eggs.filter(id => frags.some(f => f.id === id)).slice(0, frags.length)
      : [];
    /* 招募名单：只保留合法的可招募角色 / 已知同伴，且去重 */
    const chars = Array.isArray(d.chars)
      ? Array.from(new Set(d.chars.filter(id => charsAll.some(c => c.id === id && c.recruit))))
      : [];
    const companions = Array.isArray(d.companions)
      ? Array.from(new Set(d.companions.filter(id => compsAll.some(c => c.id === id))))
      : [];
    /* v0.13.3 支援物品：已解锁名单（旧存档没有这个字段 ⇒ 空列表，向后兼容） */
    const supAll = KUP.SUPPORTS || [];
    const supports = Array.isArray(d.supports)
      ? Array.from(new Set(d.supports.filter(id => supAll.some(s => s.id === id))))
      : [];
    /* 番街通关次数：只保留已知番街 */
    const cleared = {};
    if (d.cleared && typeof d.cleared === 'object') {
      for (const a of (KUP.AREAS || [])) {
        const n = int(d.cleared[a.id], 0);
        if (n > 0) cleared[a.id] = n;
      }
    }
    /* 局外强化等级：钳制到 [0, maxLv] */
    const shop = {};
    if (d.shop && typeof d.shop === 'object') {
      for (const it of shopDefs) {
        const lv = int(d.shop[it.id], 0);
        if (lv > 0) shop[it.id] = Math.min(it.maxLv, lv);
      }
    }
    /* 最佳记录：数字一律归一化，避免字符串比较出错的旧 flaw */
    let best = null;
    if (d.best && typeof d.best === 'object') {
      const t = num(d.best.time, NaN);
      if (Number.isFinite(t)) {
        best = {
          win: !!d.best.win,
          time: Math.max(0, t),
          kills: Math.max(0, int(d.best.kills, 0)),
          level: Math.max(0, int(d.best.level, 0)),
          witch: typeof d.best.witch === 'string' ? d.best.witch.slice(0, 40) : '',
          area: typeof d.best.area === 'string' ? d.best.area.slice(0, 24) : '',
          at: int(d.best.at, 0),
        };
      }
    }
    /* 上一局配置（用于菜单预选/复现；URL 调试与重开都吃它） */
    let lastRun = null;
    if (d.lastRun && typeof d.lastRun === 'object') {
      lastRun = {
        char: typeof d.lastRun.char === 'string' ? d.lastRun.char : null,
        area: typeof d.lastRun.area === 'string' ? d.lastRun.area : null,
        mod: typeof d.lastRun.mod === 'string' ? d.lastRun.mod : null,
        seed: int(d.lastRun.seed, 0),
        companion: typeof d.lastRun.companion === 'string' ? d.lastRun.companion : null,
        form: typeof d.lastRun.form === 'string' ? d.lastRun.form : 'none',
        companionForm: typeof d.lastRun.companionForm === 'string' ? d.lastRun.companionForm : 'none',
        at: int(d.lastRun.at, 0),
      };
    }
    const statsIn = (d.stats && typeof d.stats === 'object') ? d.stats : {};
    /* v0.13 治安战最高记录（**独立**于番街 best：最高成绩只记治安战自己的） */
    let orderBest = null;
    if (d.orderBest && typeof d.orderBest === 'object') {
      const sc = int(d.orderBest.score, 0);
      if (sc > 0) {
        orderBest = {
          score: sc,
          kills: Math.max(0, int(d.orderBest.kills, 0)),
          time: Math.max(0, num(d.orderBest.time, 0)),
          wave: Math.max(1, int(d.orderBest.wave, 1)),
          at: int(d.orderBest.at, 0),
        };
      }
    }
    return {
      fukkou: Math.max(0, num(d.fukkou, 0)),
      tickets: Math.max(0, int(d.tickets, 0)),
      /* v0.16：**现金**（局外主货币，每局结束发放）——瓦利斯用它结算，
       * 市民票由它按小比例兑换（见 META.exchangeCash）。旧存档没有这个字段 ⇒ 0。 */
      cash: Math.max(0, int(d.cash, 0)),
      cleared: cleared,
      eggs: eggs,
      /* eggCount 是「累计拾取数」（可超过碎片总数），不得小于已解锁碎片数 */
      eggCount: Math.max(eggs.length, int(d.eggCount, eggs.length)),
      chars: chars,
      companions: companions,
      supports: supports,
      shop: shop,
      form: forms.some(f => f.id === d.form) ? d.form : 'none',
      companion: compsAll.some(c => c.id === d.companion) ? d.companion : null,
      companionForm: forms.some(f => f.id === d.companionForm) ? d.companionForm : 'none',
      /* 支援物品的当前选择：必须是已知且**已解锁**的（未解锁视为没带） */
      support: (supAll.some(s => s.id === d.support) && supports.indexOf(d.support) >= 0) ? d.support : null,
      best: best,
      lastRun: lastRun,
      lastRunId: typeof d.lastRunId === 'string' ? d.lastRunId : null,
      orderBest: orderBest,
      lastOrderRunId: typeof d.lastOrderRunId === 'string' ? d.lastOrderRunId : null,
      stats: {
        runs: Math.max(0, int(statsIn.runs, 0)),
        wins: Math.max(0, int(statsIn.wins, 0)),
        playtime: Math.max(0, num(statsIn.playtime, 0)),
      },
    };
  }

  STORE.defineSchema('progress', {
    v: (SC.SCHEMA != null ? SC.SCHEMA : 1),
    normalize: normalizeProgress,
    migrations: {
      /* v0 = 旧版散装 kup_meta 结构（无 best/stats/lastRun）；补齐信封字段，
       * 其余交给 normalize 过滤钳制。旧 kup_best 由 STORE.upgradeLegacy 塞进 d.best。 */
      0(d) {
        const src = (d && typeof d === 'object') ? d : {};
        return Object.assign({}, src, {
          best: src.best || null,
          lastRun: src.lastRun || null,
          lastRunId: null,
          stats: src.stats || { runs: 0, wins: 0, playtime: 0 },
        });
      },
    },
  });

  const META = {
    THRESHOLDS: THRESHOLDS,
    data: null,
    _slot: null,

    /* ---------- 槽位 ---------- */
    slotId() {
      if (!this._slot) this._slot = STORE.slots.activeId();
      return this._slot;
    },
    _key() { return STORE.slots.saveKey(this.slotId()); },

    /** 槽位生命周期（切换会重载内存态，避免把 A 槽进度写到 B 槽） */
    slots: {
      list() { return STORE.slots.list(); },
      entry(id) { return STORE.slots.entry(id); },
      active() { return STORE.slots.active(); },
      activeId() { return STORE.slots.activeId(); },
      summary(id) { return STORE.slots.summary(id); },
      canCreate() { return STORE.slots.list().length < ((SC.MAX_SLOTS) || 8); },
      create(name) { return STORE.slots.create(name); },
      rename(id, name) { return STORE.slots.rename(id, name); },
      duplicate(id) { return STORE.slots.duplicate(id); },
      /** 删除槽位；返回 { ok, active, switched }（见 STORE.slots.remove） */
      remove(id) {
        const wasActive = id === META.slotId();
        const r = STORE.slots.remove(id);
        if (wasActive && r.ok) { META._slot = null; META.load(true); }
        return r;
      },
      /** 切换到某槽并重载内存态；返回是否成功 */
      switchTo(id) {
        if (!STORE.slots.setActive(id, { now: true })) return false;
        META._slot = id;
        META.load(true);
        return true;
      },
    },

    /* ---------- 读写 ---------- */
    ensure() { if (!this.data) this.load(); return this.data; },
    load(force) {
      this._slot = STORE.slots.activeId();
      const cached = STORE.read('progress', this._key(), force ? { force: true } : undefined);
      this.data = cached;
      return this.data;
    },
    /** 关键进度：立即落盘；返回是否写入成功（失败原因见 STORE.lastError / META.health()） */
    save() { return STORE.write('progress', this._key(), this.data, { now: true }); },
    /** 非关键进度（皮肤/同伴等外观选择）：合并写入，减少同步开销；返回是否已入队 */
    saveSoon() { return STORE.write('progress', this._key(), this.data); },
    /** 把当前槽重置为全新档（保留槽位本身） */
    reset() {
      STORE.write('progress', this._key(), null, { now: true });
      this.load(true);
      return this.data;
    },
    /** 删除全部存档（所有槽位），随后自动重建一个空槽 */
    wipe() {
      STORE.wipeAll();
      this._slot = null;
      this.load(true);
      return this.data;
    },
    exportSlot(id) { return STORE.exportSlot(id || this.slotId()); },
    importSlot(text) { return STORE.importSlot(text); },
    health() { return STORE.health(); },
    flush() { return STORE.flush(); },

    /* ---------- 復興率 ---------- */
    total() { return Math.max(0, Math.min(100, Math.round(this.ensure().fukkou))); },
    areaIndex(id) { const i = KUP.AREAS.findIndex(a => a.id === id); return i < 0 ? 0 : i; },
    /* v0.13 治安战（endless）不属于復興率解锁链：恒可出击、阈值恒 0 */
    isUnlocked(id) {
      const a = KUP.AREAS.find(x => x.id === id);
      if (a && a.endless) return true;
      return this.total() >= this.THRESHOLDS[this.areaIndex(id)];
    },
    thresholdOf(id) {
      const a = KUP.AREAS.find(x => x.id === id);
      if (a && a.endless) return 0;
      return this.THRESHOLDS[this.areaIndex(id)];
    },
    clearedCount(id) { return this.ensure().cleared[id] || 0; },

    /* ---------- 局外货币 ----------
     * v0.16（人类 2026-10-19）：**每局结束发放「现金」（主货币）**，
     *   · 瓦利斯（局外强化／支援／其它局外消费）一律用**现金**结算；
     *   · 市民票改为**由现金小比例兑换**得到（`exchangeCash`），不再直接发放；
     *   · 招募价统一 `RECRUIT_TICKETS`（＝1 张市民票）。
     * 每局收入仍是同一套来源（净化数／通关／首通／記憶の卵／番街深度），乘 CASH_INCOME_MUL。 */
    cash() { return this.ensure().cash; },
    cashIncome(r) {
      r = r || {};
      const kills = Math.floor((r.kills || 0) / 10);
      const win = r.win ? 15 : 3;
      const first = (r.win && r.firstClear) ? 10 : 0;
      const eggs = (r.eggs || 0) * 5;
      const depth = (r.areaIdx || 0) * 2;
      return (kills + win + first + eggs + depth) * CASH_INCOME_MUL;
    },
    addCash(n) {
      const d = this.ensure();
      d.cash = Math.max(0, d.cash + Math.floor(n));
      this.save();
      return d.cash;
    },
    /* 扣款（不足则原样返回 false，不动存档） */
    spendCash(n) {
      const d = this.ensure(), cost = Math.max(0, Math.floor(n));
      if (d.cash < cost) return false;
      d.cash -= cost;
      return true;
    },
    /* 现金 → 市民票（小比例兑换）：默认换 1 张，返回实际换到的张数 */
    cashPerTicket() { return CASH_PER_TICKET; },
    exchangeCash(count) {
      const d = this.ensure();
      const want = Math.max(1, Math.floor(count || 1));
      const afford = Math.floor(d.cash / CASH_PER_TICKET);
      const got = Math.min(want, afford);
      if (got <= 0) return 0;
      d.cash -= got * CASH_PER_TICKET;
      d.tickets += got;
      this.save();
      return got;
    },

    /* ---------- 局外货币：市民票（REGENERATE 术语） ----------
     * ⚠ v0.16 起**不再由每局结算直接发放**（收入改成现金），只作为「招募凭证」：
     * 由现金兑换而来，1 张即可招募一名魔女候補。`ticketIncome` 保留为**旧接口**
     * （外部脚本/测试可能仍在调用），返回等值的现金而不是市民票。 */
    tickets() { return this.ensure().tickets; },
    ticketIncome(r) { return this.cashIncome(r); },
    addTickets(n) {
      const d = this.ensure();
      d.tickets = Math.max(0, d.tickets + Math.floor(n));
      this.save();
      return d.tickets;
    },

    /* ---------- 瓦利斯：局外强化（小幅永久强化）——v0.16 起用**现金**结算 ---------- */
    shopLv(id) { return this.ensure().shop[id] || 0; },
    shopMax(id) { const it = KUP.SHOP_ITEM(id); return it ? this.shopLv(id) >= it.maxLv : true; },
    shopNextCost(id) {
      const it = KUP.SHOP_ITEM(id); if (!it) return Infinity;
      const lv = this.shopLv(id); if (lv >= it.maxLv) return Infinity;
      return KUP.shopCost(it, lv);
    },
    /* 购买一级（付 **现金**）；成功返回 true */
    buyShop(id) {
      const it = KUP.SHOP_ITEM(id), d = this.ensure();
      if (!it) return false;
      const lv = this.shopLv(id);
      if (lv >= it.maxLv) return false;
      const cost = KUP.shopCost(it, lv);
      if (!this.spendCash(cost)) return false;
      d.shop[id] = lv + 1;
      this.save();
      return true;
    },
    /* 汇总為乘数（供 Player.recompute / game.start 使用） */
    shopMods() {
      const d = this.ensure(), out = {};
      for (const it of KUP.SHOP) {
        const lv = d.shop[it.id] || 0;
        if (lv <= 0) continue;
        for (const k in it.mods) {
          const v = it.mods[k];
          if (k === 'startUlt' || k === 'startLevel') out[k] = (out[k] || 0) + v * lv;   // 加法型
          else out[k] = (out[k] === undefined ? 1 : out[k]) * Math.pow(v, lv);            // 乘法型
        }
      }
      return out;
    },

    /* ---------- 招募：可操作角色（魔女候補）与同伴（復興課課員 等） ---------- */
    isCharUnlocked(id) {
      const c = KUP.CHARS.find(x => x.id === id);
      if (!c) return false;
      if (!c.recruit) return true;
      return this.ensure().chars.indexOf(id) >= 0;
    },
    isCompanionUnlocked(id) { return this.ensure().companions.indexOf(id) >= 0; },
    isRecruitUnlocked(id) { return this.isCharUnlocked(id) || this.isCompanionUnlocked(id); },
    /* ---------- 支援物品（v0.13.3）----------
     * 「局外解锁 ＋ 出击时选一件」：解锁＝在瓦利斯花**现金**（v0.16 起；无门槛，随时可买）；
     * 未解锁的支援物在出击界面显示为锁定，不能携带。 */
    isSupportUnlocked(id) { return this.ensure().supports.indexOf(id) >= 0; },
    paySupport(id) {
      const d = this.ensure();
      const ent = KUP.SUPPORT(id);
      if (!ent) return false;
      if (d.supports.indexOf(id) >= 0) return false;             // 已解锁
      const cost = (ent.unlock && ent.unlock.cost) || 0;
      if (!this.spendCash(cost)) return false;                   // 现金不足
      d.supports.push(id);
      this.save();
      return true;
    },
    /* ---------- 武装解锁（v0.11）----------
     * 「招募对应角色前，角色武器不会出现在卡池」：
     *   - 无 owner 的武器（滞留・投掷系等通用组）恒解锁；
     *   - 有 owner 的武器＝其持有角色已可选用（魔女之子恒解锁，魔女候補需招募）。
     * META 不存在（极端环境）时按解锁处理，保证池子不至于空。 */
    isWeaponUnlocked(id) {
      const w = KUP.WEAPONS[id];
      if (!w || !w.owner) return true;
      return this.isCharUnlocked(w.owner);
    },
    gateMet(unlock) {
      if (!unlock) return true;
      if (unlock.area && this.clearedCount(unlock.area) > 0) return true;
      if (unlock.fukkou && this.total() >= unlock.fukkou) return true;
      return false;
    },
    /* 招募（v0.16）：**条件门槛 ＋ 1 张市民票**（市民票由现金兑换而来）。
     * `unlock.cost` 仍然读，但会与 RECRUIT_TICKETS 取较小值——数据表里残留的旧价
     * （30/45/40）不会再把招募价抬高；想改价只改 RECRUIT_TICKETS。 */
    payRecruit(id) {
      const d = this.ensure();
      const c = KUP.CHARS.find(x => x.id === id && x.recruit);
      const comp = KUP.COMPANIONS.find(x => x.id === id);
      const ent = c || comp;
      if (!ent) return false;
      const list = c ? d.chars : d.companions;
      if (list.indexOf(id) >= 0) return false;          // 已加入
      if (!this.gateMet(ent.unlock)) return false;       // 条件未达成
      const listed = (ent.unlock && ent.unlock.cost) || RECRUIT_TICKETS;
      const cost = Math.max(1, Math.min(RECRUIT_TICKETS, listed));
      if (d.tickets < cost) return false;                // 市民票不足
      d.tickets -= cost;
      list.push(id);
      this.save();
      return true;
    },
    /* 检查并解锁满足条件的招募角色/同伴，返回 { chars:[], companions:[] }
     * ⚠️ v0.6 起：**仅条件达成不再自动加入**——需在「瓦利斯」支付市民票招募（见 payRecruit）。 */
    checkRecruits() {
      const d = this.ensure(), added = { chars: [], companions: [] };
      const meets = (u) => (u && ((u.area && this.clearedCount(u.area) > 0) || (u.fukkou && this.total() >= u.fukkou)));
      for (const c of KUP.CHARS) {
        if (!c.recruit || d.chars.indexOf(c.id) >= 0) continue;
        if (meets(c.unlock)) added.chars.push(c);
      }
      for (const c of KUP.companionsActive()) {
        if (d.companions.indexOf(c.id) >= 0) continue;
        if (meets(c.unlock)) added.companions.push(c);
      }
      return added;
    },
    recruitable() {
      const d = this.ensure(), out = { chars: [], companions: [] };
      for (const c of KUP.CHARS) if (c.recruit && d.chars.indexOf(c.id) < 0) out.chars.push(c);
      for (const c of KUP.companionsActive()) if (d.companions.indexOf(c.id) < 0) out.companions.push(c);
      return out;
    },

    /* ---------- 一局开始：记录本局配置（用于菜单预选与复现） ---------- */
    setLastRun(cfg) {
      const d = this.ensure();
      d.lastRun = {
        char: cfg.char || null, area: cfg.area || null, mod: cfg.mod || null,
        seed: int(cfg.seed, 0), companion: cfg.companion || null,
        form: cfg.form || 'none', companionForm: cfg.companionForm || 'none',
        at: Date.now(),
      };
      this.save();
      return d.lastRun;
    },
    lastRun() { return this.ensure().lastRun; },

    /* ---------- 一局结束：復興率结算 + 市民票收入 ----------
     * **幂等**：run.runId 与存档里的 lastRunId 相同则直接返回 null（同一局不重复结算）。
     * 这比「靠 game.state 挡住二次调用」可靠——任何重入/重复事件都不会刷復興率。
     * run = { runId, kills, eggs, areaIdx, time }
     * 返回 { gain, total, tickets, ticketsTotal, newlyUnlocked, newlyRecruitable } 或 null。 */
    addRunResult(areaId, win, run) {
      run = run || {};
      const d = this.ensure();
      if (run.runId) {
        if (d.lastRunId === run.runId) {
          console.info('[KUP] 本局（' + run.runId + '）已结算，忽略重复结算。');
          return null;
        }
        d.lastRunId = run.runId;
      }
      const before = this.total();
      const firstClear = !!win && !d.cleared[areaId];
      let gain = RUN_MEASURED;
      if (win) {
        gain += firstClear ? FIRST_CLEAR : REPEAT_CLEAR;
        d.cleared[areaId] = (d.cleared[areaId] || 0) + 1;
      }
      d.fukkou = before + gain;
      /* v0.16：每局结束发放**现金**（局外主货币）；市民票不再直接发——由玩家在瓦利斯
       * 用现金按小比例兑换（META.exchangeCash）。 */
      const cash = this.cashIncome({
        kills: run.kills, eggs: run.eggs, areaIdx: run.areaIdx, win: win, firstClear: firstClear,
      });
      d.cash += cash;
      /* 兼容返回字段：老 UI/脚本读 tickets 时给它**等值的现金**，但余额本身不再增加。
       * 新字段 cash/cashTotal 才是真值。 */
      const tickets = 0;
      d.stats.runs += 1;
      if (win) d.stats.wins += 1;
      if (Number.isFinite(run.time) && run.time > 0) d.stats.playtime += run.time;
      this.save();                                        // 关键进度：立即落盘
      /* 槽位索引里的统计（列表展示用） */
      STORE.slots.touch(this.slotId(), { run: true, win: !!win, playtime: Math.round(run.time || 0) });
      const after = this.total();
      const newlyUnlocked = KUP.AREAS
        .filter(a => before < this.thresholdOf(a.id) && after >= this.thresholdOf(a.id))
        .map(a => (KUP.I18N ? KUP.I18N.tv(a.name) : a.name.zh));
      const got = this.checkRecruits();
      const newlyRecruitable = got.chars.concat(got.companions).map(c => KUP.nameOf(c));
      return {
        gain, total: after,
        cash, cashTotal: d.cash,
        tickets, ticketsTotal: d.tickets,
        newlyUnlocked, newlyRecruitable,
      };
    },

    /* ---------- v0.13 治安战（无尽关卡）的独立成绩 ----------
     * 规则：**没有败北**——只有「战斗结束」；成绩记入 `orderBest`（与番街 best 完全分离），
     *       不发復興率、不写通关次数、不落記憶の卵；市民票按净化数照常结算。 */
    orderScore(r) {
      r = r || {};
      return Math.max(0, Math.round((r.kills || 0) * 10 + (r.time || 0) * 2 + (r.wave || 1) * 100));
    },
    orderBest() { return this.ensure().orderBest; },
    /* 结算一场治安战：run = { runId, kills, time, wave, score }
     * 幂等（runId）；返回 { order, score, best, isBest, wave, tickets, ticketsTotal, total } 或 null */
    addOrderResult(run) {
      run = run || {};
      const d = this.ensure();
      if (run.runId) {
        if (d.lastOrderRunId === run.runId) {
          console.info('[KUP] 本场治安战（' + run.runId + '）已结算，忽略重复结算。');
          return null;
        }
        d.lastOrderRunId = run.runId;
      }
      const score = Number.isFinite(run.score) ? Math.max(0, Math.round(run.score)) : this.orderScore(run);
      const wave = Math.max(1, int(run.wave, 1));
      const time = Math.max(0, num(run.time, 0));
      const kills = Math.max(0, int(run.kills, 0));
      const prev = d.orderBest;
      const isBest = !prev || score > prev.score || (score === prev.score && time > prev.time);
      if (isBest) d.orderBest = { score, kills, time, wave, at: Date.now() };
      /* v0.16：现金（治安战同样发；市民票不再直接发，改由现金兑换） */
      const cash = this.cashIncome({ kills, eggs: 0, areaIdx: 0, win: false, firstClear: false });
      d.cash += cash;
      d.stats.runs += 1;
      if (time > 0) d.stats.playtime += time;
      this.save();
      STORE.slots.touch(this.slotId(), { run: true, win: false, playtime: Math.round(time) });
      return {
        order: true, score, best: d.orderBest.score, isBest, wave,
        cash, cashTotal: d.cash,
        tickets: 0, ticketsTotal: d.tickets,
        total: this.total(),
      };
    },

    /* ---------- 最佳记录（原 kup_best，现随槽位走） ----------
     * v0.15.2（人类 2026-10-18「最佳成绩只显示治安战」）：主菜单**不再显示番街战绩的最佳记录**，
     * 改为只显示治安战的最高记录（走 addOrderResult / orderBest）。番街记录因此**停止写入**，
     * 但 `progress.best` 字段、读取接口与结构归一化都保留（旧档数据不删除）；
     * 想恢复"番街最佳记录"时，重新在 showEnd 里调用 submitBest 并在 showBest 里渲染这一行即可。 */
    best() { return this.ensure().best; },
    /* 提交一局番街成绩；刷新记录返回 true。数字全部归一化后再比较。
     * ⚠ 目前**没有调用方**（见上方说明），保留给"以后重新启用番街最佳记录"用。 */
    submitBest(rec) {
      const d = this.ensure();
      const next = {
        win: !!(rec && rec.win),
        time: Math.max(0, num(rec && rec.time, 0)),
        kills: Math.max(0, int(rec && rec.kills, 0)),
        level: Math.max(0, int(rec && rec.level, 0)),
        witch: ((rec && rec.witch) || '').toString().slice(0, 40),
        area: ((rec && rec.area) || '').toString().slice(0, 24),
        at: Date.now(),
      };
      const cur = d.best;
      const better = !cur
        || (next.win && !cur.win)
        || (next.win === cur.win && (next.time > cur.time || (next.time === cur.time && next.kills > cur.kills)));
      if (!better) return false;
      d.best = next;
      this.save();
      return true;
    },

    /* ---------- 記憶の卵拣取 → 解锁下一条记忆片段 ＋ 復興率 +1% ---------- */
    addEgg() {
      const d = this.ensure();
      d.eggCount += 1;
      d.fukkou += EGG_BONUS;
      let frag = null;
      if (d.eggs.length < KUP.FRAGMENTS.length) {
        frag = KUP.FRAGMENTS[d.eggs.length];
        d.eggs.push(frag.id);
      }
      this.save();
      return frag;
    },

    /* ---------- 皮肤/形態选择（外观，非关键 → 合并写） ---------- */
    setForm(id) { if (KUP.FORMS.some(f => f.id === id)) { this.ensure().form = id; this.saveSoon(); } },
    setCompanion(id) {
      const d = this.ensure();
      /* retired 的同伴（如 v0.13.3 起暂不登场的彩季詩得）不可被选 */
      d.companion = (id && KUP.companionsActive().some(c => c.id === id) && this.isCompanionUnlocked(id)) ? id : null;
      this.saveSoon();
    },
    setCompanionForm(id) { if (KUP.FORMS.some(f => f.id === id)) { this.ensure().companionForm = id; this.saveSoon(); } },
    /* 支援物品选择（v0.13.3）：必须已解锁，否则视为不带 */
    setSupport(id) {
      const d = this.ensure();
      d.support = (id && this.isSupportUnlocked(id)) ? id : null;
      this.saveSoon();
    },

    /* ---------- 多标签页：外部改动 → 重载内存态 ---------- */
    watchExternal() {
      const self = this;
      STORE.watch('*', key => {
        if (key !== STORE.slots.saveKey(self.slotId()) && key !== STORE.K_SLOTS) return;
        self.data = null;
        self.load(true);
        console.info('[KUP] 检测到其它标签页写入存档，已重新载入当前槽。');
        if (KUP.UI && KUP.UI.onSaveReload) KUP.UI.onSaveReload();
      });
    },
  };

  KUP.META = META;
  /* 旧键升级必须排在 'progress' schema 注册之后（见 store.upgradeLegacy 注释） */
  STORE.upgradeLegacy();
  META.load(true);
  META.watchExternal();
})();
