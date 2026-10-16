window.KUP = window.KUP || {};

/* ================= 工具函数 ================= */
KUP.U = {
  TAU: Math.PI * 2,
  /* 可替换的随机源：一局开始时注入 mulberry32(run.seed)，回菜单时复位为 Math.random。
   * 规则：**只能在模拟路径（update/director/碰撞/生成）中消费**，
   *       绝不可在 render/draw 中消费（渲染帧率会打乱随机流，破坏可复现性）。 */
  rng: Math.random,
  clamp: (v, a, b) => (v < a ? a : (v > b ? b : v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + KUP.U.rng() * (b - a),
  randInt: (a, b) => Math.floor(a + KUP.U.rng() * (b - a + 1)),
  pick: arr => arr[(KUP.U.rng() * arr.length) | 0],
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (KUP.U.rng() * (i + 1)) | 0;
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  },
  dist2: (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
  /* 点到线段的距离平方（用于「扫掠臂」判定：环绕音球／刀光等） */
  segDist2: (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    const cx = x1 + dx * t, cy = y1 + dy * t;
    const ex = px - cx, ey = py - cy;
    return ex * ex + ey * ey;
  },
  formatTime(s) {
    s = Math.max(0, Math.floor(s));
    const m = (s / 60) | 0, ss = s % 60;
    return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  },
  /* 加权随机 {id: weight} */
  weightedPick(types) {
    let total = 0;
    for (const k in types) total += types[k];
    let r = KUP.U.rng() * total;
    for (const k in types) { r -= types[k]; if (r <= 0) return k; }
    return Object.keys(types)[0];
  },
  /* 确定性随机（城市布景用） */
  mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  /* 确定性整数散列 → [0,1)。给「需要随机观感、但**不得消费随机流**」的场合用
   * （典型：渲染路径的故障抖动）——同一个 n 永远得到同一个值，
   * 因此同 seed、同时间刻度下的画面完全可复现，换刷新率也不会变。 */
  hash01(n) {
    let h = Math.imul(n | 0, 0x27D4EB2D);
    h = Math.imul(h ^ (h >>> 15), 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  },
  angDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); },
  /* 角度朝目标以 turn(rad/s) 旋转 */
  aimAngle(cur, target, turn, dt) {
    const d = KUP.U.angDiff(target, cur);
    return cur + KUP.U.clamp(d, -turn * dt, turn * dt);
  },
};
