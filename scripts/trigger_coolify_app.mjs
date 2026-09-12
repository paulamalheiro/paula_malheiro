import https from 'https';

const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';
const deployPath = '/api/v1/deploy?uuid=p10i63vuzaejlphawq5hgs42&force=false';

async function triggerCoolify() {
  console.log('Disparando deploy em app.janagencia.com.br...');

  return new Promise((resolve) => {
    const req = https.request({
      hostname: '2.24.99.187',
      port: 443,
      path: deployPath,
      method: 'POST',
      servername: 'app.janagencia.com.br',
      headers: {
        'Host': 'app.janagencia.com.br',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      rejectUnauthorized: false,
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log('HTTP Status:', res.statusCode);
        console.log('Response:', data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição:', e.message);
      resolve({ error: e.message });
    });

    req.write(JSON.stringify({}));
    req.end();
  });
}

triggerCoolify();
