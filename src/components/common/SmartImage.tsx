import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../lib/supabase';

// Fotos oficiais locais
const HERO_FALLBACK_IMAGE = '/paula-hero.jpeg';
const PROFILE_FALLBACK_IMAGE = '/paula-perfil.jpeg';
const GENERAL_FALLBACK_IMAGE = '/paula-hero.jpeg';

// SVG Inline resiliente para garantia absoluta de zero imagem quebrada
const SAFE_SVG_FALLBACK = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%221000%22%20viewBox%3D%220%200%20800%201000%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%232c1810%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%238b4513%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23g)%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2248%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2236%22%20font-weight%3D%22bold%22%3EPaula%20Malheiro%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2254%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23e5b158%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20letter-spacing%3D%223%22%3ECORRETORA%20DE%20IM%C3%93VEIS%3C%2Ftext%3E%3C%2Fsvg%3E';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  ...props
}) => {
  // 0: URL inicial | 1: Fallback específico | 2: Fallback SVG à prova de falhas
  const [errorStage, setErrorStage] = useState<number>(0);

  useEffect(() => {
    setErrorStage(0);
  }, [src]);

  // Identifica o contexto para fallback ideal
  const isHero = Boolean(
    (src && src.includes('hero')) ||
    (alt && (alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('paula malheiro')))
  );

  const isProfile = Boolean(
    (src && (src.includes('perfil') || src.includes('sobre') || src.includes('about'))) ||
    (alt && alt.toLowerCase().includes('perfil'))
  );

  const defaultStage1 = fallbackSrc || (isHero ? HERO_FALLBACK_IMAGE : isProfile ? PROFILE_FALLBACK_IMAGE : GENERAL_FALLBACK_IMAGE);

  const resolvedInitial = getImageUrl(src);
  const currentSrc = errorStage === 0
    ? (resolvedInitial || defaultStage1)
    : errorStage === 1
      ? defaultStage1
      : SAFE_SVG_FALLBACK;

  const handleError = () => {
    setErrorStage((prev) => {
      if (prev === 0) return 1;
      if (prev === 1) return 2;
      return prev;
    });
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      {...props}
    />
  );
};
