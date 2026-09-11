import PocketBase from 'pocketbase';
import sharp from 'sharp';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB (' + (bytes / 1024).toFixed(0) + ' KB)';
}

async function compressExistingImages() {
  console.log(`
=============================================================================
   🚀 OTIMIZANDO IMAGENS EXISTENTES NO POCKETBASE (MAX 1080px, <= 1MB)
=============================================================================
`);

  try {
    console.log('Autenticando superusuário...');
    await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
    console.log('✓ Superusuário autenticado com sucesso!\n');

    const uploads = await pb.collection('uploads').getFullList();
    console.log(`Analisando ${uploads.length} arquivos na coleção 'uploads'...\n`);

    let totalOriginalBytes = 0;
    let totalOptimizedBytes = 0;
    let optimizedCount = 0;

    for (const record of uploads) {
      if (!record.file) continue;

      // Ignora vídeos ou formatos não aplicáveis
      const ext = record.file.split('.').pop().toLowerCase();
      if (['mp4', 'webm', 'mov', 'svg', 'gif'].includes(ext)) {
        console.log(`[Pular] ${record.id} - ${record.file} (formato especial: .${ext})`);
        continue;
      }

      const fileUrl = pb.files.getURL(record, record.file);
      
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.warn(`[Aviso] Falha ao baixar ${fileUrl}: status ${response.status}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const originalSize = buffer.length;
        totalOriginalBytes += originalSize;

        // Inspeciona dimensões com sharp
        const meta = await sharp(buffer).metadata();
        const maxSide = Math.max(meta.width || 0, meta.height || 0);

        // Otimiza se tiver mais de 1MB OU se a resolução for maior que 1080px
        const needsOptimization = originalSize > 1024 * 1024 || maxSide > 1080;

        if (!needsOptimization) {
          totalOptimizedBytes += originalSize;
          console.log(`✓ [OK] ${record.id} - ${record.file}: ${formatMB(originalSize)} (${meta.width}x${meta.height})`);
          continue;
        }

        console.log(`⚡ [Otimizando] ${record.id} - ${record.file}`);
        console.log(`   Dimensões originais: ${meta.width}x${meta.height} | Tamanho: ${formatMB(originalSize)}`);

        // Redimensiona proporcionalmente para 1080px e comprime para JPEG alta fidelidade
        let quality = 84;
        let optimizedBuffer = await sharp(buffer)
          .rotate() // respeita orientação EXIF
          .resize({
            width: meta.width >= meta.height ? 1080 : undefined,
            height: meta.height > meta.width ? 1080 : undefined,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        // Se ainda for maior que 1MB, reduz qualidade progressivamente
        while (optimizedBuffer.length > 1024 * 1024 && quality > 50) {
          quality -= 8;
          optimizedBuffer = await sharp(buffer)
            .rotate()
            .resize({
              width: meta.width >= meta.height ? 1080 : undefined,
              height: meta.height > meta.width ? 1080 : undefined,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        }

        const newSize = optimizedBuffer.length;
        totalOptimizedBytes += newSize;
        const reduction = Math.round(((originalSize - newSize) / originalSize) * 100);

        // Prepara envio para atualizar o arquivo no PocketBase
        const baseName = record.file.replace(/\.[^/.]+$/, '');
        const newFileName = `${baseName}.jpeg`;
        const blob = new Blob([optimizedBuffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', blob, newFileName);

        await pb.collection('uploads').update(record.id, formData);

        optimizedCount++;
        console.log(`   🎉 OTIMIZADO: ${formatMB(originalSize)} ➔ ${formatMB(newSize)} (-${reduction}%)`);
        console.log(`   Registro ${record.id} atualizado no PocketBase com sucesso!\n`);
      } catch (err) {
        console.error(`❌ Erro ao processar ${record.id} - ${record.file}:`, err.message);
        totalOptimizedBytes += originalSize;
      }
    }

    const totalSaved = totalOriginalBytes - totalOptimizedBytes;
    const totalReduction = totalOriginalBytes > 0 ? Math.round((totalSaved / totalOriginalBytes) * 100) : 0;

    console.log(`
=============================================================================
   ✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!
=============================================================================
Total de fotos otimizadas: ${optimizedCount}
Tamanho antes: ${formatMB(totalOriginalBytes)}
Tamanho depois: ${formatMB(totalOptimizedBytes)}
Economia de dados total: ${formatMB(totalSaved)} (-${totalReduction}%)
=============================================================================
`);

  } catch (err) {
    console.error('Erro na execução:', err);
  }
}

compressExistingImages();
