import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function testFetch() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  const record = await pb.collection('uploads').getOne('1vy1er5mx0no1hg');
  console.log('Record:', record.id, record.file);
  
  // URL gerada pelo SDK
  const url1 = pb.files.getUrl(record, record.file);
  console.log('URL1:', url1);
  const res1 = await fetch(url1);
  console.log('Fetch URL1 status:', res1.status, 'size:', res1.headers.get('content-length'));

  const url2 = `https://pb-paula.janagencia.com.br/api/files/uploads/${record.id}/${record.file}`;
  console.log('URL2:', url2);
  const res2 = await fetch(url2);
  console.log('Fetch URL2 status:', res2.status, 'size:', res2.headers.get('content-length'));
}

testFetch().catch(console.error);
