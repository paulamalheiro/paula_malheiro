import PocketBase from 'pocketbase';
import sharp from 'sharp';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function compressAllExistingImages() {
  console.log('=================================================================');
  console.log('   🖼️ OTIMIZADOR DE IMAGENS POCKETBASE (MAX 1080px & < 1MB)');
  console.log('=================================================================\n');

  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
  console.log('✓ Superusuário autenticado com sucesso no PocketBase');

  const uploads = await pb.collection('uploads').getFullList();
  console.log(`Analisando ${uploads.length} arquivos na coleção uploads...\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;
  let optimizedCount = 0;

  for (const record of uploads) {
    const filename = record.file;
    if (!filename) continue;

    // Ignora vídeos
    if (filename.endsWith('.mp4') || filename.endsWith('.webm') || filename.endsWith('.mov')) {
      continue;
    }

    const fileUrl = `https://pb-paula.janagencia.com.br/api/files/uploads/${record.id}/${filename}`;

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) continue;

      const arrayBuffer = await res.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);
      const originalSize = originalBuffer.length;

      // Obtém metadados da imagem
      const metadata = await sharp(originalBuffer).metadata();
      const isTooBig = originalSize > 1024 * 1024; // > 1MB
      const isTooLargeDimension = (metadata.width && metadata.width > 1080) || (metadata.height && metadata.height > 1080);

      if (isTooBig || isTooLargeDimension) {
        console.log(`\nProcessando: ${filename} (ID: ${record.id})`);
        console.log(`  Original: ${metadata.width}x${metadata.height} px | ${formatBytes(originalSize)}`);

        // Redimensiona proporcionalmente mantendo 1080px e comprime
        let quality = 84;
        let optimizedBuffer = await sharp(originalBuffer)
          .rotate() // Mantém orientação EXIF correta
          .resize({
            width: 1080,
            height: 1080,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();

        // Se ainda passar de 1MB, reduz a qualidade progressivamente
        while (optimizedBuffer.length > 1024 * 1024 && quality > 50) {
          quality -= 8;
          optimizedBuffer = await sharp(originalBuffer)
            .rotate()
            .resize({
              width: 1080,
              height: 1080,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toBuffer();
        }

        const optimizedSize = optimizedBuffer.length;
        const newMeta = await sharp(optimizedBuffer).metadata();
        const savedPercent = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

        console.log(`  Otimizado: ${newMeta.width}x${newMeta.height} px | ${formatBytes(optimizedSize)} (-${savedPercent}%)`);

        // Atualiza o arquivo no PocketBase preservando o registro
        const formData = new FormData();
        const blob = new Blob([optimizedBuffer], { type: 'image/jpeg' });
        // Garante extensão .jpeg / .jpg
        const newName = filename.replace(/\.(png|webp)$/i, '.jpeg');
        formData.append('file', blob, newName);

        await pb.collection('uploads').update(record.id, formData);
        console.log(`  ✓ PocketBase atualizado com sucesso para o registro ${record.id}`);

        totalOriginal += originalSize;
        totalOptimized += optimizedSize;
        optimizedCount++;
      }
    } catch (err) {
      console.warn(`  ⚠️ Erro ao processar ${filename}:`, err.message);
    }
  }

  console.log('\n=================================================================');
  console.log(`🎉 OTIMIZAÇÃO CONCLUÍDA:`);
  console.log(`Total de imagens otimizadas: ${optimizedCount}`);
  console.log(`Tamanho original acumulado: ${formatBytes(totalOriginal)}`);
  console.log(`Novo tamanho otimizado: ${formatBytes(totalOptimized)}`);
  if (totalOriginal > 0) {
    const totalReduction = Math.round(((totalOriginal - totalOptimized) / totalOriginal) * 100);
    console.log(`Economia total de tráfego: -${totalReduction}% !`);
  }
  console.log('=================================================================\n');
}

compressAllExistingImages().catch(console.error);
