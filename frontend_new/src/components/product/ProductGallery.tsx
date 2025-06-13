'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ProductImage {
  image: string
  dimensions?: any
  thumbnails?: Array<{
    image: string
  }>
}

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  
  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-white/50 backdrop-blur-sm flex items-center justify-center" 
           style={{ borderRadius: '2px' }}>
        <span className="text-amber-700/40 font-light tracking-wide font-serif" 
              style={{ letterSpacing: '0.05em' }}>
          Зображення відсутнє
        </span>
      </div>
    )
  }
  
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div className="aspect-[4/5] relative overflow-hidden bg-white/30 backdrop-blur-sm" 
             style={{ borderRadius: '2px' }}>
          <Image
            src={images[selectedImageIndex].image}
            alt={productName}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm text-amber-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/90 flex items-center justify-center"
                style={{ borderRadius: '2px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm text-amber-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/90 flex items-center justify-center"
                style={{ borderRadius: '2px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 text-xs text-amber-900 font-light"
                 style={{ borderRadius: '2px' }}>
              {selectedImageIndex + 1}/{images.length}
            </div>
          )}
        </div>
      </div>
      
      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-[4/5] relative overflow-hidden bg-white/30 backdrop-blur-sm transition-all duration-300 ${
                selectedImageIndex === index 
                  ? 'ring-1 ring-amber-800/40 opacity-100' 
                  : 'opacity-70 hover:opacity-90'
              }`}
              style={{ borderRadius: '2px' }}
            >
              <Image
                src={image.image}
                alt={`${productName} - ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 