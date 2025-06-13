'use client';

import { useState } from 'react';

interface SafeImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function SafeImage({ src, alt, className }: SafeImageProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return null;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
} 