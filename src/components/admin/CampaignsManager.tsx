import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Power,
  Film,
  Image as ImageIcon,
  Clock,
  UploadCloud,
  Play
} from 'lucide-react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { ImageUploader } from './ImageUploader';
import { SmartImage } from '../common/SmartImage';
import { uploadBannerFile } from '../../lib/supabase';
import type { Campaign, CampaignMediaType } from '../../types/property';

const MAX_VIDEO_DURATION_SECONDS = 40;

export const CampaignsManager: React.FC = () => {
  const { campaigns, loading, saveCampaign, deleteCampaign } = useCampaigns();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleOpenNew = () => {
    setEditingCampaign({
      title: '',
      media_type: 'image',
      image_url: '',
      video_url: '',
      video_duration: null,
      target_link: '',
      is_active: true,
    });
    setSelectedImage(null);
    setSelectedVideoFile(null);
    setVideoDuration(null);
    setVideoPreviewUrl(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign({ ...camp });
    setSelectedImage(null);
    setSelectedVideoFile(null);
    setVideoDuration(camp.video_duration || null);
    setVideoPreviewUrl(camp.video_url || null);
    setIsEditing(true);
  };

  const handleToggleActive = async (camp: Campaign) => {
    try {
      await saveCampaign({
        ...camp,
        is_active: !camp.is_active,
      });
      setFeedback({
        type: 'success',
        message: !camp.is_active 
          ? `Campanha "${camp.title}" ativada! Ela será exibida no pop-up da Landing Page.` 
          : `Campanha "${camp.title}" desativada.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar status.' });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Deseja realmente excluir a campanha "${title}"?`)) {
      try {
        await deleteCampaign(id);
        setFeedback({ type: 'success', message: 'Campanha excluída com sucesso.' });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao excluir campanha.' });
      }
    }
  };

  // Validação estrita da duração do vídeo (Máx. 40 segundos)
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (!file.type.startsWith('video/')) {
      setFeedback({
        type: 'error',
        message: 'Por favor, selecione um arquivo de vídeo válido (.mp4 ou .webm).',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'O arquivo de vídeo deve ter até 50MB para garantir carregamento rápido no pop-up.',
      });
      return;
    }

    // Checagem de duração via HTML5 video element
    const tempUrl = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';

    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      const durationInSeconds = Math.round(videoEl.duration);

      if (durationInSeconds > MAX_VIDEO_DURATION_SECONDS) {
        setFeedback({
          type: 'error',
          message: `O vídeo da campanha deve ter no máximo ${MAX_VIDEO_DURATION_SECONDS} segundos. Duração atual: ${durationInSeconds} segundos.`,
        });
        setSelectedVideoFile(null);
        setVideoDuration(null);
        setVideoPreviewUrl(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
        return;
      }

      // Vídeo aprovado
      setSelectedVideoFile(file);
      setVideoDuration(durationInSeconds);
      setVideoPreviewUrl(tempUrl);
      setFeedback({
        type: 'success',
        message: `Vídeo aprovado com sucesso! Duração: ${durationInSeconds} segundos.`,
      });
    };

    videoEl.onerror = () => {
      URL.revokeObjectURL(videoEl.src);
      setFeedback({
        type: 'error',
        message: 'Não foi possível ler os metadados do vídeo. Verifique se o formato é .mp4 ou .webm.',
      });
    };

    videoEl.src = tempUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign?.title) {
      setFeedback({ type: 'error', message: 'Informe o título da campanha.' });
      return;
    }

    const currentMediaType: CampaignMediaType = editingCampaign.media_type || 'image';

    setIsSaving(true);
    setFeedback(null);

    try {
      let finalImageUrl = editingCampaign.image_url || '';
      let finalVideoUrl = editingCampaign.video_url || '';

      // Upload da Imagem (se formato for imagem ou poster)
      if (selectedImage) {
        const uploadRes = await uploadBannerFile(selectedImage, 'campaigns');
        finalImageUrl = uploadRes.publicUrl;
      }

      // Upload do Vídeo (se formato for vídeo)
      if (currentMediaType === 'video') {
        if (selectedVideoFile) {
          const uploadRes = await uploadBannerFile(selectedVideoFile, 'campaigns/videos');
          finalVideoUrl = uploadRes.publicUrl;
          if (!finalImageUrl) {
            // Usa imagem padrão de poster para o vídeo
            finalImageUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
          }
        }

        if (!finalVideoUrl) {
          throw new Error('É obrigatório enviar um arquivo de vídeo com até 40 segundos para campanhas em vídeo.');
        }
      } else {
        // Modo imagem
        if (!finalImageUrl) {
          throw new Error('Selecione a imagem ou panfleto promocional.');
        }
      }

      const payload: Partial<Campaign> = {
        ...editingCampaign,
        media_type: currentMediaType,
        image_url: finalImageUrl,
        video_url: currentMediaType === 'video' ? finalVideoUrl : null,
        video_duration: currentMediaType === 'video' ? videoDuration : null,
      };

      await saveCampaign(payload);

      setFeedback({
        type: 'success',
        message: 'Campanha salva com sucesso!',
      });
      setIsEditing(false);
      setEditingCampaign(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar campanha.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-md animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-sans font-bold text-primary">Campanhas & Pop-up Promocional</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure panfletos de ofertas ou vídeos curtos (até 40s) que abrem automaticamente para os visitantes.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Nova Campanha
        </button>
      </div>

      {/* Modal de Criação / Edição */}
      {isEditing && editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                {editingCampaign.id ? 'Editar Campanha' : 'Nova Campanha Promocional'}
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Seletor de Tipo de Mídia: IMAGEM vs VÍDEO */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo de Mídia do Pop-up
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign({ ...editingCampaign, media_type: 'image' })}
                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      (editingCampaign.media_type || 'image') === 'image'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon size={16} />
                    <span>Imagem / Panfleto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCampaign({ ...editingCampaign, media_type: 'video' })}
                    className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editingCampaign.media_type === 'video'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Film size={16} />
                    <span>Vídeo Promocional (até 40s)</span>
                  </button>
                </div>
              </div>

              {/* Uploader específico para Imagem ou Vídeo */}
              {(editingCampaign.media_type || 'image') === 'image' ? (
                <ImageUploader
                  currentImagePath={editingCampaign.image_url}
                  onImageSelected={(file) => setSelectedImage(file)}
                  aspectRatio="aspect-[4/5]"
                  recommendedResolution="1080 x 1350 px (Formato Panfleto/Flyer)"
                />
              ) : (
                /* Uploader de Vídeo com Checagem de Duração */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Vídeo da Campanha (Máx. 40s)
                    </label>
                    <span className="text-[11px] text-primary font-bold flex items-center gap-1">
                      <Clock size={12} /> Limite estrito: 40 segundos
                    </span>
                  </div>

                  {/* Preview do Vídeo */}
                  {videoPreviewUrl && (
                    <div className="relative aspect-[4/5] max-h-72 w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-md">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                      {videoDuration !== null && (
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Clock size={12} className="text-amber-400" /> {videoDuration}s / 40s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dropzone de Vídeo */}
                  <label className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <UploadCloud size={24} />
                    </div>

                    <span className="text-xs font-bold text-gray-800">
                      {selectedVideoFile ? selectedVideoFile.name : 'Selecionar Arquivo de Vídeo'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      Formatos aceitos: MP4 ou WebM (até 50MB e máx. 40s)
                    </span>

                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-white px-4 py-2 rounded-xl shadow-xs border border-primary/20">
                      <Film size={14} /> Escolher Vídeo
                    </span>
                  </label>
                </div>
              )}

              {/* Informações da Campanha */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Título / Identificação da Campanha *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.title || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                    placeholder="Ex: Condições Especiais para Imóveis na Planta"
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Link de Redirecionamento ao Clicar (Opcional)
                  </label>
                  <input
                    type="url"
                    value={editingCampaign.target_link || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, target_link: e.target.value })}
                    placeholder="Ex: https://wa.me/5577991465337?text=Quero%20a%20oferta"
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Se preenchido, o visitante que clicar no pop-up será redirecionado para este link (ex: WhatsApp).
                  </span>
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Ativar como Pop-up Atual</span>
                    <span className="text-xs text-gray-500">Ao ativar esta campanha, as outras serão pausadas.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingCampaign.is_active ?? false}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, is_active: e.target.checked })}
                    className="w-5 h-5 text-primary rounded-md focus:ring-primary cursor-pointer"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-primary hover:bg-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Campanha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Campanhas Cadastradas */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Carregando campanhas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8">
          <p className="text-sm font-bold text-gray-700">Nenhuma campanha criada ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Crie uma campanha com panfleto ou vídeo (até 40s) para divulgar aos visitantes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const isVideo = camp.media_type === 'video' && Boolean(camp.video_url);

            return (
              <div
                key={camp.id}
                className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col shadow-xs ${
                  camp.is_active ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-200'
                }`}
              >
                <div className="relative aspect-[4/5] bg-gray-900 overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <video
                      src={camp.video_url || ''}
                      poster={camp.image_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <SmartImage
                      src={camp.image_url}
                      alt={camp.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Badges no topo */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {camp.is_active ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles size={12} /> Pop-up Ativo no Site
                      </span>
                    ) : (
                      <span className="bg-gray-700/80 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-xs">
                        Pausado
                      </span>
                    )}

                    {isVideo && (
                      <span className="bg-black/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <Film size={11} className="text-amber-400" />
                        {camp.video_duration ? `${camp.video_duration}s` : 'Vídeo'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{camp.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(camp)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  
                  {camp.target_link && (
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <ExternalLink size={12} className="shrink-0" /> {camp.target_link}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(camp)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        camp.is_active
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Power size={14} />
                      {camp.is_active ? 'Desativar Pop-up' : 'Ativar no Site'}
                    </button>

                    <button
                      onClick={() => handleDelete(camp.id, camp.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
