import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../lib/pocketbase';

// Fotos oficiais locais
const HERO_FALLBACK_IMAGE = '/paula-hero.jpeg';
const PROFILE_FALLBACK_IMAGE = '/paula-perfil.jpeg';
const GENERAL_FALLBACK_IMAGE = '/paula-hero.jpeg';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  /** Se true, desativa lazy loading para carregamento prioritário acima da dobra (ex: hero) */
  priority?: boolean;
  /** Dimensões opcionais de thumbnail do PocketBase (ex: '1080x0') */
  thumb?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  priority = false,
  thumb,
  ...props
}) => {
  // 0: URL resolvida inicial | 1: Fallback local alternativo | 2: Fallback JSX de alta fidelidade
  const [errorStage, setErrorStage] = useState<number>(0);

  useEffect(() => {
    setErrorStage(0);
  }, [src]);

  const isHero = Boolean(
    priority ||
    (src && typeof src === 'string' && src.includes('hero')) ||
    (alt && (alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('paula malheiro')))
  );

  const isProfile = Boolean(
    (src && typeof src === 'string' && (src.includes('perfil') || src.includes('sobre') || src.includes('about'))) ||
    (alt && alt.toLowerCase().includes('perfil'))
  );

  const defaultStage1 = fallbackSrc || (isHero ? HERO_FALLBACK_IMAGE : isProfile ? PROFILE_FALLBACK_IMAGE : GENERAL_FALLBACK_IMAGE);
  
  // Utiliza thumb 1080x0 se não especificado explicitamente para garantir carregamento leve
  const effectiveThumb = thumb !== undefined ? thumb : '1080x0';
  const resolvedInitial = getImageUrl(src, effectiveThumb);

  // Determina a URL atual com base no estágio
  let currentSrc = resolvedInitial || defaultStage1;
  if (errorStage === 1) {
    // Se o estágio 0 já era o defaultStage1, avança para renderização de segurança
    currentSrc = (resolvedInitial !== defaultStage1) ? defaultStage1 : '';
  }

  const handleError = () => {
    if (import.meta.env.DEV) {
      console.warn(`[SmartImage] Erro ao carregar imagem: "${currentSrc}". Acionando estágio ${errorStage + 1}.`);
    }
    setErrorStage((prev) => {
      // Se a URL que falhou já era o defaultStage1, vai direto para o renderizador de segurança
      if (prev === 0 && resolvedInitial === defaultStage1) {
        return 2;
      }
      return prev < 2 ? prev + 1 : 2;
    });
  };

  // Se todos os estágios de imagem falharem (estágio 2 ou sem src válida), renderiza o banner elegante em JSX nativo
  if (errorStage >= 2 || !currentSrc) {
    return (
      <div 
        className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-[#2c1810] via-[#432316] to-[#8b4513] text-white select-none ${className}`}
        aria-label={alt}
      >
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20 shadow-inner">
          <span className="text-2xl font-serif font-bold text-[#e5b158]">PM</span>
        </div>
        <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white mb-1">
          Paula Malheiro
        </span>
        <span className="text-xs sm:text-sm font-sans tracking-[0.25em] text-[#e5b158] uppercase font-semibold">
          Corretora de Imóveis
        </span>
        <span className="text-[11px] text-white/60 mt-4 tracking-wider uppercase">
          CRECI 21.188
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      loading={isHero || priority ? 'eager' : 'lazy'}
      decoding={isHero || priority ? 'sync' : 'async'}
      fetchPriority={isHero || priority ? 'high' : 'auto'}
      className={className}
      {...props}
    />
  );
};
