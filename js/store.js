window.KUP = window.KUP || {};

/* ================= KUP.STORE —— 统一存档层（v0.7 存档重构） =================
 *
 * 设计目标（为什么需要这一层）：
 *  1. **单一入口**：键名、schema、默认值、错误处理全部集中；业务代码不再直接碰 localStorage。
 *  2. **版本化信封**：落盘格式统一为 { v, savedAt, data }；schema.v + migrations 构成迁移管线。
 *  3. **多槽位**：kup.slots（索引/当前槽）+ kup.save.<id>（每槽独立存档），互不干扰。
 *  4. **不丢档**：两阶段写入（先写 .tmp 校验再提交）+ 坏档隔离（kup.corrupt.*）+ 失败上报。
 *  5. **不静默失败**：localStorage 不可用（隐私模式/被禁用/配额爆）时退化为内存档并置 available=false，
 *     通过 lastError / onError 让 UI 能提示玩家，而不是 `catch(e){}` 假装成功。
 *  6. **写合并**：非关键写入 debounce 150ms；关键写入（结算/购买/招募）用 { now:true } 立即落盘；
 *     页面隐藏/卸载强制 flush。
 *  7. **多标签页**：监听 storage 事件，外部改动时失效缓存并通知订阅者（避免静默互相覆盖）。
 *
 * 键空间（全部以 "kup." 前缀）：
 *   kup.settings          全局设置（语言/音量/BGM/SFX/静音）——**不按槽分**，跨槽共享
 *   kup.slots             槽位索引 { active, seq, list:[{id,name,createdAt,playedAt,playtime,runs,wins}] }
 *   kup.save.<id>         某槽的进度存档
 *   kup.corrupt.<key>.<ts> 坏档隔离副本（只增不改，便于事后排查）
 *   kup.*.tmp             两阶段写入的中间值（正常情况下不会残留）
 *
 * 旧键（kup_meta / kup_best / kup_vol / kup_lang）在 init() 时一次性升级进 s1 槽后删除。
 */
