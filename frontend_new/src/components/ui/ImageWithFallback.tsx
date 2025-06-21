'use client';

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

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
    return <img src={src} alt={alt} className={className} />;
} 