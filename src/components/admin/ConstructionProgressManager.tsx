import React, { useState } from 'react';
import { 
  Hammer, 
  UploadCloud, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Images, 
  Star, 
  ShieldAlert, 
  Building2,
  Video,
  Play,
  Film,
  Link as LinkIcon
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { SmartImage } from '../common/SmartImage';
import { uploadBannerFile } from '../../lib/supabase';
import type { Property, PropertyMediaType } from '../../types/property';

const MAX_PHOTOS = 10;
const MAX_VIDEOS = 2;

export const ConstructionProgressManager: React.FC = () => {
  const { constructionProperties, loading, saveProperty } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Se nenhum estiver selecionado, seleciona o primeiro por padrão
  const activeProperty = constructionProperties.find(
    (p) => p.id === (selectedPropertyId || constructionProperties[0]?.id)
  ) || constructionProperties[0] || null;

  const mediaType: PropertyMediaType = activeProperty?.media_type || 'photos';
  const currentGallery: string[] = activeProperty?.gallery_images || [];
  const currentVideos: string[] = activeProperty?.gallery_videos || [];

  const photosCount = currentGallery.length;
  const isPhotosMaxReached = photosCount >= MAX_PHOTOS;
  const remainingPhotoSlots = Math.max(0, MAX_PHOTOS - photosCount);

  const videosCount = currentVideos.length;
  const isVideosMaxReached = videosCount >= MAX_VIDEOS;
  const remainingVideoSlots = Math.max(0, MAX_VIDEOS - videosCount);

  // Mudar formato de mídia (Fotos vs Vídeos)
  const handleToggleMediaType = async (newType: PropertyMediaType) => {
    if (!activeProperty) return;
    try {
      await saveProperty({
        ...activeProperty,
        media_type: newType,
        action_type: newType === 'videos' ? 'video' : 'gallery',
      });
      setFeedback({
        type: 'success',
        message: `Formato de exibição da obra alterado para "${newType === 'photos' ? 'Galeria de Fotos' : 'Vídeos da Obra'}".`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao alterar formato.' });
    }
  };

  // Upload de Fotos (até 10)
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeProperty || !e.target.files || e.target.files.length === 0) return;

    const filesToUpload: File[] = Array.from(e.target.files);

    if (filesToUpload.length > remainingPhotoSlots) {
      setFeedback({
        type: 'error',
        message: `Limite excedido! Você pode adicionar apenas mais ${remainingPhotoSlots} foto(s) para este empreendimento (máximo ${MAX_PHOTOS}).`,
      });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const uploadedUrls: string[] = [];
      const propertyFolder = `obras/${activeProperty.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
        }
        const res = await uploadBannerFile(file, propertyFolder);
        uploadedUrls.push(res.publicUrl);
      }

      const updatedGallery = [...currentGallery, ...uploadedUrls];

      await saveProperty({
        ...activeProperty,
        gallery_images: updatedGallery,
        action_type: 'gallery',
      });

      setFeedback({
        type: 'success',
        message: `${uploadedUrls.length} foto(s) adicionada(s) com sucesso!`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro no upload de fotos.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Upload de Arquivo de Vídeo (até 2)
  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeProperty || !e.target.files || e.target.files.length === 0) return;

    if (isVideosMaxReached) {
      setFeedback({
        type: 'error',
        message: `Limite de ${MAX_VIDEOS} vídeos atingido para este empreendimento.`,
      });
      return;
    }

    const file = e.target.files[0];
    if (!file.type.startsWith('video/')) {
      setFeedback({
        type: 'error',
        message: 'Por favor, selecione um arquivo de vídeo válido (.mp4, .webm).',
      });
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'O arquivo de vídeo excede o tamanho recomendado de 80MB.',
      });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const propertyFolder = `obras/videos/${activeProperty.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const res = await uploadBannerFile(file, propertyFolder);

      const updatedVideos = [...currentVideos, res.publicUrl];

      await saveProperty({
        ...activeProperty,
        gallery_videos: updatedVideos,
        media_type: 'videos',
        action_type: 'video',
      });

      setFeedback({
        type: 'success',
        message: 'Vídeo da obra enviado com sucesso!',
      });
      setShowAddVideoModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro no upload do vídeo.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Adicionar Vídeo via Link (YouTube, Vimeo, Reels)
  const handleAddVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProperty || !videoLinkInput.trim()) return;

    if (isVideosMaxReached) {
      setFeedback({
        type: 'error',
        message: `Limite de ${MAX_VIDEOS} vídeos atingido para este empreendimento.`,
      });
      return;
    }

    try {
      const updatedVideos = [...currentVideos, videoLinkInput.trim()];

      await saveProperty({
        ...activeProperty,
        gallery_videos: updatedVideos,
        media_type: 'videos',
        action_type: 'video',
      });

      setFeedback({
        type: 'success',
        message: 'Link de vídeo adicionado com sucesso!',
      });
      setVideoLinkInput('');
      setShowAddVideoModal(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao adicionar link de vídeo.' });
    }
  };

  // Excluir Vídeo
  const handleDeleteVideo = async (indexToRemove: number) => {
    if (!activeProperty) return;

    if (window.confirm('Deseja realmente remover este vídeo do acompanhamento da obra?')) {
      try {
        const updatedVideos = currentVideos.filter((_, idx) => idx !== indexToRemove);

        await saveProperty({
          ...activeProperty,
          gallery_videos: updatedVideos,
        });

        setFeedback({
          type: 'success',
          message: 'Vídeo removido com sucesso.',
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao remover vídeo.' });
      }
    }
  };

  // Excluir Foto
  const handleDeletePhoto = async (indexToRemove: number) => {
    if (!activeProperty) return;

    if (window.confirm('Deseja remover esta foto do acompanhamento da obra?')) {
      try {
        const updatedGallery = currentGallery.filter((_, idx) => idx !== indexToRemove);
        
        await saveProperty({
          ...activeProperty,
          gallery_images: updatedGallery,
          action_type: updatedGallery.length === 0 && activeProperty.action_type === 'gallery'
            ? 'dates_modal'
            : activeProperty.action_type,
        });

        setFeedback({
          type: 'success',
          message: 'Foto removida da galeria.',
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao remover foto.' });
      }
    }
  };

  // Definir como capa principal do card
  const handleSetAsCover = async (photoUrl: string) => {
    if (!activeProperty) return;

    try {
      await saveProperty({
        ...activeProperty,
        image_url: photoUrl,
      });

      setFeedback({
        type: 'success',
        message: 'Foto definida como a capa do empreendimento na Evolução das Obras!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao definir capa.' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500">Carregando acompanhamento de obras...</p>
      </div>
    );
  }

  if (constructionProperties.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center space-y-3">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Hammer size={26} />
        </div>
        <h4 className="text-lg font-bold text-gray-800">Nenhum empreendimento em "Evolução das Obras"</h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Para gerenciar as fotos e vídeos de acompanhamento da obra, ative a opção <strong>"Exibir em Evolução das Obras"</strong> em pelo menos um empreendimento na aba de Empreendimentos.
        </p>
      </div>
    );
  }

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

      {/* Header e Seletor de Empreendimento */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              Gestão de Mídias de Obras
            </span>
            <h3 className="text-xl font-sans font-bold text-primary flex items-center gap-2">
              <Hammer size={20} /> Acompanhamento da Evolução das Obras
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escolha entre galeria de fotos (até 10) ou vídeos da obra (até 2) para cada empreendimento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
              {constructionProperties.length} obras ativas
            </span>
          </div>
        </div>

        {/* Abas de Escolha do Empreendimento */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {constructionProperties.map((prop) => {
            const isSelected = activeProperty?.id === prop.id;
            const isVideoFormat = prop.media_type === 'videos';
            const count = isVideoFormat 
              ? (prop.gallery_videos || []).length 
              : (prop.gallery_images || []).length;
            const max = isVideoFormat ? MAX_VIDEOS : MAX_PHOTOS;

            return (
              <button
                key={prop.id}
                onClick={() => {
                  setSelectedPropertyId(prop.id);
                  setFeedback(null);
                }}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border-gray-200/70'
                }`}
              >
                {isVideoFormat ? (
                  <Film size={15} className={isSelected ? 'text-white' : 'text-primary'} />
                ) : (
                  <Building2 size={15} className={isSelected ? 'text-white' : 'text-primary'} />
                )}
                <span>{prop.title}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isVideoFormat ? 'Vídeos' : 'Fotos'}: {count}/{max}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel do Empreendimento Selecionado */}
      {activeProperty && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
          {/* Seletor de Tipo de Mídia: FOTOS vs VÍDEOS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-secondary/50 to-primary/5 border border-primary/15">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                Formato de Exibição do Empreendimento
              </span>
              <h4 className="font-bold text-gray-800 text-base mt-0.5">{activeProperty.title}</h4>
              <p className="text-xs text-gray-500">
                Alterne entre galeria fotográfica ou vídeos de acompanhamento da obra.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleMediaType('photos')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  mediaType === 'photos'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Images size={15} />
                <span>Galeria de Fotos (até 10)</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMediaType('videos')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  mediaType === 'videos'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Video size={15} />
                <span>Vídeos da Obra (até 2)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 1: MODO VÍDEOS (ATÉ 2) */}
          {/* ========================================================================= */}
          {mediaType === 'videos' && (
            <div className="space-y-6">
              {/* Contador de Vídeos */}
              <div className="bg-secondary/40 rounded-2xl p-4 sm:p-5 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Film size={18} className="text-primary" />
                    <span className="font-bold text-gray-800 text-sm">Vídeos do Empreendimento</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Ao clicar no empreendimento no site público, o visitante poderá assistir aos vídeos das obras.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Vídeos cadastrados:</span>
                    <span className={`text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-lg ${
                      isVideosMaxReached 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-primary text-white'
                    }`}>
                      {videosCount} de {MAX_VIDEOS}
                    </span>
                  </div>
                  <div className="w-36 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isVideosMaxReached ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ width: `${(videosCount / MAX_VIDEOS) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Alerta de Limite Máximo de Vídeos */}
              {isVideosMaxReached && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 text-amber-600" />
                  <span>
                    <strong>Limite de {MAX_VIDEOS} vídeos atingido!</strong> Para adicionar outro vídeo, exclua um dos cadastrados abaixo.
                  </span>
                </div>
              )}

              {/* Ação de Adicionar Vídeo */}
              {!isVideosMaxReached && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opção A: Upload de Arquivo MP4/WebM */}
                  <label className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleUploadVideoFile}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <UploadCloud size={24} />
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {isUploading ? 'Enviando vídeo...' : 'Upload de Arquivo de Vídeo'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Formatos: .MP4 ou .WebM (até 80MB)</span>
                  </label>

                  {/* Opção B: Inserir Link do Vídeo (YouTube, Reels, Vimeo) */}
                  <div className="border-2 border-dashed border-gray-300 hover:border-primary/50 bg-gray-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200/80 text-gray-700 flex items-center justify-center mb-2">
                      <LinkIcon size={22} />
                    </div>
                    <span className="text-xs font-bold text-gray-800">Link Externo de Vídeo</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 mb-3">YouTube, Vimeo ou Instagram Reels</span>
                    <button
                      type="button"
                      onClick={() => setShowAddVideoModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-white px-4 py-2 rounded-xl shadow-xs border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
                    >
                      <Plus size={14} /> Inserir Link
                    </button>
                  </div>
                </div>
              )}

              {/* Modal para Inserir Link de Vídeo */}
              {showAddVideoModal && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-lg space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Adicionar Link de Vídeo
                    </h5>
                    <button
                      onClick={() => setShowAddVideoModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      Fechar
                    </button>
                  </div>
                  <form onSubmit={handleAddVideoLink} className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={videoLinkInput}
                      onChange={(e) => setVideoLinkInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/..."
                      className="flex-1 p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-primary hover:bg-accent text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </form>
                </div>
              )}

              {/* Lista dos Vídeos Cadastrados */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Play size={15} className="text-primary" /> Vídeos Cadastrados ({videosCount})
                </h5>

                {videosCount === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Video size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Nenhum vídeo cadastrado para esta obra ainda.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Faça o upload ou insira o link acima (máx. 2 vídeos).</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentVideos.map((videoUrl, idx) => {
                      const isDirectFile = videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.startsWith('blob:');

                      return (
                        <div
                          key={idx}
                          className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-md flex flex-col"
                        >
                          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                            {isDirectFile ? (
                              <video
                                src={videoUrl}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="p-4 text-center text-white space-y-2">
                                <Play size={36} className="mx-auto text-primary" />
                                <span className="block text-xs font-bold truncate max-w-xs">{videoUrl}</span>
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block text-[11px] text-amber-300 hover:underline"
                                >
                                  Abrir link externo
                                </a>
                              </div>
                            )}
                            <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                              Vídeo #{idx + 1}
                            </span>
                          </div>

                          <div className="p-3 bg-gray-800/90 flex items-center justify-between gap-2 border-t border-gray-700">
                            <span className="text-[11px] text-gray-300 truncate max-w-[200px]">
                              {isDirectFile ? 'Arquivo de Vídeo Hospedado' : 'Link de Vídeo Externo'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(idx)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Remover vídeo"
                            >
                              <Trash2 size={13} /> Excluir Vídeo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 2: MODO FOTOS (ATÉ 10) */}
          {/* ========================================================================= */}
          {mediaType === 'photos' && (
            <div className="space-y-6">
              {/* Barra de Progresso e Contador */}
              <div className="bg-secondary/40 rounded-2xl p-4 sm:p-5 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Images size={18} className="text-primary" />
                    <span className="font-bold text-gray-800 text-sm">Galeria de Fotos da Obra</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fotos exibidas aos clientes quando clicam em <strong>"Evolução das Obras"</strong> na página principal.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Fotos cadastradas:</span>
                    <span className={`text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-lg ${
                      isPhotosMaxReached 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-primary text-white'
                    }`}>
                      {photosCount} de {MAX_PHOTOS}
                    </span>
                  </div>
                  <div className="w-36 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isPhotosMaxReached ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ width: `${(photosCount / MAX_PHOTOS) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Alerta de Limite Máximo Atingido */}
              {isPhotosMaxReached && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 text-amber-600" />
                  <span>
                    <strong>Limite de {MAX_PHOTOS} fotos atingido!</strong> Para adicionar novas fotos a este empreendimento, exclua alguma foto existente abaixo.
                  </span>
                </div>
              )}

              {/* Zona de Upload de Fotos */}
              {!isPhotosMaxReached && (
                <label
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isUploading
                      ? 'border-gray-300 bg-gray-50 opacity-60 pointer-events-none'
                      : 'border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleUploadPhotos}
                    disabled={isUploading}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-inner">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <UploadCloud size={24} />
                    )}
                  </div>

                  <p className="text-sm font-bold text-gray-800 mb-1">
                    {isUploading ? 'Enviando fotos para o Storage...' : 'Clique ou arraste novas fotos da obra aqui'}
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Formatos aceitos: JPG, PNG, WebP. Você pode selecionar até <strong>{remainingPhotoSlots} foto(s)</strong> de uma vez.
                  </p>

                  {!isUploading && (
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-white px-4 py-2 rounded-xl shadow-xs border border-primary/20">
                      <Plus size={14} /> Selecionar Fotos
                    </span>
                  )}
                </label>
              )}

              {/* Grade de Fotos Cadastradas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Images size={15} className="text-primary" /> Fotos da Galeria ({photosCount})
                  </h5>
                  <span className="text-[11px] text-gray-400">
                    Dica: A foto com a estrela é a capa do card na seção pública.
                  </span>
                </div>

                {photosCount === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Images size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Nenhuma foto adicionada à galeria desta obra ainda.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Faça o upload acima para habilitar o modal de fotos na página.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentGallery.map((imgUrl, idx) => {
                      const isCover = activeProperty.image_url === imgUrl;
                      return (
                        <div
                          key={idx}
                          className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col"
                        >
                          <SmartImage
                            src={imgUrl}
                            alt={`${activeProperty.title} foto ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>

                          {isCover && (
                            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                              <Star size={10} className="fill-white" /> Capa
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(idx)}
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                                title="Excluir esta foto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetAsCover(imgUrl)}
                                className="w-full bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Tornar imagem principal"
                              >
                                <Star size={12} className="text-amber-500" /> Definir como Capa
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
