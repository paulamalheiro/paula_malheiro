import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Star, 
  Hammer, 
  Instagram, 
  Images, 
  Clock, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  UploadCloud,
  Layers,
  Sparkles,
  Check,
  Image as ImageIcon,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { SmartImage } from '../common/SmartImage';
import { uploadBannerFile, logAuditEvent } from '../../lib/supabase';
import type { Property, PropertyActionType } from '../../types/property';

const MAX_GALLERY_PHOTOS = 10;

interface PendingGalleryFile {
  file: File;
  previewUrl: string;
}

export const PropertiesManager: React.FC = () => {
  const { properties, loading, saveProperty, deleteProperty } = useProperties();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'construction'>('details');
  const [isUploadingProgressCover, setIsUploadingProgressCover] = useState(false);
  
  // Fotos pendentes de upload com pré-visualização imediata
  const [pendingUploadFiles, setPendingUploadFiles] = useState<PendingGalleryFile[]>([]);
  // Índice do arquivo pendente selecionado como capa (se aplicável)
  const [pendingCoverIndex, setPendingCoverIndex] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Limpa URLs de preview criadas ao fechar ou salvar
  const cleanupPreviews = () => {
    pendingUploadFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingUploadFiles([]);
    setPendingCoverIndex(null);
  };

  const handleOpenNew = () => {
    cleanupPreviews();
    setModalTab('details');
    setEditingProperty({
      title: '',
      tag: 'LANÇAMENTO',
      location: '',
      description: '',
      image_url: '',
      progress_cover_image: '',
      is_featured: true,
      is_construction: false,
      action_type: 'dates_modal',
      action_url: '',
      gallery_images: [],
      order_index: properties.length + 1,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (prop: Property) => {
    cleanupPreviews();
    setModalTab('details');
    // Garante que se a foto de capa atual não estiver na galeria, ela seja listada
    const gallery = Array.isArray(prop.gallery_images) ? [...prop.gallery_images] : [];
    if (prop.image_url && !gallery.includes(prop.image_url)) {
      gallery.unshift(prop.image_url);
    }

    setEditingProperty({
      ...prop,
      gallery_images: gallery.slice(0, MAX_GALLERY_PHOTOS),
    });
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    cleanupPreviews();
    setModalTab('details');
    setIsEditing(false);
    setEditingProperty(null);
  };

  // Upload exclusivo de foto para a capa da Evolução das Obras
  const handleUploadProgressCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingProperty) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Selecione um arquivo de imagem válido.' });
      return;
    }
    setIsUploadingProgressCover(true);
    setFeedback(null);
    try {
      const res = await uploadBannerFile(file, 'properties/obras');
      setEditingProperty((prev) => prev ? { ...prev, progress_cover_image: res.publicUrl } : prev);
      setFeedback({ type: 'success', message: 'Foto de capa da obra enviada com sucesso!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro no upload da foto de obra.' });
    } finally {
      setIsUploadingProgressCover(false);
    }
  };

  // Define uma foto já existente da galeria como capa da obra
  const handleSelectGalleryAsProgressCover = (url: string) => {
    if (!editingProperty) return;
    setEditingProperty({
      ...editingProperty,
      progress_cover_image: url,
    });
    setFeedback({ type: 'success', message: 'Foto selecionada como capa exclusiva da obra!' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o empreendimento "${title}"?`)) {
      try {
        await deleteProperty(id);
        await logAuditEvent(
          'Exclusão de Empreendimento',
          `Empreendimento "${title}" foi excluído.`,
          'Gestão de Empreendimentos'
        );
        setFeedback({ type: 'success', message: `Empreendimento "${title}" removido com sucesso.` });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao excluir.' });
      }
    }
  };

  // Fotos salvas existentes
  const savedGallery = useMemo(() => {
    return (editingProperty?.gallery_images || []) as string[];
  }, [editingProperty?.gallery_images]);

  // Contagem total de fotos (salvas + pendentes)
  const totalPhotosCount = savedGallery.length + pendingUploadFiles.length;
  const remainingSlots = Math.max(0, MAX_GALLERY_PHOTOS - totalPhotosCount);

  // Define uma foto salva existente como Capa Principal
  const handleSetSavedAsCover = (url: string) => {
    if (!editingProperty) return;
    setEditingProperty({
      ...editingProperty,
      image_url: url,
    });
    setPendingCoverIndex(null);
  };

  // Define um arquivo pendente como Capa Principal
  const handleSetPendingAsCover = (index: number) => {
    if (!editingProperty) return;
    setPendingCoverIndex(index);
    // Guarda a preview temporária para exibir na capa enquanto edita
    setEditingProperty({
      ...editingProperty,
      image_url: pendingUploadFiles[index]?.previewUrl || '',
    });
  };

  // Remove uma foto salva da galeria
  const handleRemoveSavedPhoto = (indexToRemove: number) => {
    if (!editingProperty) return;
    const removedUrl = savedGallery[indexToRemove];
    const newGallery = savedGallery.filter((_, idx) => idx !== indexToRemove);

    let newCoverUrl = editingProperty.image_url;
    // Se removeu a capa atual, elege a próxima foto da galeria como capa
    if (removedUrl === editingProperty.image_url) {
      if (newGallery.length > 0) {
        newCoverUrl = newGallery[0];
      } else if (pendingUploadFiles.length > 0) {
        newCoverUrl = pendingUploadFiles[0].previewUrl;
        setPendingCoverIndex(0);
      } else {
        newCoverUrl = '';
      }
    }

    setEditingProperty({
      ...editingProperty,
      gallery_images: newGallery,
      image_url: newCoverUrl,
    });
  };

  // Remove um arquivo pendente
  const handleRemovePendingPhoto = (indexToRemove: number) => {
    URL.revokeObjectURL(pendingUploadFiles[indexToRemove].previewUrl);
    const newPending = pendingUploadFiles.filter((_, idx) => idx !== indexToRemove);
    setPendingUploadFiles(newPending);

    if (pendingCoverIndex === indexToRemove) {
      // Reatribui a capa
      if (savedGallery.length > 0) {
        setEditingProperty((prev) => ({ ...prev, image_url: savedGallery[0] }));
        setPendingCoverIndex(null);
      } else if (newPending.length > 0) {
        setPendingCoverIndex(0);
        setEditingProperty((prev) => ({ ...prev, image_url: newPending[0].previewUrl }));
      } else {
        setEditingProperty((prev) => ({ ...prev, image_url: '' }));
        setPendingCoverIndex(null);
      }
    } else if (pendingCoverIndex !== null && pendingCoverIndex > indexToRemove) {
      setPendingCoverIndex(pendingCoverIndex - 1);
    }
  };

  // Adiciona arquivos à galeria
  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray: File[] = Array.from(e.target.files);
    const validImages = filesArray.filter((f) => f.type.startsWith('image/'));

    if (validImages.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione apenas arquivos de imagem válidos (JPG, PNG, WebP).' });
      return;
    }

    if (validImages.length > remainingSlots) {
      setFeedback({
        type: 'error',
        message: `Limite de ${MAX_GALLERY_PHOTOS} fotos! Você pode adicionar apenas mais ${remainingSlots} foto(s).`,
      });
    }

    const toAdd = validImages.slice(0, remainingSlots);
    const newPendingItems: PendingGalleryFile[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const updatedPending = [...pendingUploadFiles, ...newPendingItems];
    setPendingUploadFiles(updatedPending);

    // Se ainda não tiver capa definida, a primeira foto enviada vira a capa
    if (!editingProperty?.image_url && savedGallery.length === 0 && updatedPending.length > 0) {
      setPendingCoverIndex(0);
      setEditingProperty((prev) => ({
        ...prev,
        image_url: updatedPending[0].previewUrl,
      }));
    }

    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty?.title || !editingProperty?.location) {
      setFeedback({ type: 'error', message: 'Preencha os campos obrigatórios (Título e Localização).' });
      return;
    }

    if (totalPhotosCount === 0 && !editingProperty.image_url) {
      setFeedback({ type: 'error', message: 'Adicione pelo menos 1 foto para ser a capa do empreendimento.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      // 1. Upload de todas as novas fotos pendentes para o PocketBase Storage
      const uploadedUrls: string[] = [];
      for (const item of pendingUploadFiles) {
        const res = await uploadBannerFile(item.file, 'properties/gallery');
        uploadedUrls.push(res.publicUrl);
      }

      // 2. Determina a URL final da Capa
      let finalCoverUrl = editingProperty.image_url || '';

      if (pendingCoverIndex !== null && uploadedUrls[pendingCoverIndex]) {
        // Se a capa era um dos arquivos pendentes
        finalCoverUrl = uploadedUrls[pendingCoverIndex];
      } else if (!finalCoverUrl && (savedGallery.length > 0 || uploadedUrls.length > 0)) {
        finalCoverUrl = savedGallery[0] || uploadedUrls[0];
      }

      // 3. Monta a lista completa da galeria (máximo 10 fotos)
      let finalGallery = [...savedGallery, ...uploadedUrls];

      // Garante que a capa está presente na lista da galeria
      if (finalCoverUrl && !finalGallery.includes(finalCoverUrl) && finalGallery.length < MAX_GALLERY_PHOTOS) {
        finalGallery.unshift(finalCoverUrl);
      }

      finalGallery = finalGallery.slice(0, MAX_GALLERY_PHOTOS);

      const isNew = !editingProperty.id || editingProperty.id.startsWith('prop-') || editingProperty.id.startsWith('local-');

      const payload: Partial<Property> = {
        ...editingProperty,
        image_url: finalCoverUrl,
        gallery_images: finalGallery,
        action_type: editingProperty.action_type || (finalGallery.length > 0 ? 'gallery' : 'dates_modal'),
        order_index: Number(editingProperty.order_index) || 0,
      };

      await saveProperty(payload);
      await logAuditEvent(
        isNew ? 'Criação de Empreendimento' : 'Edição de Empreendimento',
        `Empreendimento "${payload.title}" (${payload.location}) ${isNew ? 'criado' : 'atualizado'} com ${finalGallery.length} foto(s) na galeria.`,
        'Gestão de Empreendimentos'
      );

      setFeedback({
        type: 'success',
        message: 'Empreendimento salvo com sucesso no banco de dados!',
      });
      cleanupPreviews();
      setIsEditing(false);
      setEditingProperty(null);
    } catch (err: any) {
      console.error('[PropertiesManager] Erro ao salvar:', err);
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar empreendimento.' });
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

      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-sans font-bold text-primary">Gestão de Empreendimentos</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cadastre os imóveis, gerencie até 10 fotos na galeria e escolha qual foto será a capa principal no site.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Novo Empreendimento
        </button>
      </div>

      {/* Modal / Formulário Ampliado de Criação/Edição */}
      {isEditing && editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Layers size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">
                    {editingProperty.id ? 'Editar Empreendimento' : 'Novo Empreendimento'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Defina fotos, galeria, textos e onde o imóvel será exibido no site.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Seletor de Abas do Modal */}
            <div className="flex border-b border-gray-100 px-5 sm:px-6 pt-3 gap-2 bg-gray-50/70 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  modalTab === 'details'
                    ? 'border-primary text-primary bg-white rounded-t-2xl shadow-xs'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building2 size={16} />
                <span>1. Catálogo & Imagem de Destaque</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('construction')}
                className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  modalTab === 'construction'
                    ? 'border-primary text-primary bg-white rounded-t-2xl shadow-xs'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Hammer size={16} />
                <span>2. Acompanhamento / Evolução de Obra</span>
                {editingProperty.is_construction && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* =========================================================================
                  ABA 1: DADOS DO EMPREENDIMENTO & IMAGEM DE DESTAQUE (CATÁLOGO)
                  ========================================================================= */}
              {modalTab === 'details' && (
                <div className="space-y-6">
                  {/* SEÇÃO DE FOTOS & ESCOLHA DA CAPA (ATÉ 10 FOTOS) */}
                  <div className="p-5 rounded-3xl bg-gray-50/80 border border-gray-200/80 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                          <Images size={16} className="text-primary" />
                          Galeria de Fotos & Foto de Capa (Catálogo)
                        </h5>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Adicione até 10 fotos para o empreendimento. Clique em <strong>&quot;Definir como Capa&quot;</strong> na foto que deve aparecer como capa principal no catálogo.
                        </p>
                      </div>

                      <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${
                        totalPhotosCount >= MAX_GALLERY_PHOTOS 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {totalPhotosCount} de {MAX_GALLERY_PHOTOS} fotos adicionadas
                      </span>
                    </div>

                    {/* Banner da Foto de Capa Atual */}
                    {editingProperty.image_url ? (
                      <div className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
                        <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-amber-300 relative shadow-xs bg-gray-100">
                          <SmartImage
                            src={editingProperty.image_url}
                            alt="Capa Selecionada"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs">
                            <Star size={10} className="fill-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mb-1">
                            <Star size={12} className="fill-amber-500 text-amber-500" /> Foto de Capa do Catálogo
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            Esta é a foto principal exibida nos cartões de lançamentos e catálogo público do site.
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Para trocar, basta clicar em &quot;Definir como Capa&quot; em qualquer outra foto da galeria abaixo.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0 text-amber-600" />
                        <span>Nenhuma foto selecionada como capa ainda. Adicione fotos na galeria abaixo e escolha uma como capa.</span>
                      </div>
                    )}

                    {/* Grid de Fotos (Salvas + Pendentes) */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {/* Fotos Salvas no PocketBase */}
                        {savedGallery.map((url, idx) => {
                          const isCover = url === editingProperty.image_url && pendingCoverIndex === null;
                          return (
                            <div
                              key={`saved-${idx}`}
                              className={`relative aspect-[3/4] rounded-2xl overflow-hidden group border transition-all ${
                                isCover
                                  ? 'ring-3 ring-amber-500 border-amber-400 shadow-md scale-[1.02]'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <SmartImage
                                src={url}
                                alt={`Foto galeria ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />

                              {/* Badge de Capa */}
                              {isCover ? (
                                <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                                  <Star size={10} className="fill-white" /> Capa
                                </span>
                              ) : (
                                <span className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                                  #{idx + 1}
                                </span>
                              )}

                              {/* Ações ao passar o mouse */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSavedPhoto(idx)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                                    title="Remover foto da galeria"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetSavedAsCover(url)}
                                    className="w-full py-1.5 px-2 bg-white/95 hover:bg-white text-gray-900 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                  >
                                    <Star size={11} className="text-amber-500" /> Tornar Capa
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Fotos Pendentes de Upload */}
                        {pendingUploadFiles.map((pending, idx) => {
                          const isCover = pendingCoverIndex === idx;
                          return (
                            <div
                              key={`pending-${idx}`}
                              className={`relative aspect-[3/4] rounded-2xl overflow-hidden group border-2 border-dashed transition-all ${
                                isCover
                                  ? 'ring-3 ring-amber-500 border-amber-400 shadow-md scale-[1.02]'
                                  : 'border-primary/40 bg-primary/5'
                              }`}
                            >
                              <img
                                src={pending.previewUrl}
                                alt={`Prévia ${idx + 1}`}
                                className="w-full h-full object-cover opacity-90"
                              />

                              {/* Badge de Pendente / Capa */}
                              {isCover ? (
                                <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                                  <Star size={10} className="fill-white" /> Capa
                                </span>
                              ) : (
                                <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                  Nova
                                </span>
                              )}

                              {/* Ações da foto pendente */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePendingPhoto(idx)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                                    title="Remover foto"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPendingAsCover(idx)}
                                    className="w-full py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-gray-900 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                  >
                                    <Star size={11} className="text-amber-900" /> Tornar Capa
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Botão para Adicionar Novas Fotos (Se limite não foi atingido) */}
                        {remainingSlots > 0 && (
                          <label className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary bg-white hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group shadow-xs">
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={handleAddPhotos}
                              className="hidden"
                            />
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-800 block">Adicionar Fotos</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              {remainingSlots} vaga(s) restante(s)
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FORMULÁRIO DE DADOS GERAIS */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Edit2 size={16} className="text-primary" />
                      Informações Principais
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Título do Empreendimento *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProperty.title || ''}
                          onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                          placeholder="Ex: DUQUE Lavenir Residence"
                          className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Tag / Status Comercial
                        </label>
                        <input
                          type="text"
                          value={editingProperty.tag || ''}
                          onChange={(e) => setEditingProperty({ ...editingProperty, tag: e.target.value })}
                          placeholder="Ex: LANÇAMENTO, PRONTO, EM OBRAS"
                          className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Localização / Bairro *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProperty.location || ''}
                          onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                          placeholder="Ex: Próximo a Olívia Flores"
                          className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Ordem de Exibição
                        </label>
                        <input
                          type="number"
                          value={editingProperty.order_index ?? 0}
                          onChange={(e) => setEditingProperty({ ...editingProperty, order_index: parseInt(e.target.value) || 0 })}
                          className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Descrição Comercial
                      </label>
                      <textarea
                        rows={3}
                        value={editingProperty.description || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                        placeholder="Destaques, plantas, diferenciais e condições comerciais..."
                        className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
                      />
                    </div>

                    {/* Toggle Exibir em Destaque */}
                    <div className="pt-2">
                      <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer hover:bg-gray-100/70 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <Star size={18} className="text-amber-500" />
                          <div>
                            <span className="text-xs font-bold text-gray-800 block">Exibir em "Empreendimentos em Destaque"</span>
                            <span className="text-[11px] text-gray-500">Apresenta o cartão deste imóvel na grade principal do catálogo</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={editingProperty.is_featured ?? true}
                          onChange={(e) => setEditingProperty({ ...editingProperty, is_featured: e.target.checked })}
                          className="w-4 h-4 text-primary rounded-md focus:ring-primary"
                        />
                      </label>
                    </div>

                    {/* Botão de Avanço Rápido para a Aba 2 */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalTab('construction')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        <span>Avançar para Configurações de Obras</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  ABA 2: ACOMPANHAMENTO / EVOLUÇÃO DE OBRA (GESTÃO DESACOPLADA)
                  ========================================================================= */}
              {modalTab === 'construction' && (
                <div className="space-y-6">
                  {/* Toggle Principal de Ativação da Obra */}
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Hammer size={20} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800 block">
                          Exibir este empreendimento na seção &quot;Evolução das Obras&quot;
                        </span>
                        <span className="text-xs text-gray-500">
                          Habilita o card deste empreendimento no carrossel de acompanhamento de obras da página inicial.
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingProperty.is_construction ?? false}
                      onChange={(e) => setEditingProperty({ ...editingProperty, is_construction: e.target.checked })}
                      className="w-5 h-5 text-primary rounded-md focus:ring-primary"
                    />
                  </label>

                  {editingProperty.is_construction ? (
                    <div className="space-y-6 animate-in fade-in">
                      {/* BLOCO: FOTO DE CAPA EXCLUSIVA DA OBRA */}
                      <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-300/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/50">
                          <div>
                            <h5 className="text-sm font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                              <Star size={16} className="text-amber-500 fill-amber-500" />
                              Foto de Capa Exclusiva da Evolução das Obras
                            </h5>
                            <p className="text-xs text-amber-800/80 mt-0.5">
                              Esta foto aparece exclusivamente no card da seção &quot;Evolução das Obras&quot;. <strong>Não altera</strong> a capa do catálogo!
                            </p>
                          </div>
                        </div>

                        {/* Banner de Prévia da Capa da Obra */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                          <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-amber-300 shadow-xs bg-gray-100">
                            <SmartImage
                              src={editingProperty.progress_cover_image || editingProperty.image_url}
                              alt="Capa da Obra"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-wider">
                              Capa Obra
                            </span>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="text-xs text-gray-700">
                              <strong>Status:</strong>{' '}
                              {editingProperty.progress_cover_image ? (
                                <span className="text-emerald-700 font-bold">Capa exclusiva de obra configurada</span>
                              ) : (
                                <span className="text-amber-700">Utilizando imagem padrão do catálogo como fallback</span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs">
                                <UploadCloud size={14} />
                                <span>{isUploadingProgressCover ? 'Enviando...' : 'Upload de Foto para a Obra'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/jpg"
                                  onChange={handleUploadProgressCover}
                                  disabled={isUploadingProgressCover}
                                  className="hidden"
                                />
                              </label>

                              {editingProperty.progress_cover_image && (
                                <button
                                  type="button"
                                  onClick={() => setEditingProperty({ ...editingProperty, progress_cover_image: '' })}
                                  className="text-xs text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  Restaurar padrão
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Atalho para escolher uma foto da galeria existente como capa da obra */}
                        {savedGallery.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold text-gray-700 block">
                              Ou selecione uma das fotos já salvas na galeria para ser a capa da obra:
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto pb-2">
                              {savedGallery.map((url, idx) => {
                                const isProgCover = editingProperty.progress_cover_image === url;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectGalleryAsProgressCover(url)}
                                    className={`relative w-14 h-18 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                                      isProgCover
                                        ? 'ring-2 ring-amber-500 border-amber-400 scale-105 shadow-sm'
                                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                                    }`}
                                    title="Definir esta foto como capa da obra"
                                  >
                                    <SmartImage src={url} alt={`Opção ${idx + 1}`} className="w-full h-full object-cover" />
                                    {isProgCover && (
                                      <span className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                        <Check size={16} className="text-white drop-shadow-md" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Configurações Especiais de Ação (Evolução das Obras) */}
                      <div className="space-y-4 p-5 rounded-3xl bg-gray-50/80 border border-gray-200/80">
                        <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Hammer size={14} className="text-primary" />
                          Comportamento ao clicar no card da Obra
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { type: 'dates_modal' as PropertyActionType, label: 'Modal "Aguardem"', icon: <Clock size={14} /> },
                            { type: 'instagram' as PropertyActionType, label: 'Link Instagram / Vídeo', icon: <Instagram size={14} /> },
                            { type: 'gallery' as PropertyActionType, label: 'Galeria de Fotos', icon: <Images size={14} /> },
                          ].map((opt) => (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => setEditingProperty({ ...editingProperty, action_type: opt.type })}
                              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                editingProperty.action_type === opt.type
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>

                        {editingProperty.action_type === 'instagram' && (
                          <div className="space-y-1 pt-2">
                            <label className="block text-xs font-bold text-gray-700">
                              Link do Instagram / Reel da Obra:
                            </label>
                            <input
                              type="url"
                              value={editingProperty.action_url || ''}
                              onChange={(e) => setEditingProperty({ ...editingProperty, action_url: e.target.value })}
                              placeholder="https://www.instagram.com/reel/..."
                              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-xs">
                      <Hammer size={28} className="mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Empreendimento não listado na Evolução das Obras</p>
                      <p className="mt-1 max-w-sm mx-auto">
                        Para gerenciar a foto de capa e acompanhamento desta obra, marque a opção acima &quot;Exibir este empreendimento na seção Evolução das Obras&quot;.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botões do Modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                      <span>Salvando Empreendimento...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Salvar Empreendimento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Empreendimentos Cadastrados */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Carregando empreendimentos...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8">
          <p className="text-sm font-bold text-gray-700">Nenhum empreendimento cadastrado ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Clique no botão acima para adicionar o primeiro imóvel!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex gap-4 items-start"
            >
              <div className="relative w-24 aspect-[3/4] rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                <SmartImage
                  src={prop.image_url}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                  #{prop.order_index}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {prop.tag || 'Lançamento'}
                    </span>
                    <h4 className="font-bold text-sm text-gray-800 truncate mt-1">{prop.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="shrink-0 text-primary" /> {prop.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(prop)}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(prop.id, prop.title)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prop.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> Destaque
                    </span>
                  )}
                  {prop.is_construction && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      <Hammer size={11} /> Evolução das Obras
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                    <Images size={11} /> {prop.gallery_images?.length || 0} fotos
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
