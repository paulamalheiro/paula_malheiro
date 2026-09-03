import React, { useState } from 'react';
import { getImageUrl } from '../../lib/supabase';

// Fallback elegante de arquitetura e imóveis caso o arquivo não exista localmente
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const initialUrl = getImageUrl(src) || fallbackSrc;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  return (
    <img
      src={hasError ? fallbackSrc : initialUrl}
      alt={alt}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      {...props}
    />
  );
};
