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
  Image as ImageIcon,
  Building2,
  Megaphone,
  Settings,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBanners, DEFAULT_BANNERS } from '../../hooks/useBanners';
import { ImageUploader } from './ImageUploader';
import { PropertiesManager } from './PropertiesManager';
import { CampaignsManager } from './CampaignsManager';
import { ConstructionProgressManager } from './ConstructionProgressManager';
import { ClientsManager } from './ClientsManager';
import { AccessLogsManager } from './AccessLogsManager';
import { SettingsModal } from './SettingsModal';
import { upsertBannerToDb, uploadBannerFile, logAuditEvent, BUCKET_NAME } from '../../lib/supabase';
import type { Banner, SectionMeta } from '../../types/banner';

type DashboardTab = 'banners' | 'properties' | 'campaigns' | 'clients' | 'access_logs';

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

/**
 * Componente isolado para edição de banner por seção.
 * Garante que o estado, inputs e payload pertençam 100% à seção ativa (sem contaminação cruzada).
 */
interface BannerSectionEditorProps {
  sectionKey: string;
  sectionMeta: SectionMeta;
  banner: Banner;
  onSaved: () => Promise<void>;
}

const BannerSectionEditor: React.FC<BannerSectionEditorProps> = ({
  sectionKey,
  sectionMeta,
  banner,
  onSaved,
}) => {
  const fallback: Partial<Banner> = DEFAULT_BANNERS[sectionKey] || {};
  const [formData, setFormData] = useState<Partial<Banner>>({
    section: sectionKey,
    title: banner?.title ?? fallback.title ?? '',
    subtitle: banner?.subtitle ?? fallback.subtitle ?? '',
    tag: banner?.tag ?? fallback.tag ?? '',
    image_path: banner?.image_path || fallback.image_path || '',
    button_text: banner?.button_text ?? fallback.button_text ?? '',
    button_link: banner?.button_link ?? fallback.button_link ?? '',
    active: banner?.active ?? true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
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
        const uploadResult = await uploadBannerFile(selectedFile, sectionKey);
        finalImagePath = uploadResult.path;
      }

      if (!finalImagePath) {
        throw new Error('É obrigatório ter uma imagem definida para o banner.');
      }

      // Payload estritamente isolado: NUNCA envia outra seção
      const bannerPayload: Banner = {
        id: banner?.id,
        section: sectionKey,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        tag: formData.tag || null,
        image_path: finalImagePath,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        active: formData.active ?? true,
      };

      await upsertBannerToDb(bannerPayload);
      await logAuditEvent(
        'Atualização de Banner',
        `Banner da seção "${sectionMeta.label}" atualizado com sucesso.`,
        'Banners Principais'
      );
      await onSaved();

      setSelectedFile(null);
      setFeedback({
        type: 'success',
        message: `Seção "${sectionMeta.label}" atualizada com sucesso!`,
      });
    } catch (err: any) {
      console.error('[BannerSectionEditor] Erro ao salvar banner:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Falha ao salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefault = () => {
    const defaultData = DEFAULT_BANNERS[sectionKey];
    if (defaultData) {
      setFormData({
        ...defaultData,
        section: sectionKey,
      });
      setSelectedFile(null);
      setFeedback({
        type: 'success',
        message: `Valores originais de "${sectionMeta.label}" restaurados no formulário. Clique em "Salvar Alterações" para aplicar ao site.`,
      });
    }
  };

  // Metadados visuais de isolamento para orientar o usuário com total clareza
  const noticeConfig = (() => {
    if (sectionKey === 'hero') {
      return {
        badge: 'SEÇÃO HERO / TOPO DO SITE',
        badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
        cardBg: 'bg-amber-50/80 border-amber-200',
        title: 'Você está editando o Banner Principal (Hero)',
        description: 'Esta seção altera exclusivamente a mensagem de boas-vindas inicial e o botão no topo do site. Suas alterações aqui NÃO afetam a sua biografia ("Minha História").',
      };
    }
    if (sectionKey === 'about') {
      return {
        badge: 'SEÇÃO SOBRE MIM / MINHA HISTÓRIA',
        badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        cardBg: 'bg-emerald-50/80 border-emerald-200',
        title: 'Você está editando a Seção "Sobre Mim"',
        description: 'Esta seção altera exclusivamente a sua biografia, foto de perfil e registro CRECI. O Hero do topo do site permanece 100% isolado e protegido.',
      };
    }
    return {
      badge: 'SEÇÃO INVESTIMENTO & VANTAGENS',
      badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300',
      cardBg: 'bg-blue-50/80 border-blue-200',
      title: 'Você está editando o Bloco de Investimento',
      description: 'Esta seção altera os argumentos de valorização e segurança na compra de imóveis na planta.',
    };
  })();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
      {/* Banner de Identificação e Isolamento Visual */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${noticeConfig.cardBg}`}>
        <div className="p-2 rounded-xl bg-white shadow-xs shrink-0">
          <Sliders size={18} className="text-primary" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${noticeConfig.badgeStyle}`}>
              {noticeConfig.badge}
            </span>
            <span className="text-xs font-bold text-gray-800">{noticeConfig.title}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {noticeConfig.description}
          </p>
        </div>
      </div>

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            Gerenciar Conteúdo
          </span>
          <h2 className="text-2xl font-sans font-bold text-primary">
            {sectionMeta.label}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {sectionMeta.description}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestoreDefault}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
          title="Restaurar padrão inicial original"
        >
          <RefreshCw size={13} /> Restaurar Padrão
        </button>
      </div>

      <form onSubmit={handleSaveBanner} className="space-y-6">
        <ImageUploader
          key={sectionKey}
          currentImagePath={formData.image_path}
          onImageSelected={(file) => setSelectedFile(file)}
          aspectRatio={sectionMeta.aspectRatio}
          recommendedResolution={sectionMeta.recommendedResolution}
        />

        {selectedFile && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Nova imagem selecionada ({selectedFile.name}). Clique para aplicar ao site:</span>
            </div>
            <button
              type="button"
              onClick={handleSaveBanner}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Imagem Agora'}
            </button>
          </div>
        )}

        {sectionMeta.hasTextConfig && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Textos & Chamadas
            </h4>

            {/* Tag / Etiqueta Superior */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {sectionKey === 'about'
                  ? 'Etiqueta / Tag da Seção'
                  : sectionKey === 'investment'
                  ? 'Etiqueta do Bloco'
                  : 'Pré-título / Etiqueta Superior (Hero)'}
              </label>
              <input
                type="text"
                value={formData.tag || ''}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder={
                  sectionKey === 'about'
                    ? 'Ex: Minha História'
                    : sectionKey === 'investment'
                    ? 'Ex: Por Que Investir na Planta?'
                    : 'Ex: ESPECIALISTA EM IMÓVEIS NA PLANTA - VCA CONSTRUTORA'
                }
                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* Título Principal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {sectionKey === 'about'
                  ? 'Assinatura / Nome e Registro Profissional'
                  : sectionKey === 'investment'
                  ? 'Título Principal do Bloco'
                  : 'Título / Chamada Principal (Hero)'}
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={
                  sectionKey === 'about'
                    ? 'Ex: Paula Malheiro – CRECI 21.188'
                    : sectionKey === 'investment'
                    ? 'Ex: Segurança, Rentabilidade e Conquista Patrimonial'
                    : 'Ex: a compra do seu imóvel como uma experiência segura e transparente!'
                }
                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* Subtítulo / Conteúdo de Texto */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {sectionKey === 'about'
                    ? 'História / Biografia Completa (Múltiplos Parágrafos)'
                    : sectionKey === 'investment'
                    ? 'Frase de Impacto / Citação'
                    : 'Texto Descritivo / Parágrafo do Hero'}
                </label>
                {sectionKey === 'about' && (
                  <span className="text-[11px] text-primary font-bold">
                    Dica: Pressione Enter para criar novos parágrafos
                  </span>
                )}
              </div>
              <textarea
                rows={sectionKey === 'about' ? 10 : sectionKey === 'investment' ? 4 : 4}
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder={
                  sectionKey === 'about'
                    ? 'Escreva aqui sua história completa e trajetória profissional...'
                    : sectionKey === 'investment'
                    ? 'Ex: Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.'
                    : 'Ex: Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.'
                }
                className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-y"
              />
            </div>

            {sectionKey === 'investment' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Autor da Citação
                </label>
                <input
                  type="text"
                  value={formData.button_text || ''}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="Ex: Paula Malheiro"
                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            )}

            {sectionKey === 'hero' && (
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
  );
};

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { refreshBanners, getBanner } = useBanners();

  const [activeTab, setActiveTab] = useState<DashboardTab>('properties');
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              title="Configurações e Auditoria"
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Configurações</span>
            </button>

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

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={16} /> Clientes
          </button>

          <button
            onClick={() => setActiveTab('access_logs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'access_logs'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity size={16} /> Logs de Acesso
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
                    {Object.entries(SECTIONS_CONFIG).map(([key, section]) => {
                      const isSelected = activeSection === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveSection(key)}
                          className={`w-full text-left p-3.5 rounded-2xl transition-all flex flex-col gap-1 cursor-pointer border ${
                            isSelected
                              ? 'bg-primary text-white shadow-md border-primary'
                              : 'bg-gray-50/50 hover:bg-gray-100/80 text-gray-700 border-gray-200/50'
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
                  <BannerSectionEditor
                    key={activeSection}
                    sectionKey={activeSection}
                    sectionMeta={currentSectionMeta}
                    banner={getBanner(activeSection)}
                    onSaved={async () => {
                      await refreshBanners();
                    }}
                  />
                </section>
              )}
            </div>
          </div>
        )}

        {/* ABA 4: CLIENTES */}
        {activeTab === 'clients' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <ClientsManager />
          </div>
        )}

        {/* ABA 5: LOGS DE ACESSO */}
        {activeTab === 'access_logs' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm">
            <AccessLogsManager />
          </div>
        )}
      </main>

      {/* Modal de Configurações e Auditoria */}
      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};
