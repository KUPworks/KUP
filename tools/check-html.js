/* 结构检查（v0.19 起兼数据层清单核对）：
 *   1. index.html 的 div 平衡；
 *   2. js/data/ 的 <script> 是否与 js/data/manifest.js 完全一致、顺序相同；
 *   3. 是否还残留旧的单文件 js/data.js。
 * 用法：node tools/check-html.js（从仓库根运行；失败时退出码 1） */
const fs = require('fs');
const path = require('path');
const s = fs.readFileSync('index.html', 'utf8');

/* ---------- 1. div 平衡 ---------- */
const open = (s.match(/<div\b/g) || []).length;
const close = (s.match(/<\/div>/g) || []).length;
let d = 0, bad = false;
for (let i = 0; i < s.length; i++) {
  if (s.startsWith('<div', i)) d++;
  if (s.startsWith('</div>', i)) d--;
  if (d < 0) { bad = true; break; }
}
console.log('div open=' + open + ' close=' + close + ' depth=' + d + (bad ? ' (negative!)' : ''));

/* ---------- 2. 数据层清单 ↔ index.html ---------- */
const DATA_FILES = ['js/data/manifest.js'].concat(require(path.join(__dirname, '..', 'js', 'data', 'manifest.js')));
const missing = [], outOfOrder = [];
let last = -1;
for (const f of DATA_FILES) {
  const at = s.indexOf('src="' + f + '?');
  if (at < 0) { missing.push(f); continue; }
  if (at < last) outOfOrder.push(f);
  last = at;
}
console.log('data scripts ' + (DATA_FILES.length - missing.length) + '/' + DATA_FILES.length +
  (missing.length ? ' missing=' + missing.join(',') : '') +
  (outOfOrder.length ? ' out-of-order=' + outOfOrder.join(',') : ''));
if (missing.length || outOfOrder.length) bad = true;

/* ---------- 3. 旧单文件不得残留 ---------- */
if (/src="js\/data\.js[\?"]/.test(s)) {
  console.log('legacy <script src="js/data.js"> still present');
  bad = true;
}

if (bad) process.exitCode = 1;
