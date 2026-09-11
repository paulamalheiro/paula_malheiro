import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function testUserCreation() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');

  console.log('Listando usuários atuais na coleção "users":');
  const list = await pb.collection('users').getFullList();
  console.log('Total de usuários:', list.length);
  list.forEach(u => console.log(`- [${u.id}] ${u.email} | Nome: ${u.name}`));
}

testUserCreation().catch(console.error);
