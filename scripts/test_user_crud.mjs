import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function testUserCrud() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');

  console.log('1. Criando usuário de teste...');
  const testEmail = `testadmin_${Date.now()}@paulamalheiro.com.br`;
  const created = await pb.collection('users').create({
    email: testEmail,
    password: 'AdminPassword123',
    passwordConfirm: 'AdminPassword123',
    name: 'Admin Teste',
    emailVisibility: true,
  });
  console.log('✓ Usuário criado com ID:', created.id, '| Email:', created.email);

  console.log('2. Testando autenticação com o novo usuário...');
  const pbAuth = new PocketBase('https://pb-paula.janagencia.com.br');
  const authRes = await pbAuth.collection('users').authWithPassword(testEmail, 'AdminPassword123');
  console.log('✓ Autenticado com sucesso! Token gerado:', Boolean(authRes.token));

  console.log('3. Removendo usuário de teste...');
  await pb.collection('users').delete(created.id);
  console.log('✓ Usuário de teste removido com sucesso!');
}

testUserCrud().catch(console.error);
