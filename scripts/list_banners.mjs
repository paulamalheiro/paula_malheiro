import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function listBanners() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  const records = await pb.collection('banners').getFullList();
  console.log('Total banner records:', records.length);
  for (const r of records) {
    console.log({
      id: r.id,
      section: r.section,
      tag: r.tag,
      title: r.title,
      subtitle_preview: r.subtitle?.slice(0, 50),
      updated: r.updated
    });
  }
}

listBanners().catch(console.error);