(function () {
  const PREFIX = 'kup';
  const ENVELOPE_V = 1;
  const K_SETTINGS = PREFIX + '.settings';
  const K_SLOTS = PREFIX + '.slots';
  const K_SAVE = PREFIX + '.save.';
  const TMP = '.tmp';
  const DEBOUNCE_MS = 150;
  const LEGACY_KEYS = ['kup_meta', 'kup_best', 'kup_vol', 'kup_lang'];

  function ts() { return Date.now(); }

  /* ---------- 后端：localStorage（探测失败则内存回退） ---------- */
  function memoryBackend() {
    const m = new Map();
    return {
      name: 'memory',
      getItem(k) { return m.has(k) ? m.get(k) : null; },
      setItem(k, v) { m.set(k, String(v)); },
      removeItem(k) { m.delete(k); },
      key(i) { const ks = Array.from(m.keys()); return i < ks.length ? ks[i] : null; },
      get length() { return m.size; },
    };
  }
  function probeBackend() {
    try {
      const ls = window.localStorage;
      const k = PREFIX + '.probe';
      ls.setItem(k, '1');
      const ok = ls.getItem(k) === '1';
      ls.removeItem(k);
      return ok ? ls : null;
    } catch (e) { return null; }
  }

  const STORE = {
    PREFIX: PREFIX,
    ENVELOPE_V: ENVELOPE_V,
    K_SETTINGS: K_SETTINGS,
    K_SLOTS: K_SLOTS,
    SAVE_PREFIX: K_SAVE,

    /** 存档后端是否真的可写（false = 本次会话只存在内存里，刷新即失） */
    available: true,
    backendName: 'localStorage',
    /** 最近一次失败：{ kind, key, message, at } */
    lastError: null,
    /** 外部可挂载的错误回调（UI 用来提示「进度保存失败」） */
    onError: null,

    _backend: null,
    _schemas: {},
    _cache: {},
    _pending: {},
    _timer: null,
    _watchers: [],

    /* ================= 初始化 ================= */

    init() {
      const ls = probeBackend();
      if (ls) {
        this._backend = ls;
        this.available = true;
        this.backendName = 'localStorage';
      } else {
        this._backend = memoryBackend();
        this.available = false;
        this.backendName = 'memory';
        this.lastError = {
          kind: 'unavailable', key: '-', at: ts(),
          message: 'localStorage 不可用（隐私模式或被禁用）——本次进度仅保存在内存中',
        };
        console.warn('[KUP.STORE] ' + this.lastError.message);
      }
      this._bindLifecycle();
      /* 首次启动：确保至少存在一个可用槽位 */
      this.slots.list();
      return this;
    },

    _bindLifecycle() {
      const self = this;
      /* 页面隐藏/卸载：立刻落盘，避免 debounce 窗口内的写入丢失 */
      const flush = () => { try { self.flush(); } catch (e) {} };
      window.addEventListener('pagehide', flush);
      window.addEventListener('beforeunload', flush);
      document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
      /* 多标签页：其它标签改了存档 → 失效缓存 + 通知订阅者 */
      window.addEventListener('storage', ev => {
        if (!ev.key || ev.key.indexOf(PREFIX + '.') !== 0) return;
        delete self._cache[ev.key];
        for (const w of self._watchers) {
          if (w.key === ev.key || w.key === '*') {
            try { w.fn(ev.key, ev.newValue); } catch (e) { console.warn('[KUP.STORE] watcher 抛错', e); }
          }
        }
      });
    },

    /* ================= schema 注册与迁移 =================
     * defineSchema(name, { v, normalize(raw), migrations: { [fromVersion]: fn } })
     *  - normalize：**永远**返回一份结构合法的数据（负责钳制/过滤/补默认值），坏的输入返回默认值。
     *  - migrations：把 v(n) 的 data 升到 v(n+1)；缺失路径时交由 normalize 兜底。
     */
    defineSchema(name, spec) {
      this._schemas[name] = {
        v: Number.isFinite(spec.v) ? spec.v : 1,
        normalize: spec.normalize || (d => (d && typeof d === 'object' ? d : {})),
        migrations: spec.migrations || {},
      };
      return name;
    },

    /** 顺序执行迁移链；遇到断链返回 null（由 normalize 兜底为默认值） */
    migrate(name, data, fromV) {
      const s = this._schemas[name];
      if (!s) return data;
      let v = Number.isFinite(fromV) ? fromV : 0;
      let d = data;
      while (v < s.v) {
        const fn = s.migrations[v];
        if (!fn) { console.warn('[KUP.STORE] ' + name + ' 缺少 v' + v + '→v' + (v + 1) + ' 迁移，回落到默认值'); return null; }
        try { d = fn(d); } catch (e) { console.warn('[KUP.STORE] ' + name + ' v' + v + ' 迁移失败', e); return null; }
        v++;
      }
      return d;
    },

    /* ================= 读 / 写 ================= */

    /** 读取一条记录；损坏则隔离并返回 normalize(null) 的默认值 */
    read(name, key, opts) {
      const schema = this._schemas[name];
      if (!schema) { this._fail('schema', name, new Error('未注册的 schema：' + name)); return null; }
      if (!(opts && opts.force) && Object.prototype.hasOwnProperty.call(this._cache, key)) {
        return this._cache[key];
      }
      let raw = null;
      try { raw = this._backend.getItem(key); }
      catch (e) { this._fail('read', key, e); return this._remember(key, schema.normalize(null)); }
      if (raw == null) return this._remember(key, schema.normalize(null));

      let parsed;
      try {
        parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) throw new Error('信封结构缺失');
        if (Number.isFinite(parsed.v) && parsed.v > ENVELOPE_V) {
          throw new Error('存档信封版本 v' + parsed.v + ' 高于本版程序（v' + ENVELOPE_V + '）');
        }
      } catch (e) {
        this._fail('parse', key, e);
        this._quarantine(key, raw);
        /* 隔离后立刻把该键重置为规范默认值：避免每次启动都重复隔离同一份坏档 */
        this.write(name, key, null, { now: true });
        return this._remember(key, schema.normalize(null));
      }
      const migrated = this.migrate(name, parsed.data, parsed.v);
      const clean = schema.normalize(migrated);
      /* 结构被 normalize 修正过（或发生了迁移）→ 回写一次，保证盘上始终是规范格式 */
      if (JSON.stringify(clean) !== JSON.stringify(parsed.data)) {
        this.write(name, key, clean);
      }
      return this._remember(key, clean);
    },

    /** 写入一条记录；opts.now=true 立即落盘，否则 150ms 合并写 */
    write(name, key, data, opts) {
      const schema = this._schemas[name];
      if (!schema) { this._fail('schema', name, new Error('未注册的 schema：' + name)); return false; }
      const clean = schema.normalize(data);
      let text;
      try { text = JSON.stringify({ v: ENVELOPE_V, savedAt: ts(), data: clean }); }
      catch (e) { this._fail('serialize', key, e); return false; }
      this._pending[key] = { schema: name, text: text };
      this._remember(key, clean);
      if (opts && opts.now) return this.flush();
      this._schedule();
      return true;
    },

    /** 立即落盘所有待写项；返回是否全部成功 */
    flush() {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      let ok = true;
      for (const key in this._pending) {
        const item = this._pending[key];
        delete this._pending[key];
        if (!this._commit(key, item.text)) ok = false;
      }
      return ok;
    },

    remove(key) {
      delete this._pending[key];
      delete this._cache[key];
      try { this._backend.removeItem(key); } catch (e) { this._fail('remove', key, e); return false; }
      return true;
    },

    /** 枚举以某前缀开头的键（自动排除 .tmp 中间值） */
    keys(prefix) {
      const out = [];
      try {
        for (let i = 0; i < this._backend.length; i++) {
          const k = this._backend.key(i);
          if (!k || k.indexOf(prefix || PREFIX + '.') !== 0) continue;
          if (k.slice(-TMP.length) === TMP) continue;
          out.push(k);
        }
      } catch (e) { this._fail('keys', prefix, e); }
      return out;
    },

    /** 订阅某个键（或 '*'）的外部变更 */
    watch(key, fn) {
      const w = { key: key, fn: fn };
      this._watchers.push(w);
      return () => { const i = this._watchers.indexOf(w); if (i >= 0) this._watchers.splice(i, 1); };
    },

    /** 存档健康状况（UI 用来提示） */
    health() {
      return {
        available: this.available, backend: this.backendName,
        pending: Object.keys(this._pending).length, error: this.lastError,
      };
    },

    /* ================= 内部：落盘 / 缓存 / 错误 ================= */

    /* 两阶段写入：先写 .tmp 并回读校验，再提交正式键并回读校验。
     * 任何一步失败都不会破坏盘上已有的旧值（配额爆时尤其重要）。 */
    _commit(key, text) {
      const b = this._backend, tmp = key + TMP;
      try {
        b.setItem(tmp, text);
        if (b.getItem(tmp) !== text) throw new Error('tmp 回读不一致');
        b.setItem(key, text);
        if (b.getItem(key) !== text) throw new Error('正式键回读不一致');
        b.removeItem(tmp);
        return true;
      } catch (e) {
        try { b.removeItem(tmp); } catch (e2) {}
        this._fail('write', key, e);
        return false;
      }
    },
    _remember(key, data) { this._cache[key] = data; return data; },
    _schedule() {
      if (this._timer) return;
      const self = this;
      this._timer = setTimeout(() => { self._timer = null; self.flush(); }, DEBOUNCE_MS);
    },
    _fail(kind, key, err) {
      this.lastError = { kind: kind, key: key, message: String((err && err.message) || err), at: ts() };
      console.warn('[KUP.STORE] ' + kind + ' 失败 @' + key + '：' + this.lastError.message);
      if (typeof this.onError === 'function') { try { this.onError(this.lastError); } catch (e) {} }
    },
    _quarantine(key, raw) {
      try {
        const qk = PREFIX + '.corrupt.' + key.replace(/[^A-Za-z0-9_.-]/g, '_') + '.' + ts();
        this._backend.setItem(qk, raw);
        console.warn('[KUP.STORE] 坏档已隔离为 ' + qk + '（原键 ' + key + ' 将重置）');
        return qk;
      } catch (e) { return null; }
    },

    /* ================= 旧键一次性升级 =================
     * ⚠️ 必须在 'progress' schema 注册之后调用（见 meta.js 末尾），
     * 否则升级时写不出进度档，却已经把旧键删掉了 —— 那就是真正的丢档。 */

    upgradeLegacy() {
      if (!this.available) return false;
      const hasOld = LEGACY_KEYS.some(k => { try { return this._backend.getItem(k) != null; } catch (e) { return false; } });
      if (!hasOld) return false;
      /* 已有新档时不覆盖（只清理旧键） */
      const already = this.keys(K_SAVE).length > 0;
      try {
        if (!already) {
          const rawMeta = this._backend.getItem('kup_meta');
          const rawBest = this._backend.getItem('kup_best');
          let legacy = null;
          try { legacy = rawMeta ? JSON.parse(rawMeta) : null; } catch (e) { legacy = null; }
          if (legacy && typeof legacy === 'object') {
            if (rawBest) { try { legacy.best = JSON.parse(rawBest); } catch (e) {} }
            const id = this.slots.create('', { silent: true });      // 建 s1
            const data = this.migrate('progress', legacy, 0);        // 旧结构 → 当前 schema
            this.write('progress', K_SAVE + id, data, { now: true });
            this.slots.setActive(id, { now: true });
            console.info('[KUP.STORE] 已把旧存档（kup_meta/kup_best）升级到槽位 ' + id);
          }
        }
        /* 散键设置（kup_vol / kup_lang）并进 settings */
        const patch = {};
        const v = parseFloat(this._backend.getItem('kup_vol'));
        if (Number.isFinite(v)) patch.vol = v;
        const l = this._backend.getItem('kup_lang');
        if (l) patch.lang = l;
        if (Object.keys(patch).length) this.settings.set(patch, { now: true });
        for (const k of LEGACY_KEYS) this._backend.removeItem(k);
        return true;
      } catch (e) {
        this._fail('legacy', 'kup_meta', e);
        return false;
      }
    },

    /* ================= 全局设置（不按槽分） ================= */

    settings: {
      DEFAULTS: { lang: null, vol: 0.7, bgm: true, sfx: true, muted: false },
      all(opts) { return STORE.read('settings', K_SETTINGS, opts); },
      get(field) {
        const d = this.all();
        return d && Object.prototype.hasOwnProperty.call(d, field) ? d[field] : this.DEFAULTS[field];
      },
      /* 合并写入；opts.now=true 立即落盘 */
      set(patch, opts) {
        const d = this.all();
        const next = Object.assign({}, d, patch || {});
        STORE.write('settings', K_SETTINGS, next, opts);
        return STORE.read('settings', K_SETTINGS);
      },
    },

    /* ================= 槽位管理 ================= */

    slots: {
      /** 全部槽位元信息（不含进度本体） */
      list() { return STORE.read('slots', K_SLOTS).list; },
      entry(id) { return this.list().find(s => s.id === id) || null; },
      activeId() { return STORE.read('slots', K_SLOTS).active; },
      active() { return this.entry(this.activeId()); },
      saveKey(id) { return K_SAVE + id; },

      setActive(id, opts) {
        const d = STORE.read('slots', K_SLOTS);
        if (!d.list.some(s => s.id === id)) return false;
        d.active = id;
        STORE.write('slots', K_SLOTS, d, opts);
        return true;
      },

      /** 新建槽位，返回新槽 id */
      create(name, opts) {
        const d = STORE.read('slots', K_SLOTS);
        const id = 's' + (d.seq + 1);
        d.seq = d.seq + 1;
        d.list.push({
          id: id, name: name || '', createdAt: ts(), playedAt: 0, playtime: 0, runs: 0, wins: 0,
        });
        const writeOpts = opts && opts.silent ? {} : { now: true };
        STORE.write('slots', K_SLOTS, d, writeOpts);
        /* 建立一份全新的进度档（normalize(null) 的默认值） */
        STORE.write('progress', this.saveKey(id), null, writeOpts);
        return id;
      },

      rename(id, name) {
        const d = STORE.read('slots', K_SLOTS);
        const s = d.list.find(x => x.id === id);
        if (!s) return false;
        s.name = String(name || '').slice(0, 24);
        STORE.write('slots', K_SLOTS, d, { now: true });
        return true;
      },

      /** 复制槽位（进度 + 名称） */
      duplicate(id) {
        const src = this.entry(id);
        if (!src) return null;
        const newId = this.create((src.name || '') + ' ⧉');
        const data = STORE.read('progress', this.saveKey(id));
        STORE.write('progress', this.saveKey(newId), data, { now: true });
        const d = STORE.read('slots', K_SLOTS);
        const dst = d.list.find(x => x.id === newId);
        if (dst) {
          dst.playedAt = src.playedAt; dst.playtime = src.playtime;
          dst.runs = src.runs; dst.wins = src.wins;
          STORE.write('slots', K_SLOTS, d, { now: true });
        }
        return newId;
      },

      /** 删除槽位；返回 { ok, active, switched }。
       * 删的是当前槽时自动切到剩下的第一个（switched=true），否则 active 不变。
       * 只有一个槽位时拒绝删除（ok=false）——始终保留至少一个可写档。 */
      remove(id) {
        const d = STORE.read('slots', K_SLOTS);
        const prevActive = d.active;
        if (d.list.length <= 1) return { ok: false, active: prevActive, switched: false };
        const i = d.list.findIndex(s => s.id === id);
        if (i < 0) return { ok: false, active: prevActive, switched: false };
        d.list.splice(i, 1);
        STORE.remove(this.saveKey(id));
        const switched = prevActive === id;
        if (switched) d.active = d.list[0].id;
        STORE.write('slots', K_SLOTS, d, { now: true });
        return { ok: true, active: d.active, switched: switched };
      },

      /** 槽位摘要（列表展示用；进度本体读失败也不会抛） */
      summary(id) {
        const meta = this.entry(id) || {};
        const d = STORE.read('progress', this.saveKey(id));
        return {
          fukkou: d.fukkou, tickets: d.tickets, eggs: d.eggCount,
          runs: meta.runs || 0, wins: meta.wins || 0,
          playtime: meta.playtime || 0, playedAt: meta.playedAt || 0,
          best: d.best || null, total: d.fukkou,
        };
      },

      /** 结算后更新槽位索引里的统计（由 META 调用） */
      touch(id, stat, opts) {
        const d = STORE.read('slots', K_SLOTS);
        const s = d.list.find(x => x.id === id);
        if (!s) return false;
        s.playedAt = ts();
        if (stat) {
          if (Number.isFinite(stat.playtime)) s.playtime = (s.playtime || 0) + stat.playtime;
          if (stat.run) s.runs = (s.runs || 0) + 1;
          if (stat.win) s.wins = (s.wins || 0) + 1;
        }
        STORE.write('slots', K_SLOTS, d, opts);
        return true;
      },
    },

    /* ================= 导出 / 导入 / 清档 ================= */

    /* base64(JSON) —— 用 TextEncoder 处理 UTF-8，避免 unescape/btoa 的编码坑 */
    _b64encode(str) {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      }
      return btoa(bin);
    },
    _b64decode(b64) {
      const bin = atob(String(b64).replace(/\s+/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    },

    /** 导出某槽为可粘贴文本 */
    exportSlot(id) {
      const payload = {
        kind: 'kup-slot',
        envelope: ENVELOPE_V,
        exportedAt: ts(),
        name: (this.slots.entry(id) || {}).name || '',
        data: this.read('progress', K_SAVE + id),
      };
      return this._b64encode(JSON.stringify(payload));
    },

    /** 导入为**新槽位**（不覆盖现有档）；返回 { ok, id?, error? } */
    importSlot(text) {
      let payload;
      try { payload = JSON.parse(this._b64decode(text)); }
      catch (e) { return { ok: false, error: 'format' }; }
      if (!payload || payload.kind !== 'kup-slot' || !payload.data) return { ok: false, error: 'format' };
      if (Number.isFinite(payload.envelope) && payload.envelope > ENVELOPE_V) return { ok: false, error: 'version' };
      const schema = this._schemas['progress'];
      if (!schema) return { ok: false, error: 'schema' };
      /* 迁移到当前 schema 版本（旧档也吃进来） */
      const fromV = Number.isFinite(payload.schemaV) ? payload.schemaV : schema.v;
      const migrated = fromV >= schema.v ? payload.data : this.migrate('progress', payload.data, fromV);
      const clean = schema.normalize(migrated);
      const id = this.slots.create(payload.name || '');
      this.write('progress', K_SAVE + id, clean, { now: true });
      return { ok: true, id: id };
    },

    /** 清空全部存档（含设置？不——设置保留，属于客户端偏好） */
    wipeAll() {
      for (const k of this.keys(PREFIX + '.')) {
        if (k === K_SETTINGS) continue;
        this.remove(k);
      }
      for (const k of LEGACY_KEYS) this.remove(k);
      this._cache = {};
      this.slots.list();       // 重建默认槽
      return true;
    },
  };

  /* ================= 内建 schema：设置 / 槽位索引 ================= */

  STORE.defineSchema('settings', {
    v: 1,
    normalize(raw) {
      const d = (raw && typeof raw === 'object') ? raw : {};
      const D = STORE.settings.DEFAULTS;
      const vol = parseFloat(d.vol);
      return {
        lang: (typeof d.lang === 'string' && /^(zh|en|ja)$/.test(d.lang)) ? d.lang : D.lang,
        vol: Number.isFinite(vol) ? Math.max(0, Math.min(1, vol)) : D.vol,
        bgm: typeof d.bgm === 'boolean' ? d.bgm : D.bgm,
        sfx: typeof d.sfx === 'boolean' ? d.sfx : D.sfx,
        muted: typeof d.muted === 'boolean' ? d.muted : D.muted,
      };
    },
    /* v0 = 史前散键（kup_vol/kup_lang），由 _upgradeLegacy 喂入 */
    migrations: {
      0(d) {
        const src = (d && typeof d === 'object') ? d : {};
        return { lang: src.lang, vol: src.vol, bgm: src.bgm, sfx: src.sfx, muted: src.muted };
      },
    },
  });

  STORE.defineSchema('slots', {
    v: 1,
    normalize(raw) {
      const d = (raw && typeof raw === 'object') ? raw : {};
      const list = [];
      const src = Array.isArray(d.list) ? d.list : [];
      for (const s of src) {
        if (!s || typeof s.id !== 'string' || !/^s[0-9]+$/.test(s.id)) continue;
        if (list.some(x => x.id === s.id)) continue;
        list.push({
          id: s.id,
          name: typeof s.name === 'string' ? s.name.slice(0, 24) : '',
          createdAt: Number.isFinite(s.createdAt) ? s.createdAt : ts(),
          playedAt: Number.isFinite(s.playedAt) ? s.playedAt : 0,
          playtime: Number.isFinite(s.playtime) && s.playtime > 0 ? s.playtime : 0,
          runs: Number.isFinite(s.runs) && s.runs > 0 ? Math.floor(s.runs) : 0,
          wins: Number.isFinite(s.wins) && s.wins > 0 ? Math.floor(s.wins) : 0,
        });
      }
      if (!list.length) {
        list.push({ id: 's1', name: '', createdAt: ts(), playedAt: 0, playtime: 0, runs: 0, wins: 0 });
      }
      /* seq 必须大于所有已用编号，避免新建时撞号 */
      let maxN = 0;
      for (const s of list) maxN = Math.max(maxN, parseInt(s.id.slice(1), 10) || 0);
      const seq = Math.max(Number.isFinite(d.seq) ? Math.floor(d.seq) : 0, maxN);
      const active = list.some(s => s.id === d.active) ? d.active : list[0].id;
      return { active: active, seq: seq, list: list };
    },
    migrations: {},
  });

  KUP.STORE = STORE.init();
})();
