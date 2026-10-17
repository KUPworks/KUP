// 证据采集脚本（tools/research/，入库）：经本机 Clash 代理抓取日文维基原始 wikitext（字节级保真）
// 产出写入 tmp/wiki-evidence/（不入库）；整理后的证据稿在 docs/lore/research/wiki-ja-wikitext.md
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const path = require('path');

const PROXY = { host: '127.0.0.1', port: 7890 };
const UA = 'KUP-Research/1.0 (proofreading aid; contact kupworks@proton.me)';

function dechunk(buf) {
  const out = [];
  let i = 0;
  while (i < buf.length) {
    const nl = buf.indexOf('\r\n', i);
    if (nl < 0) break;
    const size = parseInt(buf.slice(i, nl).toString('latin1').split(';')[0], 16);
    if (!size) break;
    out.push(buf.slice(nl + 2, nl + 2 + size));
    i = nl + 2 + size + 2;
  }
  return Buffer.concat(out);
}

function viaProxy(targetUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const req = http.request({
      host: PROXY.host, port: PROXY.port, method: 'CONNECT',
      path: u.hostname + ':443', headers: { Host: u.hostname + ':443' },
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) return reject(new Error('CONNECT ' + res.statusCode));
      const t = tls.connect({ socket, servername: u.hostname }, () => {
        t.write(
          `GET ${u.pathname}${u.search} HTTP/1.1\r\n` +
          `Host: ${u.hostname}\r\n` +
          `User-Agent: ${UA}\r\n` +
          `Accept-Encoding: identity\r\n` +
          `Connection: close\r\n\r\n`
        );
      });
      const chunks = [];
      t.on('data', (c) => chunks.push(c));
      t.on('end', () => {
        const buf = Buffer.concat(chunks);
        const idx = buf.indexOf('\r\n\r\n');
        const head = buf.slice(0, idx).toString('latin1');
        let body = buf.slice(idx + 4);
        if (/transfer-encoding:\s*chunked/i.test(head)) body = dechunk(body);
        const status = parseInt(head.split(' ')[1], 10);
        resolve({ status, head, body });
      });
      t.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

const TITLE = '神椿市建設中。';
const T = encodeURIComponent(TITLE);
const BASE = 'https://ja.wikipedia.org';

(async () => {
  const revId = process.argv[2] || '110158846';

  // 1) 指定旧版本的原始 wikitext
  const old = await viaProxy(`${BASE}/w/index.php?title=${T}&oldid=${revId}&action=raw`);
  console.log('oldid raw status', old.status, 'bytes', old.body.length);

  // 2) 该 revid 的元信息
  const meta = await viaProxy(`${BASE}/w/api.php?action=query&prop=revisions&revids=${revId}&rvprop=ids|timestamp|user|comment&format=json`);
  console.log('meta', meta.status, meta.body.toString('utf8').slice(0, 800));

  // 3) 当前线上版本的原始 wikitext
  const cur = await viaProxy(`${BASE}/w/index.php?title=${T}&action=raw`);
  console.log('current raw status', cur.status, 'bytes', cur.body.length);

  // 4) 当前线上版本的 revid
  const curMeta = await viaProxy(`${BASE}/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp|user&rvlimit=1&titles=${T}&format=json`);
  console.log('curmeta', curMeta.status, curMeta.body.toString('utf8').slice(0, 800));

  const OUT = path.join(__dirname, '..', '..', 'tmp', 'wiki-evidence');
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'old.raw.txt'), old.body);
  fs.writeFileSync(path.join(OUT, 'cur.raw.txt'), cur.body);
  fs.writeFileSync(path.join(OUT, 'meta.json'), Buffer.concat([
    Buffer.from('--- revid meta ---\n'), meta.body, Buffer.from('\n--- current meta ---\n'), curMeta.body,
  ]));
  console.log('written to', OUT);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
