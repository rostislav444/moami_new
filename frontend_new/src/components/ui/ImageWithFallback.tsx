'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    fallbackContent?: React.ReactNode;
    sizes?: string;
}

export function ImageWithFallback({
    src,
    alt,
    width,
    height,
    fill,
    className,
    fallbackContent,
    sizes
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    console.log(`ImageWithFallback: src=${src}, hasError=${hasError}, isLoading=${isLoading}`);

    if (hasError || !src) {
        return (
            <div className={`bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${className || ''}`}>
                {fallbackContent || (
                    <div className="text-gray-500 text-center p-4">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-400 rounded flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium">{alt}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                className={`${className || ''} ${fill ? 'w-full h-full object-cover' : ''}`}
                onError={(e) => {
                    console.error(`Ошибка загрузки изображения: ${src}`, e);
                    setHasError(true);
                    setIsLoading(false);
                }}
                onLoad={() => {
                    console.log(`Изображение загружено успешно: ${src}`);
                    setIsLoading(false);
                }}
                style={{
                    ...(fill ? { position: 'absolute', inset: 0 } : {}),
                    display: isLoading ? 'none' : 'block'
                }}
            />
        </div>
    );
} 