import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

async function syncBanners() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  const banners = await pb.collection('banners').getFullList();
  
  for (const b of banners) {
    console.log(`Banner ${b.section}: ${b.image_path}`);
    if (b.image_path && b.image_path.includes('/api/files/')) {
      // Extrai o uploadId da URL
      const match = b.image_path.match(/\/([a-z0-9]{15})\//i);
      if (match) {
        const uploadId = match[1];
        try {
          const uploadRecord = await pb.collection('uploads').getOne(uploadId);
          const currentUrl = `https://pb-paula.janagencia.com.br/api/files/uploads/${uploadRecord.id}/${uploadRecord.file}`;
          if (b.image_path !== currentUrl) {
            console.log(`  -> Atualizando ${b.section} de:\n     ${b.image_path}\n     para:\n     ${currentUrl}`);
            await pb.collection('banners').update(b.id, { image_path: currentUrl });
          }
        } catch (e) {
          console.warn(`  Não encontrou upload ${uploadId}:`, e.message);
        }
      }
    }
  }

  // Também verificar properties
  const properties = await pb.collection('properties').getFullList();
  for (const p of properties) {
    if (p.image_url && p.image_url.includes('/api/files/')) {
      const match = p.image_url.match(/\/([a-z0-9]{15})\//i);
      if (match) {
        const uploadId = match[1];
        try {
          const uploadRecord = await pb.collection('uploads').getOne(uploadId);
          const currentUrl = `https://pb-paula.janagencia.com.br/api/files/uploads/${uploadRecord.id}/${uploadRecord.file}`;
          if (p.image_url !== currentUrl) {
            console.log(`  -> Atualizando property "${p.title}" image_url para novo arquivo otimizado`);
            await pb.collection('properties').update(p.id, { image_url: currentUrl });
          }
        } catch (e) {}
      }
    }
  }
  console.log('✓ Banners e properties sincronizados com os novos arquivos otimizados!');
}

syncBanners().catch(console.error);
