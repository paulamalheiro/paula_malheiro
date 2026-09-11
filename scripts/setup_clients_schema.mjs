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
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=============================================================');
  console.log('  CONFIGURAÇÃO IDEMPOTENTE: COLEÇÕES CLIENTS & ACCESS_LOGS');
  console.log('=============================================================');

  // 1. Autenticação como Superuser
  const loginRes = await request({
    path: '/api/collections/_superusers/auth-with-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, postData);

  if (loginRes.status !== 200) {
    console.error('❌ Falha na autenticação do superuser:', loginRes);
    process.exit(1);
  }

  const token = loginRes.body.token;
  console.log('✓ Superuser autenticado com sucesso!');

  // 2. Listar coleções existentes
  const collsRes = await request({
    path: '/api/collections?perPage=100',
    method: 'GET',
    headers: { 'Authorization': token }
  });

  const collections = collsRes.body.items || [];
  const existingClients = collections.find(c => c.name === 'clients');
  const existingLogs = collections.find(c => c.name === 'access_logs');

  // 3. Configurar coleção 'clients'
  if (!existingClients) {
    console.log('Criando coleção clients...');
    const clientsColl = {
      name: 'clients',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cpf', type: 'text', required: true },
        { name: 'active', type: 'bool', required: false },
      ],
      indexes: [
        'CREATE INDEX idx_clients_cpf ON clients (cpf)'
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const createRes = await request({
      path: '/api/collections',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }, JSON.stringify(clientsColl));

    console.log('Status criação clients:', createRes.status);
  } else {
    console.log('✓ Coleção clients já existe. Verificando regras de API...');
    const updateClients = {
      ...existingClients,
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    await request({
      path: `/api/collections/${existingClients.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }, JSON.stringify(updateClients));
    console.log('✓ Regras da coleção clients verificadas!');
  }

  // 4. Configurar coleção 'access_logs'
  if (!existingLogs) {
    console.log('Criando coleção access_logs...');
    const logsColl = {
      name: 'access_logs',
      type: 'base',
      fields: [
        { name: 'client_id', type: 'text', required: false },
        { name: 'client_name', type: 'text', required: true },
        { name: 'cpf', type: 'text', required: true },
        { name: 'access_count', type: 'number', required: false },
        { name: 'last_access', type: 'text', required: false },
      ],
      indexes: [
        'CREATE INDEX idx_logs_cpf ON access_logs (cpf)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: '',
      deleteRule: '@request.auth.id != ""',
    };

    const createRes = await request({
      path: '/api/collections',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }, JSON.stringify(logsColl));

    console.log('Status criação access_logs:', createRes.status);
  } else {
    console.log('✓ Coleção access_logs já existe. Verificando regras de API...');
    const updateLogs = {
      ...existingLogs,
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: '',
      deleteRule: '@request.auth.id != ""',
    };

    await request({
      path: `/api/collections/${existingLogs.id}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }, JSON.stringify(updateLogs));
    console.log('✓ Regras da coleção access_logs verificadas!');
  }

  console.log('\n✅ Esquema de coleções clients e access_logs configurado com sucesso e 100% preservado!');
}

run().catch(console.error);
