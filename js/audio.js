window.KUP = window.KUP || {};

/* ================= WebAudio 音效 / 程序化 BGM ================= */
KUP.Audio = {
  ctx: null, master: null, sfxG: null, bgmG: null, noiseBuf: null,
  sfxOn: true, bgmOn: true, muted: false,
  _last: {}, _bgmTimer: null, _beat: 0, _nextNote: 0,

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._loadVol();
      this.master.connect(this.ctx.destination);
      this._loadFlags();                                             // 读回 BGM/SFX/静音 与音量
      this.master.gain.value = this.muted ? 0 : this._loadVol();
      this.sfxG = this.ctx.createGain(); this.sfxG.gain.value = 1;   this.sfxG.connect(this.master);
      this.bgmG = this.ctx.createGain(); this.bgmG.gain.value = 0.5; this.bgmG.connect(this.master);
      const len = (this.ctx.sampleRate * 0.5) | 0;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  /* 音量/BGM/SFX/静音属于**全局设置**（跨槽位共享），统一走 KUP.STORE.settings */
  _settings() { return (KUP.STORE && KUP.STORE.settings) || null; },
  _loadVol() {
    const s = this._settings();
    if (!s) return 0.7;
    const v = parseFloat(s.get('vol'));
    return isNaN(v) ? 0.7 : v;
  },
  /* 首次 init 时把持久化的开关读回内存（原先 bgm/sfx/muted 只活在内存里，刷新即丢） */
  _loadFlags() {
    const s = this._settings();
    if (!s) return;
    this.bgmOn = s.get('bgm') !== false;
    this.sfxOn = s.get('sfx') !== false;
    this.muted = s.get('muted') === true;
    if (this.master) this.master.gain.value = this.muted ? 0 : this._loadVol();
  },
  setVol(v) {
    if (this.master) this.master.gain.value = this.muted ? 0 : v;
    const s = this._settings();
    if (s) s.set({ vol: Math.max(0, Math.min(1, v)) });   // 拖动滑块 → 合并写，页面隐藏时强制落盘
  },
  setFlag(field, on) {
    this[field] = !!on;
    const s = this._settings();
    if (s) s.set({ [field]: !!on }, { now: true });
  },

  /* 单音：振荡器 + 指数衰减包络 */
  tone(freq, dur, type, vol, slideTo, dest, when) {
    if (!this.ctx) return;
    const t = when !== undefined ? when : this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, freq), t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noiseAt(dur, vol, filterType, freq, when, dest) {
    if (!this.ctx || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    f.type = filterType; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    src.start(when); src.stop(when + dur);
  },

  /* 游戏音效（带节流） */
  sfx(name) {
    if (!this.ctx || !this.sfxOn || this.muted) return;
    const now = performance.now();
    if (this._last[name] && now - this._last[name] < 45) return;
    this._last[name] = now;
    const T = this.ctx.currentTime;
    switch (name) {
      case 'shoot':  this.tone(560, 0.06, 'triangle', 0.05, 300); break;
      case 'laser':  this.tone(1100, 0.1, 'sawtooth', 0.05, 380); break;
      case 'hit':    this.tone(190, 0.05, 'square', 0.04, 120); break;
      case 'pickup': this.tone(760, 0.08, 'sine', 0.05, 1200); break;
      case 'heal':   this.tone(520, 0.14, 'sine', 0.09, 820); break;
      case 'hurt':   this.tone(140, 0.22, 'sawtooth', 0.14, 55); break;
      case 'boom':
        this.tone(90, 0.35, 'sine', 0.2, 30);
        this.noiseAt(0.18, 0.1, 'lowpass', 900, T);
        break;
      case 'boss':
        this.tone(60, 0.9, 'sawtooth', 0.22, 38);
        this.noiseAt(0.6, 0.12, 'lowpass', 500, T);
        break;
      case 'levelup':
        [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.12, null, this.sfxG, T + i * 0.09));
        break;
      case 'select': this.tone(660, 0.06, 'sine', 0.07); break;
      case 'warning':
        this.tone(880, 0.12, 'square', 0.08, null, this.sfxG, T);
        this.tone(880, 0.12, 'square', 0.08, null, this.sfxG, T + 0.2);
        break;
      case 'egg': // 記憶の卵：清脆二音
        this.tone(880, 0.1, 'sine', 0.09, 1320);
        this.tone(1320, 0.16, 'sine', 0.07, 1760, this.sfxG, T + 0.09);
        break;
      case 'awaken': // 覚醒：上行琶音
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.13, null, this.sfxG, T + i * 0.1));
        break;
      case 'ult': // 浄化の歌：大和弦 + 噪声扫频
        [261.63, 329.63, 392.0, 523.25].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.1, null, this.sfxG, T + i * 0.05));
        this.noiseAt(0.8, 0.09, 'highpass', 1800, T);
        this.tone(110, 0.8, 'sine', 0.18, 55);
        break;
    }
  },

  /* ---------- 程序化 BGM：小调琶音 + 底鼓（A 小调 i-VI-III-VII） ---------- */
  startBGM() {
    if (!this.ctx || !this.bgmOn || this._bgmTimer) return;
    this._beat = 0;
    this._nextNote = this.ctx.currentTime + 0.1;
    this._bgmTimer = setInterval(() => this._schedule(), 90);
  },
  stopBGM() {
    if (this._bgmTimer) { clearInterval(this._bgmTimer); this._bgmTimer = null; }
  },
  _schedule() {
    if (!this.ctx) return;
    const EIGHTH = 0.326; // ≈92BPM 十六分之八
    while (this._nextNote < this.ctx.currentTime + 0.28) {
      this._playBeat(this._beat, this._nextNote);
      this._beat++;
      this._nextNote += EIGHTH;
    }
  },
  _playBeat(b, when) {
    if (!this.bgmOn || this.muted) return;
    const chords = [
      [220.0, 261.63, 329.63],   // Am
      [174.61, 220.0, 261.63],   // F
      [130.81, 164.81, 196.0],   // C
      [196.0, 246.94, 293.66],   // G
    ];
    const chord = chords[(b >> 3) % chords.length];
    const seq = [0, 1, 2, 1, 0, 2, 1, 2];
    const f = chord[seq[b % 8]] * ((b % 16) >= 8 ? 2 : 1);
    this.tone(f, 0.26, 'triangle', 0.09, null, this.bgmG, when);
    if (b % 2 === 0) this.tone(100, 0.16, 'sine', 0.2, 38, this.bgmG, when);       // 底鼓
    if (b % 4 === 2) this.noiseAt(0.05, 0.025, 'highpass', 6000, when, this.bgmG); // 镲
  },
};
