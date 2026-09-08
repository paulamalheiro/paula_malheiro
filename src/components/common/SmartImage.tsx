import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../lib/supabase';

// Fallback elegante de arquitetura e imóveis
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
// Foto oficial de Paula Malheiro
const PAULA_FALLBACK_IMAGE = '/pm_perfil.jpeg';

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isPaulaPhoto = Boolean(
    (src && (src.includes('paula') || src.includes('perfil') || src.includes('hero'))) ||
    (alt && alt.toLowerCase().includes('paula'))
  );

  const finalFallback = fallbackSrc || (isPaulaPhoto ? PAULA_FALLBACK_IMAGE : DEFAULT_FALLBACK_IMAGE);
  const initialUrl = getImageUrl(src) || finalFallback;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  return (
    <img
      src={hasError ? finalFallback : initialUrl}
      alt={alt}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      {...props}
    />
  );
};
