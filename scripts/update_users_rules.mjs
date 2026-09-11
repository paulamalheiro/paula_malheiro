import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function updateUsersRules() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  
  await pb.collections.update('users', {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  });

  console.log('✓ Regras da coleção "users" atualizadas com sucesso para permitir gestão de administradores autenticados!');
}

updateUsersRules().catch(console.error);
