'use client';

interface SimpleImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function SimpleImage({ src, alt, className }: SimpleImageProps) {
    console.log(`SimpleImage: загружаю ${src}`);
    
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onLoad={() => console.log(`✅ Загружено: ${src}`)}
            onError={(e) => console.error(`❌ Ошибка: ${src}`, e)}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            }}
        />
    );
} 