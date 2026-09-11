import PocketBase from 'pocketbase';
import sharp from 'sharp';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

function formatSize(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB (' + (bytes / (1024 * 1024)).toFixed(2) + ' MB)';
}

async function checkSizes() {
  console.log(`
=============================================================================
   🔍 AUDITORIA DE TAMANHO DE IMAGENS NO POCKETBASE
=============================================================================
`);

  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  
  const uploads = await pb.collection('uploads').getFullList();
  let allUnder1MB = true;
  let totalBytes = 0;

  for (const u of uploads) {
    if (!u.file) continue;
    const ext = u.file.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) {
      continue;
    }

    const url = pb.files.getURL(u, u.file);
    try {
      const res = await fetch(url);
      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const size = buf.length;
      totalBytes += size;

      let dimStr = '';
      try {
        const meta = await sharp(buf).metadata();
        dimStr = `${meta.width}x${meta.height}`;
      } catch {}

      const isOver = size > 1024 * 1024;
      if (isOver) allUnder1MB = false;

      const badge = isOver ? '❌ ACIMA DE 1MB' : '✅ OK (< 1MB)';
      console.log(`${badge} | ${u.id} - ${u.file}: ${formatSize(size)} [${dimStr}]`);
    } catch (e) {
      console.error(`Erro ao verificar ${u.file}:`, e.message);
    }
  }

  console.log(`\n-----------------------------------------------------------------------------`);
  console.log(`Total em disco de imagens: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  if (allUnder1MB) {
    console.log(`🎉 PERFEITO: 100% das imagens estão abaixo de 1MB e adequadas para web!`);
  } else {
    console.warn(`⚠️ Existem imagens que ainda excedem 1MB.`);
  }
  console.log(`=============================================================================\n`);
}

checkSizes();
