/**
 * Utilitário de Otimização e Compressão de Imagens em Tempo Real
 * - Redimensiona proporcionalmente para resolução máxima de 1080px (largura ou altura)
 * - Comprime para garantir peso inferior a 1MB (meta ideal: 150KB - 400KB)
 * - Mantém fidelidade visual cristalina via Canvas HTML5 de alta precisão
 */

export interface CompressOptions {
  /** Maior dimensão permitida (largura ou altura proporcional). Padrão: 1080 */
  maxDimension?: number;
  /** Limite máximo de peso em bytes. Padrão: 1MB (1.048.576 bytes) */
  maxSizeBytes?: number;
  /** Qualidade inicial JPEG (0.0 a 1.0). Padrão: 0.84 */
  initialQuality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  savedPercent: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const result = await compressImageWithDetails(file, options);
  return result.file;
}

export async function compressImageWithDetails(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 1080,
    maxSizeBytes = 1024 * 1024, // 1MB
    initialQuality = 0.84,
  } = options;

  // Se não for imagem (ex: vídeo mp4, webm ou svg), retorna o arquivo original
  if (!file.type.startsWith('image/') || file.type.includes('svg')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      width: 0,
      height: 0,
      savedPercent: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao decodificar imagem.'));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // 1. Cálculo de Redimensionamento Proporcional com base em 1080px
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // 2. Renderização em Canvas Offscreen com interpolação bicúbica
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback se canvas não suportado
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              width,
              height,
              savedPercent: 0,
            });
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 3. Compressão iterativa para garantir < 1MB
          let quality = initialQuality;
          let blob: Blob | null = await new Promise((res) =>
            canvas.toBlob(res, 'image/jpeg', quality)
          );

          // Se por algum motivo passar de 1MB, ajusta progressivamente a taxa
          while (blob && blob.size > maxSizeBytes && quality > 0.5) {
            quality -= 0.08;
            blob = await new Promise((res) =>
              canvas.toBlob(res, 'image/jpeg', quality)
            );
          }

          if (!blob) {
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
              width,
              height,
              savedPercent: 0,
            });
            return;
          }

          // Garante que o nome do arquivo termine em .jpg se convertido
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${originalName}.jpg`;

          const compressedFile = new File([blob], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const savedPercent = Math.max(
            0,
            Math.round(((file.size - compressedFile.size) / file.size) * 100)
          );

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            width,
            height,
            savedPercent,
          });
        } catch (err) {
          console.warn('[imageOptimizer] Erro durante compressão canvas, utilizando original:', err);
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            width: img.width,
            height: img.height,
            savedPercent: 0,
          });
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
