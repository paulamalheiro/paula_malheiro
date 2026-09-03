import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { ImageUploader } from './ImageUploader';
import { SmartImage } from '../common/SmartImage';
import { uploadBannerFile } from '../../lib/supabase';
import type { Property, PropertyActionType } from '../../types/property';

export const PropertiesManager: React.FC = () => {
  const { properties, loading, saveProperty, deleteProperty } = useProperties();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Partial<Property> | null>(null);
  const [selectedMainImage, setSelectedMainImage] = useState<File | null>(null);
  const [galleryUploadFiles, setGalleryUploadFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenNew = () => {
    setEditingProperty({
      title: '',
      tag: 'LANÇAMENTO',
      location: '',
      description: '',
      image_url: '',
      is_featured: true,
      is_construction: false,
      action_type: 'dates_modal',
      action_url: '',
      gallery_images: [],
      order_index: properties.length + 1,
    });
    setSelectedMainImage(null);
    setGalleryUploadFiles([]);
    setIsEditing(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty({ ...prop });
    setSelectedMainImage(null);
    setGalleryUploadFiles([]);
    setIsEditing(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o empreendimento "${title}"?`)) {
      try {
        await deleteProperty(id);
        setFeedback({ type: 'success', message: `Empreendimento "${title}" removido com sucesso.` });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erro ao excluir.' });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty?.title || !editingProperty?.location) {
      setFeedback({ type: 'error', message: 'Preencha os campos obrigatórios (Título e Localização).' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      let finalImageUrl = editingProperty.image_url || '';

      // Upload da imagem principal
      if (selectedMainImage) {
        const uploadRes = await uploadBannerFile(selectedMainImage, 'properties');
        finalImageUrl = uploadRes.publicUrl;
      }

      if (!finalImageUrl) {
        throw new Error('É necessário selecionar uma imagem principal para o empreendimento.');
      }

      // Upload de novas imagens para a galeria da obra
      const newGalleryUrls: string[] = [...(editingProperty.gallery_images || [])];
      for (const file of galleryUploadFiles) {
        const res = await uploadBannerFile(file, 'gallery');
        newGalleryUrls.push(res.publicUrl);
      }

      const payload: Partial<Property> = {
        ...editingProperty,
        image_url: finalImageUrl,
        gallery_images: newGalleryUrls,
        order_index: Number(editingProperty.order_index) || 0,
      };

      await saveProperty(payload);

      setFeedback({
        type: 'success',
        message: 'Empreendimento salvo com sucesso no banco de dados!',
      });
      setIsEditing(false);
      setEditingProperty(null);
    } catch (err: any) {
      console.error('[PropertiesManager] Erro ao salvar:', err);
      setFeedback({ type: 'error', message: err.message || 'Erro ao salvar empreendimento.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    if (editingProperty) {
      const currentGallery = editingProperty.gallery_images || [];
      setEditingProperty({
        ...editingProperty,
        gallery_images: currentGallery.filter((_, idx) => idx !== indexToRemove),
      });
    }
  };

  const handleAddGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setGalleryUploadFiles((prev) => [...prev, ...filesArray]);
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
            Cadastre e controle quais imóveis aparecem em <strong>Destaque</strong> e na <strong>Evolução das Obras</strong>.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Novo Empreendimento
        </button>
      </div>

      {/* Modal / Formulário de Criação/Edição */}
      {isEditing && editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers size={20} className="text-primary" />
                {editingProperty.id ? 'Editar Empreendimento' : 'Novo Empreendimento'}
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Imagem Principal */}
              <ImageUploader
                currentImagePath={editingProperty.image_url}
                onImageSelected={(file) => setSelectedMainImage(file)}
                aspectRatio="aspect-[3/4]"
                recommendedResolution="1000 x 1333 px (Vertical)"
              />

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
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
                    Tag / Selo
                  </label>
                  <input
                    type="text"
                    value={editingProperty.tag || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, tag: e.target.value })}
                    placeholder="Ex: LANÇAMENTO, EM OBRAS"
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Localização *
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={4}
                    value={editingProperty.description || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                    placeholder="Destaques, plantas, diferenciais e condições comerciais..."
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
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

              {/* Toggles de Exibição nas Seções */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Onde este empreendimento deve aparecer?
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle Destaque */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-amber-500" />
                      <span className="text-xs font-bold text-gray-800">Empreendimentos em Destaque</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingProperty.is_featured ?? true}
                      onChange={(e) => setEditingProperty({ ...editingProperty, is_featured: e.target.checked })}
                      className="w-4 h-4 text-primary rounded-md focus:ring-primary"
                    />
                  </label>

                  {/* Toggle Evolução da Obra */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <Hammer size={18} className="text-primary" />
                      <span className="text-xs font-bold text-gray-800">Evolução das Obras</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingProperty.is_construction ?? false}
                      onChange={(e) => setEditingProperty({ ...editingProperty, is_construction: e.target.checked })}
                      className="w-4 h-4 text-primary rounded-md focus:ring-primary"
                    />
                  </label>
                </div>
              </div>

              {/* Configurações Especiais de Ação (Evolução das Obras) */}
              {editingProperty.is_construction && (
                <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in">
                  <h5 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Hammer size={14} /> Comportamento ao clicar na Evolução da Obra
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

                  {editingProperty.action_type === 'gallery' && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-gray-700">
                        Fotos da Galeria da Obra:
                      </label>

                      {/* Lista de Fotos Existentes */}
                      {editingProperty.gallery_images && editingProperty.gallery_images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {editingProperty.gallery_images.map((imgUrl, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                              <SmartImage src={imgUrl} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(idx)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover foto"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload de mais fotos */}
                      <label className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white bg-white/50 transition-colors">
                        <UploadCloud size={20} className="text-primary mb-1" />
                        <span className="text-xs font-bold text-gray-700">Adicionar mais fotos à galeria</span>
                        <span className="text-[10px] text-gray-400">Selecione uma ou mais fotos</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAddGalleryFiles}
                          className="hidden"
                        />
                      </label>
                      {galleryUploadFiles.length > 0 && (
                        <div className="text-xs text-amber-700">
                          {galleryUploadFiles.length} nova(s) foto(s) pronta(s) para upload ao salvar.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botões do Modal */}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
