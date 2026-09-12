import https from 'https';
import http from 'http';

const candidateHosts = [
  'coolify.janagencia.com.br',
  'panel.janagencia.com.br',
  'vps.janagencia.com.br',
  'admin.janagencia.com.br',
  'cloud.janagencia.com.br',
  'cp.janagencia.com.br',
  'flowjan.cloud',
  'app.flowjan.cloud',
  'coolify.flowjan.cloud',
  '2.24.99.187',
];

async function probeHttps(host) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: '2.24.99.187',
      port: 443,
      path: '/api/v1/servers',
      method: 'GET',
      headers: {
        'Host': host,
        'Authorization': 'Bearer 10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791',
        'User-Agent': 'Mozilla/5.0'
      },
      rejectUnauthorized: false,
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ host, port: 443, status: res.statusCode, title: data.slice(0, 100) }));
    });
    req.on('error', e => resolve({ host, port: 443, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ host, port: 443, error: 'timeout' }); });
    req.end();
  });
}

async function probePort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '2.24.99.187',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve({ port, status: res.statusCode, headers: res.headers });
    });
    req.on('error', e => resolve({ port, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ port, error: 'timeout' }); });
    req.end();
  });
}

async function main() {
  console.log('--- PROBING PORTS ---');
  for (const p of [8000, 3000, 8080, 9000]) {
    console.log(await probePort(p));
  }

  console.log('\n--- PROBING HOSTS ON 443 ---');
  for (const h of candidateHosts) {
    const res = await probeHttps(h);
    if (!res.error || res.status) {
      console.log(res);
    }
  }
}

main();
