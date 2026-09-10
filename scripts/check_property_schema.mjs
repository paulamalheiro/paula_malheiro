import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function checkProperties() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  const collection = await pb.collections.getOne('properties');
  console.log('Collection fields:', collection.fields?.map(f => ({ name: f.name, type: f.type })));
  
  const records = await pb.collection('properties').getList(1, 2);
  console.log('Sample record fields:', records.items[0] ? Object.keys(records.items[0]) : 'no records');
  if (records.items[0]) {
    console.log({
      id: records.items[0].id,
      title: records.items[0].title,
      is_featured: records.items[0].is_featured,
      is_construction: records.items[0].is_construction,
      gallery_images: records.items[0].gallery_images,
    });
  }
}

checkProperties().catch(console.error);
