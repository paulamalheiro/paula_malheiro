import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

async function inspectImages() {
  try {
    await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
    console.log('Superuser authenticated!');
    
    // 1. Uploads
    console.log('\n--- UPLOADS ---');
    const uploads = await pb.collection('uploads').getFullList();
    for (const u of uploads) {
      const url = pb.files.getUrl(u, u.file);
      try {
        const head = await fetch(url, { method: 'HEAD' });
        const size = parseInt(head.headers.get('content-length') || '0', 10);
        console.log(`[Upload] ${u.id} - ${u.file}: ${(size / (1024 * 1024)).toFixed(2)} MB (${size} bytes)`);
      } catch (e) {
        console.log(`[Upload] ${u.id} - ${u.file}: error ${e.message}`);
      }
    }
    
    // 2. Banners
    console.log('\n--- BANNERS ---');
    const banners = await pb.collection('banners').getFullList();
    for (const b of banners) {
      console.log(`[Banner] ${b.section}: image_path = ${b.image_path}`);
      if (b.image_path && b.image_path.startsWith('http')) {
        try {
          const head = await fetch(b.image_path, { method: 'HEAD' });
          const size = parseInt(head.headers.get('content-length') || '0', 10);
          console.log(`   Size: ${(size / (1024 * 1024)).toFixed(2)} MB`);
        } catch (e) {}
      }
    }

    // 3. Properties
    console.log('\n--- PROPERTIES ---');
    const props = await pb.collection('properties').getFullList();
    for (const p of props) {
      console.log(`[Property] ${p.title} (${p.id}): image_url = ${p.image_url?.slice(0, 80)}`);
      if (p.gallery_images && p.gallery_images.length > 0) {
        console.log(`   Gallery images: ${p.gallery_images.length} items`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectImages();
