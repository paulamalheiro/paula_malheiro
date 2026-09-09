import https from 'https';

const postData = JSON.stringify({ identity: 'mccley.1@gmail.com', password: '082025mccley' });

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: '2.24.99.187',
      port: 443,
      rejectUnauthorized: false,
      ...options,
      headers: {
        'Host': 'pb-paula.janagencia.com.br',
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  // 1. Superuser login
  const loginRes = await request({
    path: '/api/collections/_superusers/auth-with-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, postData);

  if (loginRes.status !== 200) {
    console.error('Superuser login failed:', loginRes);
    return;
  }

  const token = loginRes.body.token;
  console.log('✓ Superuser authenticated');

  // 2. Check if audit_logs exists
  const collsRes = await request({
    path: '/api/collections',
    method: 'GET',
    headers: { 'Authorization': token }
  });

  const exists = collsRes.body.items.some(c => c.name === 'audit_logs');
  if (exists) {
    console.log('✓ Collection audit_logs already exists');
    return;
  }

  // 3. Create audit_logs collection (PocketBase v0.23+ schema)
  const auditColl = {
    name: 'audit_logs',
    type: 'base',
    fields: [
      { name: 'action', type: 'text', required: true },
      { name: 'user_email', type: 'text', required: false },
      { name: 'details', type: 'text', required: false },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: null,
  };

  const createRes = await request({
    path: '/api/collections',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  }, JSON.stringify(auditColl));

  console.log('Create audit_logs response:', createRes.status, createRes.body);
}

run().catch(console.error);
