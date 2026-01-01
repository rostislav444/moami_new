'use client';

import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  thumbnail?: string | null;
  alt: string;
  className?: string;
}

export function ProgressiveImage({ src, thumbnail, alt, className = '' }: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(thumbnail || src);

  useEffect(() => {
    if (!thumbnail) {
      setCurrentSrc(src);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src, thumbnail]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} transition-all duration-300 ${
        thumbnail && !isLoaded ? 'blur-sm scale-105' : 'blur-0 scale-100'
      }`}
      loading="lazy"
    />
  );
}
