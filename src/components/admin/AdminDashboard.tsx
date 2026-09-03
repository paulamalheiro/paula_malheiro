import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut, 
  ExternalLink, 
  Save, 
  Sliders,
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  Image as ImageIcon,
  Building2,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBanners, DEFAULT_BANNERS } from '../../hooks/useBanners';
import { ImageUploader } from './ImageUploader';
import { PropertiesManager } from './PropertiesManager';
import { CampaignsManager } from './CampaignsManager';
import { ConstructionProgressManager } from './ConstructionProgressManager';
import { upsertBannerToDb, uploadBannerFile, BUCKET_NAME } from '../../lib/supabase';
import type { Banner, SectionMeta } from '../../types/banner';

type DashboardTab = 'banners' | 'properties' | 'campaigns';

const SECTIONS_CONFIG: Record<string, SectionMeta> = {
  hero: {
    key: 'hero',
    label: 'Banner Principal (Hero)',
    description: 'Imagem principal exibida no topo da página de entrada ao lado da chamada inicial.',
    aspectRatio: 'aspect-[4/5]',
    recommendedResolution: '1200 x 1500 px (Vertical)',
    defaultImage: '/paula-hero.jpeg',
    hasTextConfig: true,
  },
  construction: {
    key: 'construction',
    label: 'Acompanhamento de Obras',
    description: 'Galeria fotográfica de cada empreendimento em obras (até 10 fotos por obra).',
    aspectRatio: 'aspect-[3/4]',
    recommendedResolution: '1000 x 1333 px',
    defaultImage: '',
    hasTextConfig: false,
  },
  about: {
    key: 'about',
    label: 'Sobre Mim (Foto de Perfil)',
    description: 'Fotografia profissional exibida na seção da história e credenciais da corretora.',
    aspectRatio: 'aspect-[4/5]',
    recommendedResolution: '800 x 1000 px (Retrato)',
    defaultImage: '/paula-perfil.jpeg',
    hasTextConfig: true,
  },
  investment: {
    key: 'investment',
    label: 'Investimento & Vantagens',
    description: 'Foto em destaque no bloco de alta valorização e segurança imobiliária.',
    aspectRatio: 'aspect-square',
    recommendedResolution: '800 x 800 px (Quadrada)',
    defaultImage: '/velli.jpeg',
    hasTextConfig: true,
  },
};

