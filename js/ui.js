window.KUP = window.KUP || {};

/* ================= UI 层（DOM） =================
 * v0.4.0-loop：番街选择（復興率解锁 ★★）、记忆图鉴（記憶の卵 ★）、
 * 復興率条（HUD）、浄化の歌充能条（HUD）、觉醒卡、结算「復興率 +N%」。 */
(function () {
  const U = KUP.U;
  const $ = id => document.getElementById(id);
  const SCREENS = ['screen-menu', 'screen-area', 'screen-select', 'screen-levelup', 'screen-pause', 'screen-over', 'screen-victory', 'screen-memory', 'screen-shop', 'screen-slots'];

  const UI = {
    game: null,
    selectedChar: null,
    selectedArea: null,
    selectedCompanion: null,
    selectedCompanionForm: 'none',
    selectedSupport: null,          // v0.13.3：支援物品（取代同伴槽）
    selectedForm: 'none',
    lastWeaponSig: '',
    els: {},
    _bannerT: 0,
    currentScreen: 'screen-menu',

    init(game) {
      this.game = game;
      const ids = ['hud', 'banner', 'char-cards', 'char-detail', 'lu-cards', 'lu-lv', 'best-line',
        'reroll-n', 'btn-reroll', 'btn-banmode', 'lu-hint',
        'over-stats', 'win-stats', 'danger', 'hp-bar', 'hp-text', 'lv-num', 'timer', 'kills',
        'weapon-row', 'xp-bar-fill', 'boss-wrap', 'boss-name', 'boss-bar', 'vol-slider',
        'shield-bar', 'shield-num', 'dash-pips', 'danger-warn', 'btn-dash', 'buff-row', 'btn-aim',
        'area-cards', 'area-detail', 'fukkou-fill', 'fukkou-label', 'memory-list', 'memory-count',
        'ult-wrap', 'ult-fill', 'win-sub', 'fukkou-menu-line',
        'companion-strip', 'companion-detail', 'companion-form-wrap', 'companion-form-strip',
        'companion-form-detail', 'form-strip', 'form-detail', 'form-title', 'form-chips', 'hud-companion', 'companion-form-title',
        'shop-list', 'shop-tickets', 'fukkou-menu-tickets',
        'menu-slot-line', 'slot-list', 'slot-warn', 'slot-io-text', 'slot-io-msg',
        'order-best-line', 'hud-wave'];
      for (const id of ids) this.els[id] = $(id);
      /* 形态/皮肤/同伴 + 上次出击配置：读回本槽存档（kup.save.<id>） */
      if (KUP.META) {
        const d = KUP.META.ensure();
        this.selectedForm = d.form;
        this.selectedCompanion = d.companion;
        this.selectedCompanionForm = d.companionForm;
        this.selectedSupport = d.support;
        const lr = d.lastRun;
        if (lr) {
          this.selectedArea = lr.area || null;
          this.selectedChar = lr.char || null;
        }
      }
      this.bind();
      this.showBest();
      this.syncAudioBtns();
      this._syncVolSlider();
      this.updateSaveHealth();
    },

    /* 音量滑块同步持久化值（原先滑块永远停在 HTML 的 value=70） */
    _syncVolSlider() {
      const el = this.els['vol-slider'];
      if (el && KUP.Audio) el.value = String(Math.round(KUP.Audio._loadVol() * 100));
    },

    /* 存档健康提示：存储不可用 / 写入失败（取代原先静默 catch(e){}） */
    updateSaveHealth() {
      const el = this.els['slot-warn'];
      const health = KUP.META ? KUP.META.health() : null;
      const msg = this._saveHealthText(health);
      if (el) {
        el.classList.toggle('hidden', !msg);
        el.textContent = msg || '';
      }
      this._saveWarn = msg;
      return msg;
    },
    _saveHealthText(h) {
      if (!h) return '';
      if (!h.available) return KUP.I18N.t('save.memoryOnly');
      if (h.error && (h.error.kind === 'write' || h.error.kind === 'serialize' || h.error.kind === 'parse')) {
        return KUP.I18N.t('save.warn', { msg: h.error.message });
      }
      return '';
    },

    bind() {
      const g = this.game, e = this.els;
      e['btn-start'] = $('btn-start');
      e['btn-start'].addEventListener('click', () => {
        KUP.Audio.init(); KUP.Audio.resume(); KUP.Audio.sfx('select');
        this.showAreaSelect();
      });
      $('btn-area-back').addEventListener('click', () => { this.showScreen('screen-menu'); this.showHUD(false); this.showBest(); });
      $('btn-area-next').addEventListener('click', () => { if (this.selectedArea) this.showSelect(); });
      $('btn-memory').addEventListener('click', () => { KUP.Audio.sfx('select'); this.showMemory(); });
      $('btn-memory-back').addEventListener('click', () => { this.showScreen('screen-menu'); this.showBest(); });
      $('btn-memory-area').addEventListener('click', () => { this.showScreen('screen-area'); this.showAreaSelect(); });
      /* 冲刺按钮（触屏/鼠标）：与 Shift 等价 */
      if ($('btn-dash')) $('btn-dash').addEventListener('click', () => { if (KUP.game) KUP.game.tryDash(); });
      /* 瞄准模式切换（自动／鼠标／移动） */
      if ($('btn-aim')) $('btn-aim').addEventListener('click', () => { if (KUP.game) KUP.game.cycleAim(); });
      /* 升级屏：重掷 / 封禁模式（v0.10） */
      if ($('btn-reroll')) $('btn-reroll').addEventListener('click', () => { if (KUP.game) KUP.game.rerollChoices(); });
      if ($('btn-banmode')) $('btn-banmode').addEventListener('click', () => { this.toggleBanMode(); });
      /* 瓦利斯（商店）：入口 + 分页 */
      $('btn-shop').addEventListener('click', () => { KUP.Audio.sfx('select'); this.shopTab = 'upgrade'; this.showShop(); });
      $('btn-shop-back').addEventListener('click', () => { this.showScreen('screen-menu'); this.showBest(); });
      document.querySelectorAll('.shop-tab').forEach(t => {
        t.addEventListener('click', () => { KUP.Audio.sfx('select'); this.shopTab = t.dataset.tab; this.showShop(); });
      });
      $('btn-back-menu').addEventListener('click', () => { this.showScreen('screen-menu'); this.showHUD(false); this.showBest(); });
      $('btn-depart').addEventListener('click', () => {
        if (!this.selectedChar) return;
        g.start({
          char: this.selectedChar,
          area: this.selectedArea || g.run.area,
          form: this.selectedForm,
          companion: this.selectedCompanion,
          companionForm: this.selectedCompanionForm,
          support: this.selectedSupport,
        });
      });
      $('btn-resume').addEventListener('click', () => this.resume());
      /* 重开：优先用本局记录，其次用本槽最后出击配置（刷新后也能正确重开） */
      const restart = () => {
        const lr = (KUP.META && KUP.META.lastRun()) || {};
        const c = g.lastChar || this.selectedChar || lr.char;
        if (!c) return;
        g.start({
          char: c,
          area: this.selectedArea || lr.area || g.run.area,
          form: this.selectedForm || lr.form,
          companion: this.selectedCompanion || lr.companion,
          companionForm: this.selectedCompanionForm || lr.companionForm,
          support: this.selectedSupport || lr.support,
        });
      };
      $('btn-restart').addEventListener('click', restart);
      $('btn-retry').addEventListener('click', restart);
      $('btn-retry2').addEventListener('click', restart);
      /* 存档 / 观测记录（多槽位） */
      $('btn-slots').addEventListener('click', () => { KUP.Audio.sfx('select'); this.showSlots(); });
      $('btn-slots-back').addEventListener('click', () => { this.showScreen('screen-menu'); this.showBest(); });
      $('btn-slot-new').addEventListener('click', () => this.slotNew());
      $('btn-slot-export').addEventListener('click', () => this.slotExport());
      $('btn-slot-import').addEventListener('click', () => this.slotImport());
      const toMenu = () => {
        g.state = 'menu'; KUP.Audio.stopBGM();
        this.showScreen('screen-menu'); this.showHUD(false); this.showBest();
      };
      $('btn-quit').addEventListener('click', toMenu);
      $('btn-menu1').addEventListener('click', toMenu);
      $('btn-menu2').addEventListener('click', toMenu);
      $('btn-mute').addEventListener('click', () => this.toggleMute());
      $('btn-pause').addEventListener('click', () => this.pause());
      e['vol-slider'].addEventListener('input', ev => {
        KUP.Audio.init(); KUP.Audio.resume();
        KUP.Audio.setVol(ev.target.value / 100);
      });
      const bgmBtn = $('btn-bgm-toggle'), sfxBtn = $('btn-sfx-toggle');
      this.els['btn-bgm-toggle'] = bgmBtn; this.els['btn-sfx-toggle'] = sfxBtn;
      bgmBtn.addEventListener('click', () => {
        KUP.Audio.setFlag('bgmOn', !KUP.Audio.bgmOn);
        this.syncAudioBtns();
        if (KUP.Audio.bgmOn && g.state === 'paused') { KUP.Audio.init(); KUP.Audio.startBGM(); }
        else KUP.Audio.stopBGM();
      });
      sfxBtn.addEventListener('click', () => {
        KUP.Audio.setFlag('sfxOn', !KUP.Audio.sfxOn);
        this.syncAudioBtns();
      });
      // 语言切换按钮
      document.querySelectorAll('[data-lang]').forEach(b => {
        b.addEventListener('click', () => {
          KUP.Audio.init(); KUP.Audio.resume(); KUP.Audio.sfx('select');
          KUP.I18N.setLang(b.dataset.lang);
        });
      });
    },

    /* ---------- 屏幕 ---------- */
    showScreen(name) {
      this.currentScreen = name || 'screen-menu';
      for (const id of SCREENS) $(id).classList.toggle('hidden', id !== name);
    },    showHUD(on) { this.els.hud.classList.toggle('hidden', !on); },

    pause() {
      const g = this.game;
      if (g.state !== 'playing') return;
      g.state = 'paused';
      this.showScreen('screen-pause');
      KUP.Audio.sfx('select');
    },
    resume() {
      const g = this.game;
      if (g.state !== 'paused') return;
      g.state = 'playing';
      this.showScreen(null);
      KUP.Audio.resume();
    },

    toggleMute() {
      KUP.Audio.init(); KUP.Audio.resume();
      KUP.Audio.setFlag('muted', !KUP.Audio.muted);          // 静音状态持久化（原仅存在于内存）
      if (KUP.Audio.master) KUP.Audio.master.gain.value = KUP.Audio.muted ? 0 : KUP.Audio._loadVol();
      this.syncAudioBtns();
    },

    /* 语言切换后的动态文本重建 */
    syncAudioBtns() {
      const b = this.els['btn-bgm-toggle'], s = this.els['btn-sfx-toggle'];
      if (b) b.textContent = KUP.I18N.t('pause.bgm', { s: KUP.Audio.bgmOn ? 'ON' : 'OFF' });
      if (s) s.textContent = KUP.I18N.t('pause.sfx', { s: KUP.Audio.sfxOn ? 'ON' : 'OFF' });
      const m = $('btn-mute');
      if (m) m.textContent = KUP.Audio.muted ? '✕' : '♪';
    },
    onLangChange() {
      this.syncAudioBtns();
      this.showBest();
      this.updateMetaUI();
      const st = this.currentScreen;
      if (st === 'screen-select') {
        const sel = this.selectedChar;
        this.showSelect();
        this.selectChar(sel);
      } else if (st === 'screen-area') {
        this.showAreaSelect();
        this.selectArea(this.selectedArea);
      } else if (st === 'screen-memory') {
        this.showMemory();
      } else if (st === 'screen-shop') {
        this.showShop();
      } else if (st === 'screen-slots') {
        this.showSlots();
      } else if (st === 'screen-levelup' && this.game.choices) {
        this.showLevelUp(this.game.choices, this.game.level);
      } else if ((st === 'screen-over' || st === 'screen-victory') && this.game.player) {
        this.showEnd(this.game.state === 'victory', this.game.stats());
      }
    },

    /* ---------- 番街选择（復興率解锁 ★★） ---------- */
    showAreaSelect() {
      this.showScreen('screen-area');
      this.showHUD(false);
      this.updateMetaUI();
      const wrap = this.els['area-cards'];
      if (!wrap.childElementCount) {
        for (const a of KUP.AREAS) {
          const card = document.createElement('div');
          card.className = 'area-card';
          card.dataset.id = a.id;
          card.style.setProperty('--c', a.accent || '#8fd0ff');
          card.innerHTML =
            '<div class="area-glyph">' + (a.glyph || a.id.replace('area', '')) + '</div>' +
            '<div class="area-name">' + KUP.I18N.tv(a.name) + '</div>' +
            '<div class="area-role"></div>' +
            '<div class="area-chapter"></div>' +
            '<div class="area-lock"></div>';
          card.addEventListener('click', () => this.selectArea(a.id));
          wrap.appendChild(card);
        }
      }
      this.selectArea(this.selectedArea);
    },
    selectArea(id) {
      this.selectedArea = id || null;
      const unlocked = id && KUP.META.isUnlocked(id);
      const cards = this.els['area-cards'].children;
      for (const card of cards) {
        const a = KUP.AREA(card.dataset.id);
        const ok = KUP.META.isUnlocked(a.id);
        card.classList.toggle('selected', card.dataset.id === id);
        card.classList.toggle('locked', !ok);
        card.classList.toggle('endless', !!a.endless);
        card.querySelector('.area-chapter').textContent = KUP.I18N.tv(a.chapter);
        /* 治安战：角色行标注「∞ 无尽 · 没有败北」 */
        card.querySelector('.area-role').textContent = a.endless
          ? KUP.I18N.t('area.endless')
          : KUP.I18N.tv(a.role);
        card.querySelector('.area-lock').textContent = ok
          ? (KUP.META.clearedCount(a.id) ? KUP.I18N.t('area.cleared', { n: KUP.META.clearedCount(a.id) })
             : (KUP.META.orderBest() && a.endless ? KUP.I18N.t('end.stat.score') + ' ' + KUP.META.orderBest().score : ''))
          : KUP.I18N.t('area.locked', { n: KUP.META.thresholdOf(a.id) });
      }
      $('btn-area-next').disabled = !unlocked;
      const a = KUP.AREAS.find(x => x.id === id);
      if (!a) { this.els['area-detail'].innerHTML = KUP.I18N.t('area.default'); return; }
      /* 居住的魔女之子 + 势力（§15.5 每番街一组织） */
      const resident = a.resident ? KUP.CHARS.find(c => c.id === a.resident) : null;
      /* 括注与破折号随语言切换：ja/zh 用全角「（）—」，en 用半角「() —」
       * （官方英文写作 `Area 2, the entertainment district`，本作在区名后括注地区词，故半角更自然） */
      const isEn = KUP.I18N.lang === 'en';
      const roleText = isEn
        ? ' (' + KUP.I18N.tv(a.role) + ') — '
        : '（' + KUP.I18N.tv(a.role) + '）— ';
      let html = '<b>' + KUP.I18N.tv(a.name) + '</b>' + roleText + KUP.I18N.tv(a.desc);
      if (resident) {
        html += '<br><span class="area-faction">' + KUP.I18N.t('area.resident', { name: KUP.nameOf(resident), cv: KUP.cvOf(resident) }) + '</span>';
      }
      /* 势力行：没有对应组织的番街（伍・陸）留空，不显示「势力：—」 */
      if (a.faction) {
        html += '<br><span class="area-faction">' + KUP.I18N.t('area.faction', { f: KUP.I18N.tv(a.faction) }) + '</span>';
      }
      if (a.endless) {
        /* 治安战：明确「没有败北」与成绩归属（玩家可见的规则说明） */
        html += '<br><span class="area-endless">' + KUP.I18N.t('area.endlessNote') + '</span>';
      } else {
        html += '<br><span class="area-req">' + (KUP.META.isUnlocked(a.id)
          ? KUP.I18N.t('area.unlocked', { n: KUP.META.thresholdOf(a.id) })
          : KUP.I18N.t('area.need', { n: KUP.META.thresholdOf(a.id) })) + '</span>';
      }
      /* ★ 2026-10：**番街的出处标注不再显示给玩家**。
       *   出处等级仍保存在数据层（`a.src`）与 js/config.js 的注释里，
       *   玩家界面只留「官方定位／势力／解锁条件」这类可玩信息。
       *   —— 需要恢复时取消下面两行注释即可（i18n 词条也已就地注释保留）：
       * const srcKey = a.src === 'regenerate' ? 'area.src.regen' : (a.src === 'original' ? 'area.src.original' : 'area.src.narrative');
       * html += '<br><span class="area-src">' + KUP.I18N.t(srcKey) + '</span>';
       */
      this.els['area-detail'].innerHTML = html;
    },

    /* ---------- 復興率条（菜单 + 番街选择共用数据） ---------- */
    updateMetaUI() {
      if (!KUP.META || !this.els['fukkou-fill']) return;
      const total = KUP.META.total();
      this.els['fukkou-fill'].style.width = total + '%';
      // 下一未解锁番街阈值
      let next = null;
      for (const a of KUP.AREAS) {
        if (!KUP.META.isUnlocked(a.id)) { next = KUP.META.thresholdOf(a.id); break; }
      }
      const eggs = KUP.META.ensure().eggCount;
      this.els['fukkou-label'].textContent = next != null
        ? KUP.I18N.t('meta.rate', { n: total }) + ' · ' + KUP.I18N.t('meta.next', { n: next })
        : KUP.I18N.t('meta.rate', { n: total }) + ' · ' + KUP.I18N.t('meta.max');
      if (this.els['fukkou-menu-line']) {
        this.els['fukkou-menu-line'].textContent = KUP.I18N.t('meta.eggs', { n: eggs });
      }
      if (this.els['fukkou-menu-tickets']) {
        this.els['fukkou-menu-tickets'].textContent = KUP.I18N.t('shop.tickets', { n: KUP.META.tickets() });
      }
      /* 当前档位名称（多槽位） */
      if (this.els['menu-slot-line']) {
        const list = KUP.META.slots.list();
        const entry = KUP.META.slots.active();
        const idx = Math.max(0, list.findIndex(s => s.id === (entry && entry.id)));
        const name = (entry && entry.name) || KUP.I18N.t('slots.nameDefault', { n: idx + 1 });
        this.els['menu-slot-line'].textContent = KUP.I18N.t('menu.slot', { name: name });
      }
    },

    /* ---------- 瓦利斯（VALIS 的饭店）· 局外强化与培养 ----------
     * ★ 出处：REGENERATE 官方页「弐番街 歌と中華料理の店・瓦利斯」（VALIS 六人店员）。
     * 用**市民票**购买小幅永久强化；也可在此**培养（招募）魔女候補**与**招募復興課同伴**。 */
    showShop() {
      this.showScreen('screen-shop');
      this.showHUD(false);
      this.updateMetaUI();
      const wrap = this.els['shop-list'];
      wrap.innerHTML = '';
      if (this.shopTab !== 'recruit') {
        /* 强化页：8 项小幅永久强化 */
        for (const it of KUP.SHOP) {
          const lv = KUP.META.shopLv(it.id);
          const maxed = lv >= it.maxLv;
          const cost = KUP.META.shopNextCost(it.id);
          const afford = KUP.META.tickets() >= cost;
          const card = document.createElement('div');
          card.className = 'shop-card' + (maxed ? ' maxed' : '') + (afford && !maxed ? '' : ' poor');
          card.style.setProperty('--c', '#ffd98a');
          let pips = '';
          for (let i = 1; i <= it.maxLv; i++) pips += '<i class="' + (i <= lv ? 'on' : '') + '"></i>';
          card.innerHTML =
            '<div class="shop-icon">' + it.icon + '</div>' +
            '<div class="shop-name">' + KUP.I18N.tv(it.name) + '</div>' +
            '<div class="shop-pips">' + pips + '</div>' +
            '<div class="shop-desc">' + KUP.I18N.tv(it.desc) + '</div>' +
            '<div class="shop-cost">' + (maxed ? KUP.I18N.t('shop.maxed') : '🎫 ' + cost) + '</div>';
          if (!maxed) card.addEventListener('click', () => {
            if (KUP.META.buyShop(it.id)) { KUP.Audio.sfx('levelup'); this.showShop(); }
            else KUP.Audio.sfx('hurt');
          });
          wrap.appendChild(card);
        }
      } else {
        /* 招募页：可操作角色（魔女候補）与同伴——条件＋市民票 */
        const mkRecruit = (ent, kind) => {
          const joined = kind === 'char' ? KUP.META.isCharUnlocked(ent.id) : KUP.META.isCompanionUnlocked(ent.id);
          const gate = KUP.META.gateMet(ent.unlock);
          const cost = (ent.unlock && ent.unlock.cost) || 0;
          const afford = KUP.META.tickets() >= cost;
          const u = ent.unlock || {};
          const gateText = u.area
            ? KUP.I18N.t('shop.gateArea', { area: KUP.I18N.tv(KUP.AREA(u.area).name) })
            : KUP.I18N.t('shop.gateFukkou', { n: u.fukkou });
          const card = document.createElement('div');
          card.className = 'shop-card recruit' + (joined ? ' joined' : ((!gate || !afford) ? ' poor' : ''));
          card.style.setProperty('--c', ent.color || '#8fd0ff');
          card.innerHTML =
            '<div class="shop-icon">' + ent.name.replace(/\s/g, '').charAt(0) + '</div>' +
            '<div class="shop-name">' + ent.name + '</div>' +
            '<div class="shop-desc">' + KUP.I18N.t('select.cv', { cv: KUP.cvOf(ent) }) +
              (ent.rank ? ' · ' + KUP.I18N.tv(ent.rank) : '') + '<br>' +
              KUP.I18N.tv(ent.desc) + '</div>' +
            '<div class="shop-cost">' + (joined
              ? KUP.I18N.t('shop.joined')
              : (gate ? ('🎫 ' + cost + ' · ' + (kind === 'char' ? KUP.I18N.t('shop.train') : KUP.I18N.t('shop.hire')))
                      : '🔒 ' + gateText)) + '</div>';
          if (!joined && gate) card.addEventListener('click', () => {
            if (KUP.META.payRecruit(ent.id)) {
              KUP.Audio.sfx('levelup');
              if (kind === 'char') this.showCompanionStrip();
              else this.showCompanionStrip();
              this.showShop();
            } else KUP.Audio.sfx('hurt');
          });
          wrap.appendChild(card);
        };
        for (const c of KUP.CHARS) if (c.recruit) mkRecruit(c, 'char');
        for (const c of KUP.companionsActive()) mkRecruit(c, 'comp');
        /* v0.13.3 支援物品：**局外解锁**（花市民票，无门槛）——解锁后可在出击界面携带 */
        const mkSupport = (sp) => {
          const got = KUP.META.isSupportUnlocked(sp.id);
          const cost = (sp.unlock && sp.unlock.cost) || 0;
          const afford = KUP.META.tickets() >= cost;
          const card = document.createElement('div');
          card.className = 'shop-card recruit' + (got ? ' joined' : (afford ? '' : ' poor'));
          card.style.setProperty('--c', sp.color || '#8fd0ff');
          card.innerHTML =
            '<div class="shop-icon">' + (sp.icon || KUP.I18N.tv(sp.name).charAt(0)) + '</div>' +
            '<div class="shop-name">' + KUP.I18N.tv(sp.name) + '</div>' +
            '<div class="shop-desc">' + KUP.I18N.t('support.kind') + '<br>' + KUP.I18N.tv(sp.desc) + '</div>' +
            '<div class="shop-cost">' + (got ? KUP.I18N.t('shop.joined') : ('🎫 ' + cost + ' · ' + KUP.I18N.t('support.unlockShort'))) + '</div>';
          if (!got) card.addEventListener('click', () => {
            if (KUP.META.paySupport(sp.id)) {
              KUP.Audio.sfx('levelup');
              this.showSupportStrip();
              this.showShop();
            } else KUP.Audio.sfx('hurt');
          });
          wrap.appendChild(card);
        };
        for (const sp of KUP.SUPPORTS) mkSupport(sp);
        if (!KUP.CHARS.some(c => c.recruit) && !KUP.companionsActive().length && !KUP.SUPPORTS.length) {
          wrap.innerHTML = '<div class="pick-detail">' + KUP.I18N.t('shop.none') + '</div>';
        }
      }
      /* tab 高亮 + 市民票余额 */
      for (const b of document.querySelectorAll('.shop-tab')) {
        b.classList.toggle('active', b.dataset.tab === (this.shopTab || 'upgrade'));
      }
      this.els['shop-tickets'].textContent = KUP.I18N.t('shop.tickets', { n: KUP.META.tickets() });
    },

    /* ---------- 记忆图鉴（記憶の卵 ★ 动画第6話） ---------- */
    showMemory() {
      this.showScreen('screen-memory');
      this.showHUD(false);
      this.updateMetaUI();
      const list = this.els['memory-list'];
      list.innerHTML = '';
      const unlocked = KUP.META.ensure().eggs;
      for (const f of KUP.FRAGMENTS) {
        const has = unlocked.indexOf(f.id) >= 0;
        const row = document.createElement('div');
        row.className = 'mem-item' + (has ? '' : ' mem-locked');
        row.innerHTML = has
          ? '<div class="mem-title">🥚 ' + KUP.I18N.tv(f.title) + '</div><div class="mem-text">' + KUP.I18N.tv(f.text) + '</div>'
          : '<div class="mem-title">🥚 ' + KUP.I18N.t('mem.locked') + '</div><div class="mem-text">' + KUP.I18N.t('mem.lockedHint') + '</div>';
        list.appendChild(row);
      }
      this.els['memory-count'].textContent = KUP.I18N.t('mem.count', { n: unlocked.length, m: KUP.FRAGMENTS.length });
    },

    /* ---------- 存档 / 观测记录（v0.7 多槽位） ----------
     * 槽位管理全部经 KUP.META.slots → KUP.STORE；本层只负责 DOM 与确认交互。
     * ⚠️ 切换/删除槽位会重载 META 内存态，因此必须同步刷新菜单与选择界面的缓存状态。 */
    showSlots() {
      this.showScreen('screen-slots');
      this.showHUD(false);
      this.updateSaveHealth();
      this._renderSlots();
      this._ioMsg('', false);
    },

    _slotLabel(entry, idx) { return (entry && entry.name) || KUP.I18N.t('slots.nameDefault', { n: idx + 1 }); },
    _stamp(ms) {
      const d = new Date(ms), p = n => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    },
    _dur(sec) {
      sec = Math.max(0, Math.floor(sec || 0));
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60, p = n => String(n).padStart(2, '0');
      return h > 0 ? h + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
    },

    _renderSlots() {
      const wrap = this.els['slot-list'];
      if (!wrap) return;
      const list = KUP.META.slots.list();
      const activeId = KUP.META.slots.activeId();
      wrap.innerHTML = '';
      list.forEach((entry, idx) => {
        const sum = KUP.META.slots.summary(entry.id);
        const isActive = entry.id === activeId;
        const card = document.createElement('div');
        card.className = 'slot-card' + (isActive ? ' active' : '');
        card.dataset.id = entry.id;

        const head = document.createElement('div');
        head.className = 'slot-head';
        const nameEl = document.createElement('span');
        nameEl.className = 'slot-name';
        nameEl.textContent = this._slotLabel(entry, idx);
        head.appendChild(nameEl);
        if (isActive) {
          const badge = document.createElement('span');
          badge.className = 'slot-badge';
          badge.textContent = KUP.I18N.t('slots.current');
          head.appendChild(badge);
        }
        card.appendChild(head);

        const sumEl = document.createElement('div');
        sumEl.className = 'slot-sum';
        sumEl.textContent = KUP.I18N.t('slots.summary', {
          f: Math.round(sum.fukkou), t: sum.tickets, e: sum.eggs,
        });
        card.appendChild(sumEl);

        const statsEl = document.createElement('div');
        statsEl.className = 'slot-stats';
        statsEl.textContent = KUP.I18N.t('slots.stats', { r: sum.runs, w: sum.wins, time: this._dur(sum.playtime) })
          + ' · ' + (sum.playedAt ? KUP.I18N.t('slots.lastPlayed', { t: this._stamp(sum.playedAt) }) : KUP.I18N.t('slots.never'));
        card.appendChild(statsEl);

        const acts = document.createElement('div');
        acts.className = 'slot-acts';
        if (!isActive) acts.appendChild(this._slotAct(KUP.I18N.t('slots.enter'), () => this.slotSelect(entry.id)));
        acts.appendChild(this._slotAct(KUP.I18N.t('slots.rename'), () => this.slotRename(card, entry)));
        acts.appendChild(this._slotAct(KUP.I18N.t('slots.copy'), () => this.slotCopy(entry.id)));
        const del = this._slotAct(KUP.I18N.t('slots.del'), () => {});
        del.classList.add('danger');
        del.addEventListener('click', ev => {
          ev.stopPropagation();
          if (del.dataset.armed === '1') { this.slotDelete(entry.id); return; }
          this._armDelete(del);
        });
        acts.appendChild(del);
        card.appendChild(acts);

        if (!isActive) card.addEventListener('click', () => this.slotSelect(entry.id));
        wrap.appendChild(card);
      });

      const newBtn = $('btn-slot-new');
      if (newBtn) {
        const can = KUP.META.slots.canCreate();
        newBtn.disabled = !can;
        newBtn.title = can ? '' : KUP.I18N.t('slots.full', { n: KUP.CONFIG.SAVE.MAX_SLOTS });
      }
    },

    _slotAct(label, fn) {
      const b = document.createElement('button');
      b.className = 'slot-act';
      b.textContent = label;
      b.addEventListener('click', ev => { ev.stopPropagation(); KUP.Audio.sfx('select'); fn(); });
      return b;
    },
    /* 删除需二次确认：整档删除不可撤销（3 秒无操作自动复位） */
    _armDelete(btn) {
      btn.dataset.armed = '1';
      btn.classList.add('warn');
      btn.textContent = KUP.I18N.t('slots.delConfirm');
      setTimeout(() => {
        if (!btn.isConnected) return;
        btn.dataset.armed = '0';
        btn.classList.remove('warn');
        btn.textContent = KUP.I18N.t('slots.del');
      }, 3000);
    },
    _ioMsg(text, isErr) {
      const el = this.els['slot-io-msg'];
      if (!el) return;
      el.textContent = text || '';
      el.classList.toggle('err', !!isErr);
    },

    /* 切换槽位：重载 META 后，把 UI 侧缓存（皮肤/同伴/上次出击）一并同步 */
    slotSelect(id) {
      if (id === KUP.META.slots.activeId()) return;
      if (!KUP.META.slots.switchTo(id)) return;
      this._syncFromSave();
      KUP.Audio.sfx('levelup');
      this._renderSlots();
      this.showBest();
    },
    _syncFromSave() {
      const d = KUP.META.ensure();
      this.selectedForm = d.form;
      this.selectedCompanion = d.companion;
      this.selectedCompanionForm = d.companionForm;
      const lr = d.lastRun;
      this.selectedArea = lr ? lr.area : null;
      this.selectedChar = lr ? lr.char : null;
      this.lastWeaponSig = '';
    },
    /* 其它标签页写入存档后由 META 调用 */
    onSaveReload() {
      this._syncFromSave();
      this.showBest();
      this.updateSaveHealth();
      if (this.currentScreen === 'screen-slots') this._renderSlots();
    },

    slotRename(card, entry) {
      const nameEl = card.querySelector('.slot-name');
      if (!nameEl) return;
      const input = document.createElement('input');
      input.className = 'slot-name-input';
      input.maxLength = 24;
      input.value = nameEl.textContent;
      input.placeholder = KUP.I18N.t('slots.renameHint');
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      let done = false;
      const commit = keep => {
        if (done) return;
        done = true;
        if (keep) KUP.META.slots.rename(entry.id, input.value.trim());
        this._renderSlots();
        this.updateMetaUI();
      };
      input.addEventListener('keydown', ev => {
        ev.stopPropagation();                       // 不惊动全局快捷键（Esc/M/Space）
        if (ev.key === 'Enter') commit(true);
        else if (ev.key === 'Escape') commit(false);
      });
      input.addEventListener('blur', () => commit(true));
      input.addEventListener('click', ev => ev.stopPropagation());
    },

    slotCopy(id) {
      const newId = KUP.META.slots.duplicate(id);
      if (!newId) { KUP.Audio.sfx('hurt'); return; }
      KUP.Audio.sfx('levelup');
      this._renderSlots();
    },

    slotDelete(id) {
      const r = KUP.META.slots.remove(id);
      if (!r.ok) { KUP.Audio.sfx('hurt'); this._ioMsg(KUP.I18N.t('slots.keepOne'), true); return; }
      KUP.Audio.sfx('hurt');
      this._syncFromSave();
      this._renderSlots();
      this.showBest();
    },

    slotNew() {
      if (!KUP.META.slots.canCreate()) { KUP.Audio.sfx('hurt'); return; }
      if (!KUP.META.slots.create('')) { KUP.Audio.sfx('hurt'); return; }
      KUP.Audio.sfx('levelup');
      this._renderSlots();
    },

    /* 导出：把文本显示在文本框里并全选，顺带尝试写入剪贴板（失败不影响流程） */
    slotExport() {
      const ta = this.els['slot-io-text'];
      const text = KUP.META.exportSlot();
      ta.classList.remove('hidden');
      ta.value = text;
      ta.focus();
      ta.select();
      try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
      this.updateSaveHealth();
    },

    /* 导入：一律作为**新槽位**加入，不覆盖现有档 */
    slotImport() {
      const ta = this.els['slot-io-text'];
      ta.classList.remove('hidden');
      const text = (ta.value || '').trim();
      if (!text) { KUP.Audio.sfx('hurt'); this._ioMsg(KUP.I18N.t('slots.importFail'), true); return; }
      if (!KUP.META.slots.canCreate()) { KUP.Audio.sfx('hurt'); this._ioMsg(KUP.I18N.t('slots.full', { n: KUP.CONFIG.SAVE.MAX_SLOTS }), true); return; }
      const r = KUP.META.importSlot(text);
      if (!r.ok) { KUP.Audio.sfx('hurt'); this._ioMsg(KUP.I18N.t('slots.importFail'), true); return; }
      KUP.Audio.sfx('levelup');
      ta.value = '';
      this._renderSlots();
      this._ioMsg(KUP.I18N.t('slots.importOk'), false);
    },

    /* ---------- 选人 ---------- */
    showSelect() {
      this.showScreen('screen-select');
      this.showHUD(false);
      const wrap = this.els['char-cards'];
      if (!wrap.childElementCount) {
        for (const c of KUP.CHARS) {
          const card = document.createElement('div');
          card.className = 'char-card' + (c.recruit ? ' recruit' : '');
          card.dataset.id = c.id;
          card.style.setProperty('--c', c.color);
          card.style.setProperty('--c2', c.color2);
          /* 主角＝**魔女之子**（森先化歩など）与**可招募角色**（魔女候補）；
           * 「花譜」等只作**声の担当**标注——角色 ≠ 声优 */
          card.innerHTML =
            '<div class="char-portrait">' + KUP.nameOf(c).replace(/\s/g, '').charAt(0) + '</div>' +
            '<div class="char-name">' + KUP.nameOf(c) + '</div>' +
            /* 读音只在 zh/ja 显示——英文界面用官方罗马字名，标音反而多余 */
            '<div class="char-reading">' + (KUP.I18N.lang === 'en' ? '' : c.reading) + '</div>' +
            '<div class="char-epithet">' + KUP.I18N.t('select.cv', { cv: KUP.cvOf(c) }) + '</div>' +
            '<div class="char-weapon">' + KUP.I18N.tv(KUP.WEAPONS[c.weapon].name) + '</div>' +
            (c.recruit ? '<div class="char-lock"></div>' : '');
          card.addEventListener('click', () => this.selectChar(c.id));
          wrap.appendChild(card);
        }
      }
      /* 招募角色：未满足条件时显示锁与条件 */
      for (const card of wrap.children) {
        const c = KUP.CHAR(card.dataset.id);
        if (!c.recruit) continue;
        const ok = KUP.META.isCharUnlocked(c.id);
        card.classList.toggle('locked', !ok);
        const lockEl = card.querySelector('.char-lock');
        if (lockEl) lockEl.textContent = ok ? KUP.I18N.t('char.recruited') : '🔒 ' + KUP.I18N.tv(c.unlock.desc);
      }
      this.showCompanionStrip();
      this.selectChar(this.selectedChar);
    },
    /* 支援物品选择条（v0.13.3：取代原「同伴」槽）——
     * 五件支援物（冰淇淋／巧克力／糖果／泡芙／炸年糕果子）顺序对应五位魔女之子，
     * 但**先不做差异化**（数值全同）；解锁靠「局外花市民票」（瓦利斯 · 培养・招募页）。
     * DOM 沿用原来的 companion-* 容器，避免动 index.html 的结构（只改文案）。 */
    showSupportStrip() {
      const strip = this.els['companion-strip'];
      if (!strip) return;
      strip.innerHTML = '';
      const mk = (id, name, sub, color, locked, lockedText) => {
        const card = document.createElement('div');
        card.className = 'mini-card' + (locked ? ' locked' : '') + (this.selectedSupport === id ? ' selected' : '');
        card.dataset.id = id || '';
        card.style.setProperty('--c', color || '#8fd0ff');
        card.innerHTML = '<div class="mini-name">' + name + '</div><div class="mini-sub">' + (locked ? lockedText : (sub || '')) + '</div>';
        if (!locked) card.addEventListener('click', () => { KUP.Audio.sfx('select'); this.selectSupport(id); });
        strip.appendChild(card);
      };
      mk(null, KUP.I18N.t('support.none'), '', '#7a7398', false, '');
      for (const sp of KUP.SUPPORTS) {
        const locked = !KUP.META.isSupportUnlocked(sp.id);
        const cost = (sp.unlock && sp.unlock.cost) || 0;
        mk(sp.id, KUP.I18N.tv(sp.name), KUP.I18N.tv(sp.desc).replace(/<[^>]+>/g, ''), sp.color,
          locked, '🔒 ' + KUP.I18N.t('support.unlock', { n: cost }));
      }
      this.selectSupport(this.selectedSupport);
      /* 同伴皮肤（JK 制服）随同伴层一起暂不登场：无同伴 ⇒ 自动隐藏 */
      this.showCompanionFormStrip();
    },
    selectSupport(id) {
      if (id && !KUP.META.isSupportUnlocked(id)) return;
      this.selectedSupport = id || null;
      KUP.META.setSupport(this.selectedSupport);
      const strip = this.els['companion-strip'];
      if (strip) for (const card of strip.children) {
        card.classList.toggle('selected', (card.dataset.id || '') === (id || ''));
      }
      this.els['companion-detail'].innerHTML = id
        ? KUP.I18N.tv(KUP.SUPPORT(id).desc)
        : KUP.I18N.t('support.solo');
    },
    /* 兼容旧调用（同伴槽已由支援物品取代） */
    showCompanionStrip() { this.showSupportStrip(); },
    selectCompanion() { /* no-op：同伴层 v0.13.3 起暂不登场 */ },
    /* 同伴皮肤（黑／白，暂定）选择条 —— 无同伴时隐藏 */
    showCompanionFormStrip() {
      const wrap = this.els['companion-form-wrap'];
      const strip = this.els['companion-form-strip'];
      if (!wrap || !strip) return;
      const show = !!this.selectedCompanion;
      wrap.classList.toggle('hidden', !show);
      if (!show) return;
      strip.innerHTML = '';
      const comp = KUP.COMPANION(this.selectedCompanion);
      if (this.els['companion-form-title']) {
        this.els['companion-form-title'].textContent =
          KUP.I18N.t('form.title.companion', { name: comp ? KUP.shortOf(comp) : '' });
      }
      for (const f of KUP.formsFor('companion')) {
        const card = document.createElement('div');
        card.className = 'mini-card' + (this.selectedCompanionForm === f.id ? ' selected' : '');
        card.dataset.id = f.id;
        card.style.setProperty('--c', f.id === 'none' ? (comp ? comp.color : '#8fd0ff') : f.color);
        card.innerHTML = '<div class="mini-name">' + KUP.I18N.tv(f.name) + '</div>' +
          '<div class="mini-sub">' + KUP.I18N.tv(f.label) + '</div>';
        card.addEventListener('click', () => { KUP.Audio.sfx('select'); this.selectCompanionForm(f.id); });
        strip.appendChild(card);
      }
      this.selectCompanionForm(this.selectedCompanionForm);
    },
    selectCompanionForm(id) {
      this.selectedCompanionForm = id || 'none';
      KUP.META.setCompanionForm(this.selectedCompanionForm);
      const strip = this.els['companion-form-strip'];
      if (strip) for (const card of strip.children) card.classList.toggle('selected', card.dataset.id === this.selectedCompanionForm);
      const f = KUP.FORM(this.selectedCompanionForm);
      /* 同伴皮肤的出处行不再显示（同 selectForm，见该处说明） */
      this.els['companion-form-detail'].innerHTML = KUP.I18N.tv(f.desc);
    },
    /* 皮肤（形態）选择条 —— **同一屏**内按系列切换 + 横向滚动。
     * v0.13.5：全量形态有 45+ 条（花譜 17／狸眼 7／派流 8／世界 5／此処 4／共用 3／自创 1），
     * 一次铺开会变成"一墙卡"。于是：
     *   ① 一行**系列按钮**（默认选中该角色的本命系列，例如选化歩就停在「化歩」）；
     *   ② 下方只画**当前系列**的卡片，超出可横向滚动（「通常形態」永远在第一格）；
     *   ③ 「共用」「自创」「全部」各一个按钮——全部仍在一屏内，不需要进别的页面。
     * 魔女候補／同伴皮肤没有系列 ⇒ 不显示系列按钮，行为与以前一致。 */
    showFormStrip() {
      const strip = this.els['form-strip'];
      if (!strip) return;
      const c = this.selectedChar ? KUP.CHAR(this.selectedChar) : null;
      const kind = c ? KUP.charKind(c) : 'witch';
      const list = KUP.formsFor(kind, c ? c.id : null);
      if (!list.some(f => f.id === this.selectedForm)) {
        this.selectedForm = 'none';
        KUP.META.setForm('none');
      }
      const groups = KUP.formGroups(kind, c ? c.id : null);
      /* 当前显示的系列：默认＝本命系列（第一组）；角色/类型一变就重新落到第一组 */
      if (this.formGroupKey && !groups.some(g => g.key === this.formGroupKey)) this.formGroupKey = null;
      if (!this.formGroupKey) this.formGroupKey = groups.length ? groups[0].key : null;
      const chips = this.els['form-chips'];
      if (chips) {
        chips.innerHTML = '';
        const showChips = groups.length > 1;          // 只有一组时不必显示按钮
        chips.classList.toggle('hidden', !showChips);
        if (showChips) {
          const mk = (key, text) => {
            const b = document.createElement('button');
            b.className = 'chip' + (this.formGroupKey === key ? ' on' : '');
            b.textContent = text;
            b.addEventListener('click', () => {
              KUP.Audio.sfx('select');
              this.formGroupKey = key;
              this.showFormStrip();
            });
            chips.appendChild(b);
          };
          for (const g of groups) mk(g.key, KUP.I18N.tv(g.short || g.name) + ' ' + g.forms.length);
          mk('__all', KUP.I18N.t('form.all') + ' ' + list.length);
        }
      }
      const cur = this.formGroupKey === '__all' ? list
        : (groups.find(g => g.key === this.formGroupKey) || { forms: list }).forms;
      strip.innerHTML = '';
      if (this.els['form-title']) {
        this.els['form-title'].textContent = c
          ? KUP.I18N.t(kind === 'recruit' ? 'form.title.recruit' : 'form.title.witch', { name: KUP.shortOf(c) })
          : KUP.I18N.t('form.title');
      }
      /* 通常形態永远在第一格（不属于任何系列） */
      const ordered = [KUP.FORM('none')].concat(cur.filter(f => f.id !== 'none'));
      for (const f of ordered) {
        const isNone = f.id === 'none';
        const card = document.createElement('div');
        card.className = 'mini-card' + (this.selectedForm === f.id ? ' selected' : '');
        card.dataset.id = f.id;
        card.style.setProperty('--c', isNone ? (c ? c.color : '#7a7398') : f.color);
        card.innerHTML = '<div class="mini-name">' + KUP.I18N.tv(f.name) + '</div>' +
          (isNone ? '<div class="mini-sub">' + KUP.I18N.tv(f.label) + '</div>' : '');
        card.addEventListener('click', () => { KUP.Audio.sfx('select'); this.selectForm(f.id); });
        strip.appendChild(card);
      }
      this.selectForm(this.selectedForm);
    },
    selectForm(id) {
      this.selectedForm = id || 'none';
      KUP.META.setForm(this.selectedForm);
      const strip = this.els['form-strip'];
      if (strip) for (const card of strip.children) card.classList.toggle('selected', card.dataset.id === this.selectedForm);
      const f = KUP.FORM(this.selectedForm);
      /* ★ 2026-10：**形態的出处标注不再显示给玩家**（人类要求）。
       *   出处仍保存在数据层 `f.src`，并被 tools/verify-run.js 校验存在；
       *   玩家只看到形态名与效果。需要恢复时取消下一行注释即可：
       * this.els['form-detail'].innerHTML = KUP.I18N.tv(f.desc) + '<br><span class="area-src">' + (f.src ? KUP.I18N.tv(f.src) : '') + '</span>';
       */
      this.els['form-detail'].innerHTML = KUP.I18N.tv(f.desc);
    },
    selectChar(id) {
      /* 未招募的角色不可选用 */
      if (id && !KUP.META.isCharUnlocked(id)) id = null;
      this.selectedChar = id || null;
      this.formGroupKey = null;          // v0.13.5：换角色 → 皮肤栏回到该角色的本命系列
      const cards = this.els['char-cards'].children;
      for (const card of cards) card.classList.toggle('selected', card.dataset.id === id);
      $('btn-depart').disabled = !id;
      const c = KUP.CHARS.find(x => x.id === id);
      this.els['char-detail'].innerHTML = c
        ? KUP.I18N.tv(c.desc) + '<br><span class="detail-weapon">' + KUP.I18N.t('select.detail', {
            w: KUP.I18N.tv(KUP.WEAPONS[c.weapon].name),
            hp: c.stats.hp, sp: c.stats.speed, dmg: c.stats.dmg }) + '</span>'
        : KUP.I18N.t('select.default');
      this.showFormStrip(); // 皮肤条随角色类型（魔女之子／魔女候補）变化
    },

    /* ---------- 升级 ---------- */
    showLevelUp(choices, level) {
      this.showScreen('screen-levelup');
      this.showHUD(true);
      this.els['lu-lv'].textContent = 'Lv ' + level;
      const wrap = this.els['lu-cards'];
      wrap.innerHTML = '';
      choices.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'lu-card';
        let tag, tagCls, name, desc, lvline, col = '#8fd0ff';
        if (c.kind === 'awaken') {
          // 覚醒 ★（REGENERATE「魔女の娘へと覚醒する場面」）
          const def = KUP.WEAPONS[c.id];
          col = def.color;
          tag = KUP.I18N.t('lu.tag.awaken'); tagCls = 'awaken';
          name = KUP.I18N.tv(def.evolved.name); desc = KUP.I18N.tv(def.evolved.desc);
          lvline = KUP.I18N.t('lu.lvline.awaken');
        } else if (c.kind === 'weapon-up' || c.kind === 'weapon-new') {
          const def = KUP.WEAPONS[c.id];
          col = def.color;
          if (c.kind === 'weapon-new') {
            tag = KUP.I18N.t('lu.tag.wnew'); tagCls = 'new';
            name = KUP.I18N.tv(def.name); desc = KUP.I18N.tv(def.desc);
            lvline = KUP.I18N.t('lu.lvline.new');
          } else {
            const cur = this.game.player.weapons.find(w => w.def.id === c.id).lv;
            tag = KUP.I18N.t('lu.tag.wup'); tagCls = 'up';
            name = KUP.I18N.tv(def.name); desc = KUP.I18N.tv(def.lvDesc[cur]);
            lvline = KUP.I18N.t('lu.lvline.up', { from: cur, to: cur + 1 });
          }
        } else if (c.kind === 'item') {
          /* 局内道具（v0.8）：护盾／MISS／回血——独立于被动槽，可重复选 */
          const def = KUP.ITEMS[c.id];
          col = def.color || '#8fd0ff';
          tag = KUP.I18N.t('lu.tag.item'); tagCls = 'item';
          name = KUP.I18N.tv(def.name); desc = KUP.I18N.tv(def.desc);
          lvline = KUP.I18N.t('lu.item.line');
        } else if (c.kind === 'passive-up' || c.kind === 'passive-new') {
          const def = KUP.PASSIVES[c.id];
          const cur = this.game.player.passives[c.id] || 0;
          col = def.color || '#8affc9';
          tag = KUP.I18N.t(c.kind === 'passive-new' ? 'lu.tag.pnew' : 'lu.tag.pup');
          tagCls = (c.kind === 'passive-new') ? 'new' : 'up';
          name = KUP.I18N.tv(def.name); desc = KUP.I18N.tv(def.desc);
          lvline = cur ? KUP.I18N.t('lu.lvline.up', { from: cur, to: cur + 1 }) : KUP.I18N.t('lu.lvline.new');
        } else {
          tag = KUP.I18N.t('lu.tag.heal'); tagCls = 'heal'; col = '#ff9ab5';
          name = KUP.I18N.t('lu.heal.name'); desc = KUP.I18N.t('lu.heal.desc'); lvline = '—';
        }
        card.style.setProperty('--c', col);
        card.innerHTML =
          (c.id ? '<button class="lu-ban" title="' + KUP.I18N.t('lu.banTip') + '">✕</button>' : '') +
          '<div class="lu-tag ' + tagCls + '">' + tag + '</div>' +
          '<div class="lu-name">' + name + '</div>' +
          '<div class="lu-desc">' + desc + '</div>' +
          '<div class="lu-lvline">' + lvline + '</div>' +
          '<div class="lu-num">' + (i + 1) + '</div>';
        card.addEventListener('click', () => {
          if (this.game.banMode) this.game.banChoice(i); else this.game.choose(i);
        });
        /* 封禁按钮（v0.10）：阻止冒泡，避免同时触发选择 */
        const banBtn = card.querySelector('.lu-ban');
        if (banBtn) banBtn.addEventListener('click', ev => {
          ev.stopPropagation();
          this.game.banChoice(i);
        });
        wrap.appendChild(card);
      });
      this.refreshLevelUpBar();
    },

    /* 升级屏底部：重掷次数 / 封禁模式提示（v0.10） */
    refreshLevelUpBar() {
      const g = this.game;
      if (this.els['reroll-n']) this.els['reroll-n'].textContent = Math.max(0, g.rerolls | 0);
      if (this.els['btn-reroll']) this.els['btn-reroll'].disabled = !(g.rerolls > 0);
      if (this.els['btn-banmode']) this.els['btn-banmode'].classList.toggle('armed', !!g.banMode);
      const luScreen = document.getElementById('screen-levelup');
      if (luScreen) luScreen.classList.toggle('banmode', !!g.banMode);
      if (this.els['lu-hint']) {
        this.els['lu-hint'].textContent = g.banMode
          ? KUP.I18N.t('lu.hintBan')
          : KUP.I18N.t('lu.hint');
      }
    },
    toggleBanMode() {
      const g = this.game;
      g.banMode = !g.banMode;
      this.refreshLevelUpBar();
      KUP.Audio.sfx('select');
      return g.banMode;
    },

    /* ---------- 横幅 ---------- */
    banner(text, dur, cls) {
      const b = this.els.banner;
      b.textContent = text;
      b.className = cls || '';
      b.classList.remove('hidden');
      b.style.animation = 'none';
      void b.offsetWidth;
      b.style.animation = '';
      clearTimeout(this._bannerT);
      this._bannerT = setTimeout(() => b.classList.add('hidden'), (dur || 2) * 1000);
    },

    /* ---------- Boss 条 ---------- */
    showBoss(on, def) {
      const b = def || (KUP.game && KUP.game.boss ? KUP.game.boss.def : KUP.ENEMIES.boss);
      this.els['boss-wrap'].classList.toggle('hidden', !on);
      if (on) this.els['boss-name'].textContent = KUP.I18N.tv(b.name);
    },
    updateBoss(boss) {
      if (!boss || boss.dead) return;
      this.els['boss-bar'].style.width = Math.max(0, boss.hp / boss.maxhp * 100).toFixed(1) + '%';
    },

    /* ---------- HUD ---------- */
    updateHUD(g) {
      const p = g.player;
      if (!p) return;
      const hpRatio = p.hp / p.maxhp;
      const bar = this.els['hp-bar'];
      bar.style.width = (hpRatio * 100).toFixed(1) + '%';
      bar.classList.toggle('low', hpRatio < 0.35);
      this.els['hp-text'].textContent = Math.ceil(p.hp) + '/' + p.maxhp;
      this.els['lv-num'].textContent = g.level;
      this.els['timer'].textContent = U.formatTime(g.time);
      this.els['kills'].textContent = KUP.I18N.t('hud.kills', { n: g.kills });
      this.els['xp-bar-fill'].style.width = Math.min(100, g.xp / KUP.XP_NEXT(g.level) * 100).toFixed(1) + '%';
      // 浄化の歌充能条（第2話副标题 ★）
      if (this.els['ult-wrap'] && this.els['ult-fill']) {
        const ready = g.ult.charge >= 100;
        this.els['ult-wrap'].classList.toggle('ready', ready);
        this.els['ult-fill'].style.width = g.ult.charge.toFixed(0) + '%';
      }
      // 武器图标（仅变化时重建；觉醒显示 ★）
      const sig = p.weapons.map(w => w.def.id + (w.evolved ? 'E' : '') + w.lv).join(',');
      if (sig !== this.lastWeaponSig) {
        this.lastWeaponSig = sig;
        const row = this.els['weapon-row'];
        row.innerHTML = '';
        for (const w of p.weapons) {
          const d = document.createElement('div');
          d.className = 'w-icon' + (w.evolved ? ' evolved' : '');
          d.style.setProperty('--c', w.def.color);
          d.title = KUP.I18N.tv(w.evolved ? w.def.evolved.name : w.def.name) + (w.evolved ? ' ★' : ' Lv' + w.lv);
          let pips = '';
          const lv = w.evolved ? 5 : w.lv;
          for (let i = 1; i <= 5; i++) pips += '<i class="' + (i <= lv ? 'on' : '') + '"></i>';
          d.innerHTML = w.def.icon + (w.evolved ? '<b class="e">★</b>' : '') + '<div class="pips">' + pips + '</div>';
          row.appendChild(d);
        }
      }
      /* ---- v0.8 生存机制 HUD：护盾条 / 冲刺充能 / 敌袭警告 ---- */
      if (this.els['shield-bar']) {
        const sk = p.shieldMax > 0 ? Math.max(0, p.shield / p.shieldMax) : 0;
        this.els['shield-bar'].style.width = (sk * 100).toFixed(1) + '%';
        this.els['shield-bar'].classList.toggle('on', p.shield > 0);
      }
      if (this.els['shield-num']) {
        this.els['shield-num'].textContent = p.shieldMax > 0 ? '🛡 ' + Math.ceil(p.shield) + '/' + p.shieldMax : '';
      }
      if (this.els['dash-pips']) {
        const dsig = p.dashCharge + '/' + p.dashMax;
        if (dsig !== this.lastDashSig) {
          this.lastDashSig = dsig;
          let h = '';
          for (let i = 0; i < p.dashMax; i++) h += '<i class="' + (i < p.dashCharge ? 'on' : '') + '"></i>';
          this.els['dash-pips'].innerHTML = '<span class="dl">»</span>' + h;
        }
      }
      if (this.els['danger-warn']) {
        const show = !!g.dangerNear && g.state === 'playing';
        this.els['danger-warn'].classList.toggle('hidden', !show);
      }
      /* 局内道具 BUFF（MISS／回血／磁石）剩余时间 */
      if (this.els['buff-row']) {
        const b = p.buffs || { miss: 0, regen: 0, magnet: 0 };
        const bsig = Math.ceil(b.miss) + '/' + Math.ceil(b.regen) + '/' + Math.ceil(b.magnet || 0);
        if (bsig !== this.lastBuffSig) {
          this.lastBuffSig = bsig;
          let h = '';
          if (b.miss > 0) h += '<span class="buff b-miss">避 ' + Math.ceil(b.miss) + 's</span>';
          if (b.regen > 0) h += '<span class="buff b-regen">潤 ' + Math.ceil(b.regen) + 's</span>';
          if (b.magnet > 0) h += '<span class="buff b-magnet">磁 ' + Math.ceil(b.magnet) + 's</span>';
          this.els['buff-row'].innerHTML = h;
        }
      }
      /* 瞄准模式指示（自动／鼠标／移动） */
      if (this.els['btn-aim']) {
        const mode = p.aimMode || g.run.aim || 'auto';
        if (mode !== this.lastAimSig) {
          this.lastAimSig = mode;
          this.els['btn-aim'].textContent = mode === 'mouse' ? '✛' : (mode === 'move' ? '➙' : '◎');
          this.els['btn-aim'].title = KUP.I18N.t('hud.aimBtn') + ' · ' + KUP.I18N.t('aim.' + mode);
        }
      }
      // 危险红晕（低血 或 敌袭预警贴近）
      this.els.danger.style.opacity =
        (g.state === 'playing' && (hpRatio < 0.3 || g.dangerNear))
          ? (0.3 + 0.18 * Math.sin(performance.now() / 180)).toFixed(2) : 0;      // 同伴（同行支援）标识
      if (this.els['hud-companion']) {
        /* v0.13.3：HUD 改显示「支援物品」（同伴层暂不登场；旧存档里若确有同伴则仍优先显示） */
        const comp = g.recruit;
        const sup = g.support;
        this.els['hud-companion'].textContent = comp
          ? KUP.I18N.t('hud.companion', { name: KUP.nameOf(comp) })
          : (sup ? KUP.I18N.t('hud.support', { name: KUP.I18N.tv(sup.name) }) : '');
        this.els['hud-companion'].style.opacity = (comp || sup) ? 1 : 0;
      }
      /* v0.13 治安战：HUD 常驻波次（WAVE N） */
      if (this.els['hud-wave']) {
        const on = !!g.endless;
        this.els['hud-wave'].classList.toggle('hidden', !on);
        if (on) {
          const n = g.orderWave || 1;
          if (n !== this._waveSig) { this._waveSig = n; this.els['hud-wave'].textContent = KUP.I18N.t('hud.wave', { n }); }
        }
      }
    },

    /* ---------- 结算（含復興率 ★★ 与结局分歧；v0.13 治安战：只写「战斗结束」） ---------- */
    showEnd(win, st) {
      this.showBoss(false);
      this.showScreen(win ? 'screen-victory' : 'screen-over');
      this.showHUD(true);
      const order = !!(this.game.area && this.game.area.endless) || !!st.order;
      /* 治安战：失败屏不写「败北」，改写「战斗结束」+ 成绩（需求：不写失败） */
      if (order && !win) {
        const t = document.querySelector('#screen-over .end-title');
        const s = document.querySelector('#screen-over .end-sub');
        if (t) { t.textContent = KUP.I18N.t('end.order.title'); t.classList.add('order'); }
        if (s) s.textContent = KUP.I18N.t('end.order.sub');
        const rb = $('btn-retry');
        if (rb) rb.textContent = KUP.I18N.t('end.order.retry');
      }
      // 胜利副标题：暴走后击破 → 惨胜分歧（REGENERATE「戦闘結果也会改变故事」）
      if (this.els['win-sub'] && win) {
        this.els['win-sub'].textContent = st.bossEnraged
          ? KUP.I18N.t('end.win.sub.pyrrhic')
          : KUP.I18N.t('end.win.sub');
      }
      const meta = this.game.metaResult;
      let html =
        '<div class="stat"><b>' + U.formatTime(st.time) + '</b><span>' + KUP.I18N.t('end.stat.time') + '</span></div>' +
        '<div class="stat"><b>' + st.kills + '</b><span>' + KUP.I18N.t('end.stat.kills') + '</span></div>' +
        '<div class="stat"><b>' + st.level + '</b><span>' + KUP.I18N.t('end.stat.level') + '</span></div>' +
        '<div class="stat"><b>' + st.witch + '</b><span>' + KUP.I18N.t('end.stat.witch') + '</span></div>' +
        '<div class="stat"><b>🥚 ' + (st.eggs || 0) + '</b><span>' + KUP.I18N.t('end.stat.eggs') + '</span></div>';
      /* 治安战：以「波次 + 点数」为主成绩（🧮 换掉卵的权重） */
      if (order) {
        html = '<div class="stat"><b>' + U.formatTime(st.time) + '</b><span>' + KUP.I18N.t('end.stat.time') + '</span></div>' +
          '<div class="stat"><b>WAVE ' + (st.wave || 1) + '</b><span>' + KUP.I18N.t('end.stat.wave') + '</span></div>' +
          '<div class="stat"><b>' + st.kills + '</b><span>' + KUP.I18N.t('end.stat.kills') + '</span></div>' +
          '<div class="stat"><b>' + (st.score || 0) + '</b><span>' + KUP.I18N.t('end.stat.score') + '</span></div>' +
          '<div class="stat"><b>' + st.witch + '</b><span>' + KUP.I18N.t('end.stat.witch') + '</span></div>';
      }
      /* 形態/皮肤与同伴（结算时确认本局配置） */
      if (st.formLabel && st.form !== 'none') {
        html += '<div class="stat"><b>' + st.formLabel + '</b><span>' + KUP.I18N.t('end.stat.form') + '</span></div>';
      }
      if (st.companion) {
        const skin = st.companionForm !== 'none' ? '（' + st.companionFormLabel + '）' : '';
        html += '<div class="stat"><b>' + st.companion + skin + '</b><span>' + KUP.I18N.t('end.stat.companion') + '</span></div>';
      }
      const holder = win ? this.els['win-stats'] : this.els['over-stats'];
      holder.innerHTML = html;
      // 復興率结算行（協奏中 ★★）／治安战成绩行（v0.13：**只记治安战成绩**）
      if (meta && meta.order) {
        const ob = KUP.META.orderBest() || { score: meta.score, wave: st.wave, time: st.time };
        let line = '<div class="fukkou-gain">' + KUP.I18N.t('end.order.best',
          { score: ob.score, wave: ob.wave, time: U.formatTime(ob.time || 0) }) + '</div>';
        if (meta.isBest) line += '<div class="new-record">' + KUP.I18N.t('end.order.newBest') + '</div>';
        if (meta.tickets) {
          line += '<div class="ticket-gain">🎫 ' + KUP.I18N.t('end.tickets', { n: meta.tickets, t: meta.ticketsTotal }) + '</div>';
        }
        holder.innerHTML += line;
        this.updateMetaUI();
        this.showBest();
        this.updateSaveHealth();
        return;                       // 治安战不写番街 best、不显示記憶の卵解锁
      }
      if (meta) {
        let line = '<div class="fukkou-gain">▲ ' + KUP.I18N.t('end.fukkou', { n: meta.gain, t: meta.total }) + '</div>';
        if (meta.newlyUnlocked && meta.newlyUnlocked.length) {
          line += '<div class="fukkou-unlock">' + KUP.I18N.t('end.unlocked', { area: meta.newlyUnlocked.join(' / ') }) + '</div>';
        }
        if (meta.newRecruits && meta.newRecruits.length) {
          line += '<div class="fukkou-unlock">' + KUP.I18N.t('end.recruited', { name: meta.newRecruits.join(' / ') }) + '</div>';
        }
        if (meta.newlyRecruitable && meta.newlyRecruitable.length) {
          line += '<div class="fukkou-unlock">' + KUP.I18N.t('end.recruitable', { name: meta.newlyRecruitable.join(' / ') }) + '</div>';
        }
        /* 市民票收入（瓦利斯的局外货币） */
        if (meta.tickets) {
          line += '<div class="ticket-gain">🎫 ' + KUP.I18N.t('end.tickets', { n: meta.tickets, t: meta.ticketsTotal }) + '</div>';
        }
        holder.innerHTML += line;
        this.updateMetaUI();
      }
      // 最佳记录：交给存档层判定与写入（随当前槽位走，数字已归一化）
      const isRecord = KUP.META.submitBest({
        win: win, time: st.time, kills: st.kills, level: st.level, witch: st.witch, area: st.area,
      });
      if (isRecord) holder.innerHTML += '<div class="new-record">★ NEW RECORD</div>';
      // 解锁的记忆片段提示
      const frag = this.game.fragUnlocked;
      if (frag) {
        holder.innerHTML += '<div class="frag-unlock">🥚 ' + KUP.I18N.t('end.frag', { t: KUP.I18N.tv(frag.title) }) + '</div>';
      }
      this.updateSaveHealth();     // 若结算落盘失败（配额/privacy），立刻让玩家看到
    },
    showBest() {
      const rec = KUP.META.best();
      this.els['best-line'].textContent = rec
        ? KUP.I18N.t('menu.best', {
            result: rec.win ? KUP.I18N.t('win.word') : KUP.I18N.t('alive.word'),
            time: U.formatTime(rec.time || 0),
            kills: rec.kills || 0,
            witch: rec.witch ? ' · ' + rec.witch : '' })
        : KUP.I18N.t('menu.best.none');
      /* v0.13 治安战最高记录：与番街 best 分开显示（最高成绩只记治安战自己的） */
      if (this.els['order-best-line']) {
        const ob = KUP.META.orderBest();
        this.els['order-best-line'].textContent = ob
          ? KUP.I18N.t('menu.orderBest', {
              score: ob.score, wave: ob.wave, time: U.formatTime(ob.time || 0), kills: ob.kills || 0 })
          : KUP.I18N.t('menu.orderBest.none');
        this.els['order-best-line'].classList.toggle('has-record', !!ob);
      }
      this.updateMetaUI();
    },
  };

  KUP.UI = UI;
})();
