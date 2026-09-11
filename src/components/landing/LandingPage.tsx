import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Instagram, 
  Menu, 
  ArrowRight, 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  Clock, 
  Lock, 
  Images, 
  ExternalLink, 
  Film, 
  Video, 
  Play,
  ChevronLeft,
  ChevronRight,
  Hammer,
  UserCheck,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { getImageUrl, verifyClientCpf, formatCpf } from '../../lib/supabase';
import { useBanners } from '../../hooks/useBanners';
import { useProperties } from '../../hooks/useProperties';
import { SmartImage } from '../common/SmartImage';
import { CampaignPopup } from '../common/CampaignPopup';
import type { Property } from '../../types/property';

// --- Icons ---
const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// --- Components ---

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#FDFCFB]/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex flex-col border-r border-gray-200 pr-2 sm:pr-4 text-right">
            <div className="text-[16px] sm:text-2xl lg:text-3xl font-sans text-primary font-bold leading-none tracking-tight whitespace-nowrap">Paula Malheiro</div>
            <div className="text-[7px] sm:text-[10px] lg:text-[11px] text-gray-500 uppercase tracking-[0.2em] mt-1 sm:mt-1.5 font-medium">Corretora de Imóveis</div>
          </div>
          <img 
            src="/vca-logo.png" 
            alt="VCA Construtora" 
            className="h-7 sm:h-9 lg:h-10 w-auto object-contain shrink-0"
          />
        </div>
        <div className="hidden xl:flex items-center justify-center gap-6 text-[13px] font-semibold text-gray-600 flex-1">
          <a href="#home" className="hover:text-primary transition-colors whitespace-nowrap">Início</a>
          <a href="#projects" className="hover:text-primary transition-colors whitespace-nowrap">Empreendimentos</a>
          <a href="#simulation" className="hover:text-primary transition-colors whitespace-nowrap">Simulação</a>
          <a href="#construction" className="hover:text-primary transition-colors whitespace-nowrap">Evolução das Obras</a>
          <a href="#about" className="hover:text-primary transition-colors whitespace-nowrap">Sobre Mim</a>
          <a href="#contact" className="hover:text-primary transition-colors whitespace-nowrap">Contato</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a 
            href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-xs hover:scale-110 transition-all"
            title="Instagram"
          >
            <Instagram size={16} />
          </a>
          <a 
            href="https://wa.me/5577991465337"
            target="_blank"
            rel="noreferrer"
            className="bg-[#25D366] text-white p-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <WhatsAppIcon size={16} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden text-gray-600 p-1 sm:p-2 cursor-pointer">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 space-y-4 text-sm font-semibold text-gray-600">
              <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Início</a>
              <a href="#projects" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Empreendimentos</a>
              <a href="#simulation" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Simulação</a>
              <a href="#construction" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Evolução das Obras</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Sobre Mim</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors">Contato</a>
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-primary font-bold flex items-center gap-1.5 pt-2 border-t border-gray-100">
                <Lock size={14} /> Painel Administrativo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const { getBanner } = useBanners();
  const heroBanner = getBanner('hero');

  const rawTag = heroBanner.tag?.trim() || '';
  const isBiographicTag = rawTag.toLowerCase().includes('minha história') || rawTag.toLowerCase().includes('creci');
  const defaultHeroTag = 'ESPECIALISTA EM IMÓVEIS NA PLANTA - VCA CONSTRUTORA';
  const heroTag = (!isBiographicTag && rawTag.length > 0) ? rawTag : defaultHeroTag;

  const defaultHeroSubtitle = 'Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.';

  // Isolamento estrito: impede vazamento de texto biográfico da seção Sobre Mim para o Hero
  const rawSubtitle = heroBanner.subtitle?.trim() || '';
  const isBiographicText = rawSubtitle.toLowerCase().includes('caetit') || 
                           rawSubtitle.toLowerCase().includes('creci') ||
                           rawSubtitle.toLowerCase().includes('concluí minha formação') ||
                           rawSubtitle.toLowerCase().includes('minha trajetória');

  const heroSubtitle = (!isBiographicText && rawSubtitle.length > 0) ? rawSubtitle : defaultHeroSubtitle;
  const heroBtnText = heroBanner.button_text || 'Conheça os Empreendimentos';
  const heroBtnLink = heroBanner.button_link || '#projects';
  const heroImage = heroBanner.image_path || '/paula-hero.jpeg';

  const rawTitle = heroBanner.title?.trim() || '';
  const isBiographicTitle = rawTitle.toLowerCase().includes('caetit') || 
                            rawTitle.toLowerCase().includes('creci') ||
                            rawTitle.toLowerCase().includes('minha história');
  const defaultHeroTitle = 'a compra do seu imóvel como uma experiência segura e transparente!';
  const heroTitle = (!isBiographicTitle && rawTitle.length > 0) ? rawTitle : defaultHeroTitle;

  return (
    <section id="home" className="relative pt-12 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-[0.3em]">{heroTag}</span>
            {(() => {
              const raw = heroTitle.trim();
              const match = raw.match(/^(.*?)(im[óo]vel)(.*)$/i);
              if (match) {
                const prefix = match[1]?.trim() || 'a compra do seu';
                const highlight = match[2] || 'imóvel';
                const suffix = match[3]?.trim() || 'como uma experiência segura e transparente!';
                return (
                  <h1 className="flex flex-col">
                    {prefix && (
                      <span className="text-2xl md:text-3xl font-sans text-gray-500 uppercase tracking-[0.2em] mb-2">
                        {prefix}
                      </span>
                    )}
                    <span className="text-5xl sm:text-7xl md:text-9xl font-sans font-black text-primary leading-tight sm:leading-none mb-3 sm:mb-4 tracking-tight break-words">
                      {highlight}
                    </span>
                    {suffix && (
                      <span className="text-base sm:text-lg md:text-xl font-sans text-gray-600 leading-relaxed italic">
                        {suffix}
                      </span>
                    )}
                  </h1>
                );
              }
              return (
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-sans font-black text-primary leading-tight mb-4 tracking-tight break-words">
                  {raw}
                </h1>
              );
            })()}
          </div>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <a 
              href={heroBtnLink}
              className="w-full sm:w-auto bg-primary text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-accent transition-all shadow-xl shadow-primary/20 text-center text-sm sm:text-base flex items-center justify-center cursor-pointer"
            >
              {heroBtnText}
            </a>
            <div className="flex gap-2.5 sm:gap-4 w-full sm:w-auto">
              <a 
                href="https://wa.me/5577991465337"
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none bg-[#25D366] text-white px-4 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-[#25D366]/20 text-center flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <WhatsAppIcon size={18} />
                <span>Agendar Atendimento</span>
              </a>
              <a 
                href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
                target="_blank"
                rel="noreferrer"
                className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg cursor-pointer"
                title="Instagram"
              >
                <Instagram size={22} />
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gray-100"
        >
          <SmartImage 
            src={heroImage} 
            alt="Paula Malheiro" 
            fallbackSrc="/paula-hero.jpeg"
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

const ProjectCard = ({ 
  project, 
  idx, 
  onSelect 
}: { 
  project: Property; 
  idx: number; 
  onSelect: () => void;
  key?: React.Key 
}) => {
  const whatsappMessage = `Olá Paula! Gostaria de mais informações sobre o empreendimento *${project.title}* (${project.location}).`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1 }}
      onClick={onSelect}
      className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-500 flex flex-col border border-gray-100/80 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] sm:aspect-[3/4] overflow-hidden shrink-0 bg-gray-100">
        <SmartImage 
          src={project.image_url} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {project.tag && (
          <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            {project.tag}
          </div>
        )}
        {project.gallery_images && project.gallery_images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Images size={12} />
            <span>{project.gallery_images.length} fotos</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="space-y-3 mb-4">
          <h3 className="text-xl font-sans text-primary font-bold group-hover:text-accent transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <MapPin size={14} className="text-primary shrink-0" />
            <span>{project.location}</span>
          </div>

          {project.description && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
              {project.description}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver Perfil Completo <ArrowRight size={14} />
          </span>

          <a 
            href={`https://wa.me/5577991465337?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 shadow-sm transition-all shrink-0"
            title="Atendimento no WhatsApp"
          >
            <WhatsAppIcon size={18} />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const PropertyDetailModal = ({
  property,
  onClose
}: {
  property: Property;
  onClose: () => void;
}) => {
  const photos = useMemo(() => {
    const list = Array.isArray(property.gallery_images) ? [...property.gallery_images] : [];
    if (property.image_url && !list.includes(property.image_url)) {
      list.unshift(property.image_url);
    }
    return list.length > 0 ? list : [property.image_url || '/velli.jpeg'];
  }, [property]);

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setActiveIdx(p => (p > 0 ? p - 1 : photos.length - 1));
      if (e.key === 'ArrowRight') setActiveIdx(p => (p < photos.length - 1 ? p + 1 : 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [photos, onClose]);

  const whatsappMessage = `Olá Paula! Gostaria de atendimento personalizado sobre o empreendimento *${property.title}* (${property.location}).`;

  return (
    <div 
      className="fixed inset-0 z-[105] bg-black/75 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            {property.tag && (
              <span className="text-[11px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {property.tag}
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-sans text-primary font-bold">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 2 Columns on Desktop */}
        <div className="p-5 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          {/* Coluna 1: Galeria de Fotos com Seletor & Miniaturas */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Foto Principal com Setas */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-200 shadow-md">
              <SmartImage
                src={photos[activeIdx]}
                alt={`${property.title} - Foto ${activeIdx + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                Foto {activeIdx + 1} de {photos.length}
              </span>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(p => (p > 0 ? p - 1 : photos.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
                    title="Foto anterior (Seta esquerda)"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(p => (p < photos.length - 1 ? p + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
                    title="Próxima foto (Seta direita)"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Faixa de Miniaturas */}
            {photos.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {photos.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeIdx === i
                        ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                    }`}
                  >
                    <SmartImage src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Informações Comerciais & Ações */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                <MapPin size={18} className="text-primary shrink-0" />
                <span>{property.location}</span>
              </div>

              {property.description ? (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-2 bg-gray-50/70 p-4 rounded-2xl border border-gray-100 max-h-[260px] overflow-y-auto">
                  {property.description}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic bg-gray-50/70 p-4 rounded-2xl">
                  Consulte-nos para receber a apresentação completa, plantas e tabela de preços deste lançamento.
                </p>
              )}

              {/* Badge / Atalho caso o empreendimento participe da Evolução das Obras */}
              {property.is_construction && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
                    <Hammer size={16} className="text-amber-600 shrink-0" />
                    <span>Em Acompanhamento de Obras</span>
                  </div>
                  <a
                    href="#construction"
                    onClick={onClose}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    Ver Obras <ArrowRight size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Botão de Ação WhatsApp */}
            <div className="pt-4 border-t border-gray-100 space-y-2.5">
              <a
                href={`https://wa.me/5577991465337?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-xl shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <WhatsAppIcon size={20} />
                <span>Quero Mais Informações no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors text-center cursor-pointer"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FeaturedProjects = () => {
  const { featuredProperties, loading } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <section id="projects" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16 text-center space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Portfólio Selecionado</span>
          <h2 className="text-4xl md:text-5xl font-sans text-primary font-bold">Empreendimentos em Destaque</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Os melhores lançamentos imobiliários com alto potencial de valorização e qualidade de vida.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Carregando empreendimentos...</p>
          </div>
        ) : featuredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl p-8 max-w-md mx-auto border border-gray-100">
            <p className="text-gray-600 font-bold">Nenhum empreendimento em destaque no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((project, idx) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                idx={idx} 
                onSelect={() => setSelectedProperty(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Perfil Completo do Imóvel */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

const Benefits = () => {
  const { getBanner } = useBanners();
  const investBanner = getBanner('investment');
  const investImage = investBanner.image_path || '/velli.jpeg';
  const investTag = investBanner.tag || 'Por Que Investir na Planta?';
  const investTitle = investBanner.title || 'Segurança, Rentabilidade e Conquista Patrimonial';
  const investQuote = investBanner.subtitle || 'Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.';
  const investAuthor = investBanner.button_text || 'Paula Malheiro';

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">{investTag}</span>
          <h2 className="text-4xl md:text-5xl font-sans text-primary font-bold leading-tight">
            {investTitle}
          </h2>
          
          <div className="space-y-6">
            {[
              { icon: <TrendingUp />, title: 'Alta Valorização', desc: 'Adquirir na planta permite capturar toda a curva de valorização do empreendimento até a entrega das chaves.' },
              { icon: <ShieldCheck />, title: 'Personalização e Inovação', desc: 'Acesso às últimas tendências em automação, sustentabilidade e layouts modernos que atendem às demandas atuais.' },
              { icon: <Wallet />, title: 'Condições Facilitadas', desc: 'Fluxos de pagamento flexíveis durante a obra, permitindo um planejamento financeiro muito mais estratégico.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 p-6 rounded-2xl hover:bg-secondary/50 transition-colors">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative bg-gray-100">
            <SmartImage src={investImage} alt="Investimento" className="w-full h-full object-cover" />
          </div>
          <div className="relative mt-6 sm:mt-0 sm:absolute sm:-bottom-8 sm:-left-8 bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-sm sm:max-w-xs border border-gray-100">
            <p className="italic text-gray-600 text-sm mb-4">
              &quot;{investQuote}&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 relative overflow-hidden shrink-0">
                <SmartImage src={investImage} alt="Paula Malheiro" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="block font-bold text-primary text-sm leading-none">{investAuthor}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">Corretora de Imóveis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Simulation = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    estadoCivil: 'Solteiro(a)',
    profissao: '',
    renda: '',
    dependentes: 'Não',
    possuiImoveis: 'Não',
    ondeReside: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const message = `*Nova Simulação de Financiamento*\n\n` +
      `*Nome:* ${formData.nome}\n` +
      `*Data de Nascimento:* ${formData.dataNascimento}\n` +
      `*Estado Civil:* ${formData.estadoCivil}\n` +
      `*Profissão:* ${formData.profissao}\n` +
      `*Renda:* ${formData.renda}\n` +
      `*Possui dependentes:* ${formData.dependentes}\n` +
      `*Já possui imóveis:* ${formData.possuiImoveis}\n` +
      `*Onde reside:* ${formData.ondeReside}`;
      
    const whatsappUrl = `https://wa.me/5577991465337?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowForm(false);
    }, 1000);
  };

  return (
    <section id="simulation" className="py-24 bg-secondary/20">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-sans text-primary font-bold">Simulação de Financiamento</h2>
          <p className="text-gray-600">Descubra as melhores condições para o seu perfil financeiro.</p>
        </div>
        
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center px-4"
            >
              <button 
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto min-w-[240px] group relative bg-primary text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span>Simular Financiamento</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-5 sm:p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 text-left max-w-2xl mx-auto w-full"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-sans text-primary font-bold">Dados para Simulação</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-primary transition-colors cursor-pointer p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Seu nome completo" 
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all text-sm sm:text-base"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Data de Nascimento</label>
                  <input 
                    required
                    type="date" 
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all text-sm sm:text-base bg-white"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Estado Civil</label>
                  <select 
                    required
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all bg-white text-sm sm:text-base"
                    value={formData.estadoCivil}
                    onChange={(e) => setFormData({...formData, estadoCivil: e.target.value})}
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Profissão</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Sua profissão" 
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all text-sm sm:text-base"
                    value={formData.profissao}
                    onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Renda R$</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: 5.000,00" 
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all text-sm sm:text-base"
                    value={formData.renda}
                    onChange={(e) => setFormData({...formData, renda: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Possui dependentes?</label>
                  <div className="flex gap-2 sm:gap-4 p-1 bg-secondary/30 rounded-xl">
                    {['Sim', 'Não'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, dependentes: opt})}
                        className={`flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${formData.dependentes === opt ? 'bg-white text-primary shadow-xs' : 'text-gray-500 hover:text-primary'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Já possui Imóveis?</label>
                  <div className="flex gap-2 sm:gap-4 p-1 bg-secondary/30 rounded-xl">
                    {['Sim', 'Não'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, possuiImoveis: opt})}
                        className={`flex-1 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${formData.possuiImoveis === opt ? 'bg-white text-primary shadow-xs' : 'text-gray-500 hover:text-primary'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-gray-700 ml-1">Onde Reside</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Cidade / Estado" 
                    className="w-full p-3.5 sm:p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all text-sm sm:text-base"
                    value={formData.ondeReside}
                    onChange={(e) => setFormData({...formData, ondeReside: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 pt-3 sm:pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-accent active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Enviar Simulação no WhatsApp</span>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-3 sm:mt-4 uppercase tracking-widest">
                    Seus dados estão protegidos e serão usados apenas para a simulação.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const About = () => {
  const { getBanner } = useBanners();
  const aboutBanner = getBanner('about');
  const aboutImage = aboutBanner.image_path || '/paula-perfil.jpeg';
  const rawTag = aboutBanner.tag?.trim() || '';
  const isHeroTag = rawTag.toLowerCase().includes('vca construtora') || rawTag.toLowerCase().includes('imóveis na planta');
  const aboutTag = (!isHeroTag && rawTag.length > 0) ? rawTag : 'Minha História';

  const rawTitle = aboutBanner.title?.trim() || '';
  const isHeroTitle = rawTitle.toLowerCase().includes('compra do seu imóvel') || rawTitle.toLowerCase().includes('experiência segura');
  const aboutSignature = (!isHeroTitle && rawTitle.length > 0) ? rawTitle : 'Paula Malheiro – CRECI 21.188';

  const defaultStory = [
    'Sou natural de Caetité – Bahia e cheguei a Vitória da Conquista em 2012, onde concluí minha formação em Direito e iniciei minha trajetória profissional. Os imóveis, porém, sempre fizeram parte da minha vida, influenciada desde cedo pelo meu pai e sua paixão por negócios.',
    'Em 2016, ingressei no mercado imobiliário, sempre com foco em lançamentos. Comecei por empresas que fortaleceram minha paixão pelo mercado e me fizeram ter certeza de que estava no caminho certo.',
    'Em 2018, cheguei à VCA Construtora, responsável por grande parte do meu desenvolvimento profissional e pessoal. Também tive a oportunidade de atuar na coordenação comercial, ampliando minha visão sobre vendas, gestão e relacionamento com clientes.',
    'Sou movida por desafios, criatividade e inovação, e adoro unir vendas e marketing. Hoje, vivo uma fase mais madura da minha carreira, priorizando oferecer um atendimento humano, personalizado e transparente.',
    'Ao longo dos mais de 10 anos no mercado imobiliário, acompanhei de perto histórias de conquistas e bons retornos de clientes que investiram em imóveis na planta. É essa experiência que hoje coloco a serviço de quem busca não apenas comprar um imóvel, mas tomar uma decisão segura para construir um futuro mais feliz e próspero. É para isso que estou aqui!'
  ];

  const paragraphs = React.useMemo(() => {
    const rawSubtitle = aboutBanner.subtitle?.trim() || '';
    const isHeroSubtitle = rawSubtitle.toLowerCase().includes('conectar você às oportunidades em imóveis') ||
                           rawSubtitle.toLowerCase().includes('atendimento humano e personalizado para encontrarmos a melhor opção');

    if (!isHeroSubtitle && rawSubtitle.length > 0) {
      const parsed = rawSubtitle
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Se o último parágrafo for a assinatura (ex: "Paula Malheiro – CRECI 21.188"), remove do loop para não duplicar com o destaque final
      if (
        parsed.length > 1 && 
        parsed[parsed.length - 1].toLowerCase().includes('creci') && 
        aboutSignature.toLowerCase().includes('creci')
      ) {
        return parsed.slice(0, -1);
      }
      if (parsed.length > 0) return parsed;
    }
    return defaultStory;
  }, [aboutBanner.subtitle, aboutSignature]);

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden shadow-2xl bg-gray-100"
        >
          <SmartImage 
            src={aboutImage} 
            alt="Paula Malheiro" 
            className="w-full h-auto object-cover"
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <span className="text-xs font-bold text-accent uppercase tracking-widest">{aboutTag}</span>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            <p className="font-bold text-primary pt-4">
              {aboutSignature}
            </p>
          </div>
          <div className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20} /></div>
              <span className="font-bold text-gray-700">Segurança e Planejamento</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20} /></div>
              <span className="font-bold text-gray-700">Atendimento Personalizado</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Progress = () => {
  const { constructionProperties, loading } = useProperties();
  const { getBanner } = useBanners();
  const constrBanner = getBanner('construction');
  const constrTitle = constrBanner.title || 'Evolução das Obras';
  const constrSubtitle = constrBanner.subtitle || 'Confira o acompanhamento real de cada etapa dos nossos empreendimentos.';
  const [activeGallery, setActiveGallery] = useState<string[] | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [activeVideos, setActiveVideos] = useState<string[] | null>(null);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState<number>(0);
  const [showAguardem, setShowAguardem] = useState(false);
  const [selectedPropTitle, setSelectedPropTitle] = useState<string>('');

  // Portão de Acesso por CPF
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [cpfInput, setCpfInput] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [isVerifyingCpf, setIsVerifyingCpf] = useState(false);
  const [pendingProperty, setPendingProperty] = useState<Property | null>(null);
  const [authenticatedClient, setAuthenticatedClient] = useState<{ name: string; cpf: string } | null>(() => {
    try {
      const stored = sessionStorage.getItem('paula_client_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!activeGallery || activeGallery.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveGallery(null);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : activeGallery.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIdx(prev => (prev < activeGallery.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGallery]);

  const openPropertyMedia = (prop: Property) => {
    // 1. Se for formato de vídeo e tiver vídeos cadastrados
    if (prop.media_type === 'videos' && prop.gallery_videos && prop.gallery_videos.length > 0) {
      setActiveVideos(prop.gallery_videos);
      setSelectedVideoIdx(0);
      setSelectedPropTitle(prop.title);
      return;
    }

    // 2. Ação externa do Instagram
    if (prop.action_type === 'instagram' && prop.action_url) {
      window.open(prop.action_url, '_blank', 'noreferrer');
      return;
    }

    // 3. Galeria de Fotos
    if ((prop.action_type === 'gallery' || prop.media_type === 'photos') && prop.gallery_images && prop.gallery_images.length > 0) {
      setActiveGallery(prop.gallery_images);
      setActivePhotoIdx(0);
      setSelectedPropTitle(prop.title);
      return;
    }

    // 4. Modal "Aguardem" padrão
    setSelectedPropTitle(prop.title);
    setShowAguardem(true);
  };

  const handlePropertyClick = (prop: Property) => {
    if (!authenticatedClient) {
      setPendingProperty(prop);
      setCpfInput('');
      setCpfError(null);
      setShowCpfModal(true);
      return;
    }
    openPropertyMedia(prop);
  };

  const handleVerifyCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingCpf) return;

    setIsVerifyingCpf(true);
    setCpfError(null);

    try {
      const res = await verifyClientCpf(cpfInput);
      if (res.valid && res.client) {
        const clientData = { name: res.client.name, cpf: res.client.cpf };
        setAuthenticatedClient(clientData);
        sessionStorage.setItem('paula_client_auth', JSON.stringify(clientData));
        setShowCpfModal(false);
        if (pendingProperty) {
          openPropertyMedia(pendingProperty);
          setPendingProperty(null);
        }
      } else {
        setCpfError(res.error || 'Usuário não localizado, entre em contato e solicite seu acesso.');
      }
    } catch (err: any) {
      setCpfError(err.message || 'Usuário não localizado, entre em contato e solicite seu acesso.');
    } finally {
      setIsVerifyingCpf(false);
    }
  };

  return (
    <section id="construction" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-sans text-primary font-bold mb-4">{constrTitle}</h2>
          <p className="text-gray-600">{constrSubtitle}</p>
        </div>

        {/* Status de Acesso / Identificação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-10 px-5 py-3.5 bg-secondary/20 rounded-2xl max-w-2xl mx-auto border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {authenticatedClient ? (
              <span className="flex items-center gap-2 text-emerald-800 font-bold">
                <UserCheck size={16} className="text-emerald-600" />
                Acesso Liberado: {authenticatedClient.name} ({authenticatedClient.cpf})
              </span>
            ) : (
              <span className="flex items-center gap-2 text-gray-600">
                <Lock size={15} className="text-primary shrink-0" />
                Acesso exclusivo para clientes
              </span>
            )}
          </div>
          {authenticatedClient && (
            <button
              onClick={() => {
                sessionStorage.removeItem('paula_client_auth');
                setAuthenticatedClient(null);
              }}
              className="text-xs text-gray-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              title="Trocar CPF / Sair"
            >
              <LogOut size={13} /> Sair
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {constructionProperties.map((prop, idx) => {
              const isVideo = prop.media_type === 'videos' && Boolean(prop.gallery_videos && prop.gallery_videos.length > 0);

              return (
                <motion.div 
                  key={prop.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handlePropertyClick(prop)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md cursor-pointer bg-gray-100 border border-gray-100 hover:shadow-xl transition-all"
                >
                  <SmartImage 
                    src={prop.progress_cover_image || prop.image_url} 
                    alt={prop.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-3.5">
                    <span className="text-white font-bold text-xs leading-tight line-clamp-2">{prop.title}</span>
                    <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium mt-1">
                      {isVideo ? (
                        <><Film size={10} /> Vídeos ({prop.gallery_videos?.length})</>
                      ) : prop.action_type === 'instagram' ? (
                        <><Instagram size={10} /> Reels</>
                      ) : prop.action_type === 'gallery' ? (
                        <><Images size={10} /> Fotos ({prop.gallery_images?.length})</>
                      ) : (
                        <><Clock size={10} /> Obras</>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Vídeos da Obra */}
      <AnimatePresence>
        {activeVideos && activeVideos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[115] bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl flex items-center justify-between text-white pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Film size={20} className="text-amber-400" />
                <span className="text-base sm:text-lg font-bold">
                  {selectedPropTitle} • Vídeos de Acompanhamento
                </span>
              </div>
              <button 
                onClick={() => setActiveVideos(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Alternador de Vídeo (se houver 2 vídeos) */}
            {activeVideos.length > 1 && (
              <div className="flex gap-2 my-3">
                {activeVideos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVideoIdx(i)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedVideoIdx === i 
                        ? 'bg-amber-400 text-black shadow-md' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Vídeo {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Player de Vídeo */}
            <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl mt-2 border border-gray-800">
              {activeVideos[selectedVideoIdx]?.includes('.mp4') || activeVideos[selectedVideoIdx]?.includes('.webm') || activeVideos[selectedVideoIdx]?.startsWith('blob:') ? (
                <video 
                  key={activeVideos[selectedVideoIdx]}
                  src={activeVideos[selectedVideoIdx]} 
                  controls 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-4">
                  <Play size={48} className="mx-auto text-primary" />
                  <p className="text-sm font-bold">Vídeo externo disponível:</p>
                  <a 
                    href={activeVideos[selectedVideoIdx]} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-accent text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all"
                  >
                    Assistir no Navegador <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Galeria de Fotos com Seletor Visível & Miniaturas */}
      <AnimatePresence>
        {activeGallery && activeGallery.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-between p-4 sm:p-6 select-none"
            onClick={() => setActiveGallery(null)}
          >
            {/* Header com título, contador de fotos e botão fechar */}
            <div 
              className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {selectedPropTitle} <span className="text-amber-400 font-normal">• Galeria de Obras</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  Foto {activePhotoIdx + 1} de {activeGallery.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="sm:hidden px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                  {activePhotoIdx + 1}/{activeGallery.length}
                </span>
                <button 
                  onClick={() => setActiveGallery(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Fechar (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Imagem Principal em Destaque com Setas de Navegação */}
            <div 
              className="relative w-full max-w-5xl flex-1 flex items-center justify-center py-4 my-auto min-h-0"
              onClick={e => e.stopPropagation()}
            >
              <SmartImage 
                key={activePhotoIdx}
                src={activeGallery[activePhotoIdx]} 
                alt={`Obra ${selectedPropTitle} foto ${activePhotoIdx + 1}`} 
                className="max-h-[60vh] sm:max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all"
              />

              {activeGallery.length > 1 && (
                <>
                  <button 
                    onClick={() => setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : activeGallery.length - 1))}
                    className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-xs cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
                    title="Foto anterior (Seta para a esquerda)"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button 
                    onClick={() => setActivePhotoIdx(prev => (prev < activeGallery.length - 1 ? prev + 1 : 0))}
                    className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all shadow-xl backdrop-blur-xs cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
                    title="Próxima foto (Seta para a direita)"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>

            {/* Faixa de Miniaturas Clicáveis (Thumbnails) */}
            {activeGallery.length > 1 && (
              <div 
                className="w-full max-w-5xl flex flex-col items-center gap-2 pt-2 border-t border-white/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full py-1.5 px-2 scrollbar-thin">
                  {activeGallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activePhotoIdx === i
                          ? 'border-amber-400 scale-105 shadow-lg shadow-amber-400/20 opacity-100 ring-2 ring-amber-400/50'
                          : 'border-white/20 opacity-50 hover:opacity-90'
                      }`}
                      title={`Ver foto ${i + 1}`}
                    >
                      <SmartImage 
                        src={img} 
                        alt={`Miniatura ${i + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-white/50 tracking-wide">
                  Use as setas do teclado (← / →) ou selecione uma miniatura acima
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Aguardem */}
      <AnimatePresence>
        {showAguardem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setShowAguardem(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-2xl font-sans text-primary font-bold mb-2">Aguardem</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Em breve teremos atualizações fotográficas sobre a evolução das obras do empreendimento <strong>{selectedPropTitle}</strong>.
              </p>
              <button 
                onClick={() => setShowAguardem(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-accent transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Identificação por CPF (Portão de Acesso à Evolução das Obras) */}
      <AnimatePresence>
        {showCpfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[115] bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isVerifyingCpf) {
                setShowCpfModal(false);
                setPendingProperty(null);
                setCpfError(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowCpfModal(false);
                  setPendingProperty(null);
                  setCpfError(null);
                }}
                disabled={isVerifyingCpf}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <Lock size={26} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                    Área do Cliente • Acesso Exclusivo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-sans text-primary font-bold mt-1">
                    Evolução das Obras
                  </h3>
                  {pendingProperty && (
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Empreendimento: <strong className="text-gray-800">{pendingProperty.title}</strong>
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Informe o seu CPF cadastrado para visualizar fotos e vídeos do acompanhamento da sua obra.
                </p>
              </div>

              <form onSubmit={handleVerifyCpf} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-gray-700 ml-1">
                    Seu CPF
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={(e) => {
                      setCpfInput(formatCpf(e.target.value));
                      if (cpfError) setCpfError(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base font-mono tracking-wider focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-center"
                    autoFocus
                  />
                </div>

                {cpfError && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5 text-amber-900 text-xs font-medium leading-relaxed">
                      <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{cpfError}</span>
                    </div>

                    <a
                      href={`https://wa.me/5577991465337?text=${encodeURIComponent(
                        `Olá Paula! Gostaria de solicitar meu acesso à Evolução das Obras (CPF: ${cpfInput}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <WhatsAppIcon size={16} />
                      <span>Solicitar Acesso no WhatsApp</span>
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingCpf || cpfInput.replace(/\D/g, '').length !== 11}
                  className="w-full bg-primary hover:bg-accent text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingCpf ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Acessar Galeria da Obra</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const CTA = () => (
  <section className="py-16 sm:py-24 px-4">
    <div className="max-w-5xl mx-auto bg-primary rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <Building2 className="absolute -top-10 -left-10 w-64 h-64" />
        <Building2 className="absolute -bottom-10 -right-10 w-64 h-64" />
      </div>
      
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold leading-tight">
          Não encontrou o que procura?
        </h2>
        <p className="text-sm sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
          Estou pronta para apresentar as melhores oportunidades em imóveis para você.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6 w-full max-w-md mx-auto sm:max-w-none">
          <a 
            href="https://wa.me/5577991465337" 
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto bg-[#25D366] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:scale-105 active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-3 cursor-pointer"
          >
            <WhatsAppIcon size={22} />
            <span>Chame aqui</span>
          </a>
          <a 
            href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-16 h-13 sm:h-16 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shadow-xl gap-2 font-bold text-sm sm:text-base sm:font-normal cursor-pointer"
            title="Instagram"
          >
            <Instagram size={24} />
            <span className="sm:hidden">Acessar Instagram</span>
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="contact" className="bg-secondary/50 pt-16 sm:pt-24 pb-10 sm:pb-12 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-sans text-primary font-bold leading-none tracking-tight">Paula Malheiro</div>
          <img 
            src="/vca-logo.png" 
            alt="VCA Construtora" 
            className="h-10 sm:h-11 w-auto object-contain self-start shrink-0"
          />
          <div className="text-[12px] text-gray-500 uppercase tracking-[0.2em] font-medium">Corretora de Imóveis</div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Especialista em lançamentos. Ética e transparência para o seu próximo imóvel na planta.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-primary mb-4 sm:mb-6">Navegação Rápida</h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li><a href="#home" className="hover:text-primary transition-colors">Início</a></li>
          <li><a href="#projects" className="hover:text-primary transition-colors">Empreendimentos</a></li>
          <li><a href="#simulation" className="hover:text-primary transition-colors">Simulação</a></li>
          <li><a href="#construction" className="hover:text-primary transition-colors">Evolução das Obras</a></li>
          <li><a href="#about" className="hover:text-primary transition-colors">Sobre Mim</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-primary mb-4 sm:mb-6">Contato</h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li>Vitória da Conquista - BA</li>
          <li>CRECI: 21.188</li>
          <li>WhatsApp: (77) 99146-5337</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-primary mb-4 sm:mb-6">Área Restrita</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          Acesso ao painel administrativo para gestão de banners, empreendimentos e campanhas.
        </p>
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl transition-all"
        >
          <Lock size={14} /> Painel Administrativo
        </Link>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4 text-center sm:text-left">
      <div>Paula Malheiro &copy; {new Date().getFullYear()} • Todos os direitos reservados.</div>
      <div>Vitória da Conquista – Bahia</div>
    </div>

    <a 
      href="https://wa.me/5577991465337" 
      target="_blank" 
      rel="noreferrer"
      className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 w-13 h-13 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform z-50"
      title="Fale no WhatsApp"
    >
      <WhatsAppIcon size={28} />
    </a>
  </footer>
);

export const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen relative">
      {/* Pop-up de Campanha Promocional */}
      <CampaignPopup />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Navbar />
        <Hero />
        <FeaturedProjects />
        <Simulation />
        <Benefits />
        <Progress />
        <About />
        <CTA />
        <Footer />
      </motion.div>
    </main>
  );
};
