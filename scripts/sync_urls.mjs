import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

async function syncUrls() {
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');

  const uploads = await pb.collection('uploads').getFullList();
  const uploadMap = new Map();
  for (const u of uploads) {
    uploadMap.set(u.id, pb.files.getURL(u, u.file));
  }

  // 1. Sync Banners
  console.log('--- SYNC BANNERS ---');
  const banners = await pb.collection('banners').getFullList();
  for (const b of banners) {
    if (!b.image_path) continue;
    // Extract upload ID if present
    const match = b.image_path.match(/\/api\/files\/[^/]+\/([a-z0-9]{15})\//);
    if (match) {
      const uploadId = match[1];
      const newUrl = uploadMap.get(uploadId);
      if (newUrl && newUrl !== b.image_path) {
        console.log(`Atualizando Banner ${b.section}:`);
        console.log(`   De:   ${b.image_path}`);
        console.log(`   Para: ${newUrl}`);
        await pb.collection('banners').update(b.id, { image_path: newUrl });
      }
    }
  }

  // 2. Sync Properties
  console.log('\n--- SYNC PROPERTIES ---');
  const properties = await pb.collection('properties').getFullList();
  for (const p of properties) {
    let changed = false;
    let newImageUrl = p.image_url;
    let newCover = p.progress_cover_image;
    let newGallery = [...(p.gallery_images || [])];

    if (p.image_url) {
      const match = p.image_url.match(/\/api\/files\/[^/]+\/([a-z0-9]{15})\//);
      if (match) {
        const uploadId = match[1];
        const newUrl = uploadMap.get(uploadId);
        if (newUrl && newUrl !== p.image_url) {
          newImageUrl = newUrl;
          changed = true;
        }
      }
    }

    if (p.progress_cover_image) {
      const match = p.progress_cover_image.match(/\/api\/files\/[^/]+\/([a-z0-9]{15})\//);
      if (match) {
        const uploadId = match[1];
        const newUrl = uploadMap.get(uploadId);
        if (newUrl && newUrl !== p.progress_cover_image) {
          newCover = newUrl;
          changed = true;
        }
      }
    }

    for (let i = 0; i < newGallery.length; i++) {
      const g = newGallery[i];
      if (typeof g === 'string') {
        const match = g.match(/\/api\/files\/[^/]+\/([a-z0-9]{15})\//);
        if (match) {
          const uploadId = match[1];
          const newUrl = uploadMap.get(uploadId);
          if (newUrl && newUrl !== g) {
            newGallery[i] = newUrl;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      console.log(`Atualizando Property ${p.title} (${p.id})...`);
      await pb.collection('properties').update(p.id, {
        image_url: newImageUrl,
        progress_cover_image: newCover,
        gallery_images: newGallery
      });
    }
  }

  console.log('\n✓ URLs em banners e empreendimentos sincronizadas com sucesso!');
}

syncUrls();
