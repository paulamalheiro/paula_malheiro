import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function checkRules() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  const colls = await pb.collections.getFullList();
  console.log('--- COLEÇÕES E REGRAS ---');
  for (const c of colls) {
    console.log(`\nColeção: ${c.name} (${c.type})`);
    console.log(`- listRule: ${c.listRule}`);
    console.log(`- viewRule: ${c.viewRule}`);
    console.log(`- createRule: ${c.createRule}`);
    console.log(`- updateRule: ${c.updateRule}`);
    console.log(`- deleteRule: ${c.deleteRule}`);
  }
}

checkRules().catch(console.error);