export const AdminDashboard: React.FC = () => {
  const { user, signOut, isLocalDev } = useAuth();
  const { banners, refreshBanners, getBanner } = useBanners();

  const [activeTab, setActiveTab] = useState<DashboardTab>('properties');
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [formData, setFormData] = useState<Partial<Banner>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Carrega os dados do banner selecionado
  useEffect(() => {
    const currentBanner = getBanner(activeSection);
    const fallback: Partial<Banner> = DEFAULT_BANNERS[activeSection] || {};
    
    setFormData({
      section: activeSection,
      title: currentBanner.title ?? fallback.title ?? '',
      subtitle: currentBanner.subtitle ?? fallback.subtitle ?? '',
      tag: currentBanner.tag ?? fallback.tag ?? '',
      image_path: currentBanner.image_path || fallback.image_path || '',
      button_text: currentBanner.button_text ?? fallback.button_text ?? '',
      button_link: currentBanner.button_link ?? fallback.button_link ?? '',
      active: currentBanner.active ?? true,
    });
    setSelectedFile(null);
  }, [activeSection, banners]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      let finalImagePath = formData.image_path || '';

      if (selectedFile) {
        const uploadResult = await uploadBannerFile(selectedFile, activeSection);
        finalImagePath = uploadResult.path;
      }

      if (!finalImagePath) {
        throw new Error('É obrigatório ter uma imagem definida para o banner.');
      }

      const bannerPayload: Banner = {
        section: activeSection,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        tag: formData.tag || null,
        image_path: finalImagePath,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        active: formData.active ?? true,
      };

      await upsertBannerToDb(bannerPayload);
      await refreshBanners();

      setSelectedFile(null);
      setFeedback({
        type: 'success',
        message: 'Banner atualizado com sucesso!',
      });
    } catch (err: any) {
      console.error('[AdminDashboard] Erro ao salvar banner:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Falha ao salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefault = () => {
    const defaultData = DEFAULT_BANNERS[activeSection];
    if (defaultData) {
      setFormData({
        ...defaultData,
      });
      setSelectedFile(null);
      setFeedback({
        type: 'success',
        message: 'Valores padrão restaurados no formulário. Clique em "Salvar Alterações" para aplicar.',
      });
    }
  };

  const currentSectionMeta = SECTIONS_CONFIG[activeSection] || {
    key: activeSection,
    label: `Seção: ${activeSection}`,
    description: 'Seção personalizada de banner.',
    aspectRatio: 'aspect-[4/5]',
    recommendedResolution: '1200 x 1500 px',
    defaultImage: '/paula-hero.jpeg',
    hasTextConfig: true,
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col">
      {/* Header Principal */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xl font-sans text-primary font-bold leading-none tracking-tight">
                Paula Malheiro
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mt-1">
                Painel Administrativo
              </span>
            </div>
            {isLocalDev ? (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300">
                ⚡ Modo Local / Teste
              </span>
            ) : (
              <span className="hidden sm:inline-block bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-1 rounded-full border border-primary/20">
                Supabase Coolify
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-all"
            >
              <Eye size={14} />
              <span className="hidden md:inline">Ver Site ao Vivo</span>
              <ExternalLink size={12} className="opacity-50" />
            </Link>

            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação Principal do Painel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-gray-100 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'properties'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 size={16} /> Empreendimentos & Obras
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'campaigns'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Megaphone size={16} /> Campanhas & Pop-up
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon size={16} /> Banners Principais
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* ABA 1: EMPREENDIMENTOS */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <PropertiesManager />
          </div>
        )}

        {/* ABA 2: CAMPANHAS / POP-UP */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <CampaignsManager />
          </div>
        )}

        {/* ABA 3: BANNERS PRINCIPAIS */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Lateral: Seleção de Seções */}
              <aside className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Sliders size={18} className="text-primary" />
                      <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
                        Seções do Site
                      </h3>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                      {Object.keys(SECTIONS_CONFIG).length} seções
                    </span>
                  </div>

                  <div className="space-y-2">
                    {Object.values(SECTIONS_CONFIG).map((section) => {
                      const isSelected = activeSection === section.key;
                      return (
                        <button
                          key={section.key}
                          onClick={() => setActiveSection(section.key)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                              : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{section.label}</span>
                            {isSelected && <Sparkles size={16} className="text-amber-300" />}
                          </div>
                          <span
                            className={`text-xs leading-relaxed line-clamp-1 ${
                              isSelected ? 'text-white/80' : 'text-gray-500'
                            }`}
                          >
                            {section.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Storage Bucket:</span>
                      <strong className="text-gray-700 font-mono">{BUCKET_NAME}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuário Autenticado:</span>
                      <strong className="text-gray-700 truncate max-w-[160px]">{user?.email}</strong>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Área Principal: Edição de Banner ou Acompanhamento de Obras */}
              {activeSection === 'construction' ? (
                <section className="lg:col-span-8">
                  <ConstructionProgressManager />
                </section>
              ) : (
                <section className="lg:col-span-8">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-4">
                      <div>
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">
                          Gerenciar Conteúdo
                        </span>
                        <h2 className="text-2xl font-sans font-bold text-primary">
                          {currentSectionMeta.label}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {currentSectionMeta.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleRestoreDefault}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
                        title="Restaurar padrão inicial"
                      >
                        <RefreshCw size={13} /> Padrão
                      </button>
                    </div>

                    <form onSubmit={handleSaveBanner} className="space-y-6">
                      <ImageUploader
                        currentImagePath={formData.image_path}
                        onImageSelected={(file) => setSelectedFile(file)}
                        aspectRatio={currentSectionMeta.aspectRatio}
                        recommendedResolution={currentSectionMeta.recommendedResolution}
                      />

                      {currentSectionMeta.hasTextConfig && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                            Textos & Chamadas
                          </h4>

                          {activeSection === 'hero' && (
                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Tag / Etiqueta Superior
                              </label>
                              <input
                                type="text"
                                value={formData.tag || ''}
                                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                placeholder="Ex: Especialista em Imóveis na Planta"
                                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                              Título / Chamada Principal
                            </label>
                            <input
                              type="text"
                              value={formData.title || ''}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Título exibido na seção"
                              className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                              Subtítulo / Descrição Auxiliar
                            </label>
                            <textarea
                              rows={3}
                              value={formData.subtitle || ''}
                              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                              placeholder="Texto descritivo ou de apoio"
                              className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y"
                            />
                          </div>

                          {activeSection === 'hero' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                  Texto do Botão
                                </label>
                                <input
                                  type="text"
                                  value={formData.button_text || ''}
                                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                  placeholder="Ex: Conheça os Empreendimentos"
                                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                  Link do Botão
                                </label>
                                <input
                                  type="text"
                                  value={formData.button_link || ''}
                                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                                  placeholder="Ex: #projects ou https://..."
                                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200/70">
                        <div>
                          <span className="block text-sm font-bold text-gray-800">Status da Seção</span>
                          <span className="text-xs text-gray-500">
                            Defina se as informações personalizadas estão ativas no site público
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.active ?? true}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Salvando...</span>
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              <span>Salvar Alterações</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
