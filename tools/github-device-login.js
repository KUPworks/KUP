/* GitHub OAuth 设备码登录（Node 自带 OpenSSL，绕开被沙箱拦截的 SChannel）
 *
 * 用法：
 *   node github-device-login.js [--resume] [--proxy=http://127.0.0.1:7890] [--no-proxy]
 *
 * 为什么需要代理：github.com 的直连 IP 会间歇性 ETIMEDOUT，走本机 Clash(7890) 稳定且快 10 倍。
 * 特性：请求自动重试；device_code 落盘以支持断点续传（授权后无需再让用户输一次码）。
 * 本文件入库于 tools/；设备码状态写入 tmp/（被 .gitignore 忽略，不参与版本控制）。
 */
const https = require('https');
const tls = require('tls');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const CLIENT_ID = '178c6fc778ccc68e1d6a'; // GitHub CLI 的公开 client_id（官方设备码流程）
const SCOPE = 'repo';
const STATE = path.join(__dirname, '..', 'tmp', 'device-code.json');

const argv = process.argv.slice(2);
const resume = argv.includes('--resume');
const noProxy = argv.includes('--no-proxy');
const proxyArg = argv.find((a) => a.startsWith('--proxy='));
const PROXY = noProxy ? null : new URL(proxyArg ? proxyArg.split('=')[1] : 'http://127.0.0.1:7890');

/* 通过 HTTP 代理建 CONNECT 隧道，再在其上做 TLS —— Node 不读系统代理，必须手动实现 */
function connectTunnel(proxy, targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(Number(proxy.port || 80), proxy.hostname);
    sock.setTimeout(10000, () => sock.destroy(new Error('代理连接超时')));
    sock.once('error', reject);
    sock.once('connect', () => {
      sock.setTimeout(0);
      sock.write('CONNECT ' + targetHost + ':' + targetPort + ' HTTP/1.1\r\nHost: ' + targetHost + ':' + targetPort + '\r\n\r\n');
      let buf = '';
      const onData = (d) => {
        buf += d.toString('latin1');
        if (buf.includes('\r\n\r\n')) {
          sock.removeListener('data', onData);
          if (/^HTTP\/1\.[01] 200/.test(buf)) resolve(sock);
          else reject(new Error('代理拒绝 CONNECT: ' + buf.split('\r\n')[0]));
        }
      };
      sock.on('data', onData);
    });
  });
}

class ProxyAgent extends https.Agent {
  constructor(proxy) { super({ keepAlive: false }); this.proxy = proxy; }
  createConnection(options, cb) {
    connectTunnel(this.proxy, options.host, options.port || 443).then((sock) => {
      const t = tls.connect({ socket: sock, servername: options.host }, () => cb(null, t));
      t.on('error', cb);
    }, cb);
  }
}

function post(pathname, params, attempts = 6) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const tryOnce = (n) => {
      const req = https.request({
        hostname: 'github.com',
        port: 443,
        path: pathname,
        method: 'POST',
        agent: PROXY ? new ProxyAgent(PROXY) : undefined,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'kup-agent',
        },
      }, (res) => {
        let d = '';
        res.on('data', (c) => { d += c; });
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('bad json: ' + d)); }
        });
      });
      req.setTimeout(25000, () => req.destroy(new Error('socket timeout')));
      req.on('error', (e) => {
        if (n >= attempts) return reject(new Error('重试 ' + attempts + ' 次仍失败: ' + e.message));
        console.log('   [网络重试 ' + n + '/' + attempts + '] ' + e.message);
        setTimeout(() => tryOnce(n + 1), 2000 * n);
      });
      req.write(body);
      req.end();
    };
    tryOnce(1);
  });
}

(async () => {
  if (PROXY) console.log('经代理 ' + PROXY.href + ' 访问 github.com');

  let dc;
  if (resume && fs.existsSync(STATE)) {
    dc = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    console.log('复用已保存的设备码 USER_CODE=' + dc.user_code + '（无需重新授权）');
  } else {
    dc = await post('/login/device/code', { client_id: CLIENT_ID, scope: SCOPE });
    if (!dc.device_code) {
      console.error('ERROR ' + JSON.stringify(dc));
      process.exit(1);
    }
    dc.saved_at = Date.now();
    fs.writeFileSync(STATE, JSON.stringify(dc, null, 2));
    console.log('USER_CODE=' + dc.user_code);
    console.log('URL=' + dc.verification_uri);
    console.log('EXPIRES_IN=' + dc.expires_in + 's');
    console.log('--- 请在浏览器打开上面的 URL 并输入 USER_CODE ---');
  }

  const interval = (Number(dc.interval) || 5) + 1;
  const deadline = (dc.saved_at || Date.now()) + (Number(dc.expires_in) || 900) * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    const t = await post('/login/oauth/access_token', {
      client_id: CLIENT_ID,
      device_code: dc.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });
    if (t.access_token) {
      console.log('TOKEN=' + t.access_token);
      console.log('SCOPE_GRANTED=' + (t.scope || ''));
      fs.unlinkSync(STATE);
      process.exit(0);
    }
    if (t.error === 'authorization_pending' || t.error === 'slow_down') {
      console.log('... 等待授权中（剩 ' + Math.round((deadline - Date.now()) / 1000) + 's）');
      continue;
    }
    console.error('ERROR ' + t.error + ' ' + (t.error_description || ''));
    process.exit(2);
  }
  console.error('TIMEOUT 设备码已过期，请不带 --resume 重新运行');
  process.exit(3);
})().catch((e) => { console.error('FATAL ' + e.message); process.exit(4); });
