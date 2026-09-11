import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { getImageUrl } from '../../lib/pocketbase';
import { compressImageWithDetails, formatBytes } from '../../lib/imageOptimizer';

interface ImageUploaderProps {
  currentImagePath?: string | null;
  onImageSelected: (file: File) => void;
  aspectRatio?: string;
  recommendedResolution?: string;
}

interface CompressionStats {
  original: string;
  compressed: string;
  percent: number;
  dimensions: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImagePath,
  onImageSelected,
  aspectRatio = 'aspect-[4/5]',
  recommendedResolution = '1080px (JPG, PNG ou WebP comprimido)',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reseta o preview temporário sempre que a imagem atual (ou seção) for alterada
  useEffect(() => {
    setPreviewUrl(null);
    setSelectedFileName(null);
    setErrorMsg(null);
    setCompressionStats(null);
  }, [currentImagePath]);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setCompressionStats(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('O tamanho da imagem bruta não deve exceder 25MB.');
      return;
    }

    try {
      setIsOptimizing(true);
      const result = await compressImageWithDetails(file, {
        maxDimension: 1080,
        maxSizeBytes: 1024 * 1024,
        initialQuality: 0.84,
      });

      const objectUrl = URL.createObjectURL(result.file);
      setPreviewUrl(objectUrl);
      setSelectedFileName(result.file.name);
      setCompressionStats({
        original: formatBytes(result.originalSize),
        compressed: formatBytes(result.compressedSize),
        percent: result.reductionPercentage,
        dimensions: `${result.width} × ${result.height} px`,
      });

      onImageSelected(result.file);
    } catch (err: any) {
      console.error('[ImageUploader] Erro na otimização:', err);
      // Fallback para arquivo original
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFileName(file.name);
      onImageSelected(file);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const displayImage = previewUrl || (currentImagePath ? getImageUrl(currentImagePath) : null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Imagem do Banner
        </label>
        <span className="text-[11px] text-gray-400 font-medium">
          Recomendado: {recommendedResolution}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Preview da Imagem */}
        <div className="space-y-2">
          <div className={`relative ${aspectRatio} w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner flex items-center justify-center group`}>
            {displayImage ? (
              <>
                <img
                  src={displayImage}
                  alt="Prévia do Banner"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/95 text-gray-900 text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:bg-white flex items-center gap-2 transition-transform hover:scale-105"
                  >
                    <RefreshCw size={14} /> Trocar Imagem
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                <ImageIcon size={40} className="stroke-1 mb-2 opacity-50" />
                <span className="text-xs">Nenhuma imagem selecionada</span>
              </div>
            )}
          </div>
          {isOptimizing && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3.5 py-2.5 rounded-xl border border-primary/20 animate-pulse">
              <Loader2 size={15} className="animate-spin text-primary shrink-0" />
              <span className="font-semibold">Otimizando e comprimindo imagem para 1080px...</span>
            </div>
          )}
          {compressionStats && !isOptimizing && (
            <div className="flex flex-col gap-1 text-xs text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                <span>Otimizado: {compressionStats.original} ➔ {compressionStats.compressed} {compressionStats.percent > 0 ? `(-${compressionStats.percent}%)` : ''}</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Dimensões: {compressionStats.dimensions} • Arquivo pronto para envio</span>
            </div>
          )}
          {previewUrl && !compressionStats && !isOptimizing && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <CheckCircle size={14} className="shrink-0 text-amber-600" />
              <span>Nova imagem pronta para envio ({selectedFileName})</span>
            </div>
          )}
        </div>

        {/* Zona de Drop / Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] ${
            dragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50/50 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <UploadCloud size={24} />
          </div>

          <p className="text-sm font-bold text-gray-700 mb-1">
            Clique para selecionar ou arraste uma foto
          </p>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
            Formatos aceitos: JPG, PNG ou WebP. Até 15MB.
          </p>

          <button
            type="button"
            className="mt-4 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl transition-colors"
          >
            Navegar nos Arquivos
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
