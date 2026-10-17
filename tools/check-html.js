/* 结构检查：index.html 的 div 平衡 */
const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const open = (s.match(/<div\b/g) || []).length;
const close = (s.match(/<\/div>/g) || []).length;
let d = 0, bad = false;
for (let i = 0; i < s.length; i++) {
  if (s.startsWith('<div', i)) d++;
  if (s.startsWith('</div>', i)) d--;
  if (d < 0) { bad = true; break; }
}
console.log('div open=' + open + ' close=' + close + ' depth=' + d + (bad ? ' (negative!)' : ''));
