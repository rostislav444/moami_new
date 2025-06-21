'use client'

import { useState } from 'react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

interface ProductImage {
  image: string
}

interface VariantImage {
  image: string
}

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Изображение недоступно</p>
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
      <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden rounded-lg">
        <ImageWithFallback
          src={images[selectedImageIndex].image}
          alt={`${productName} - изображение ${selectedImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow transition-all"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow transition-all"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="text-center text-sm text-gray-500">
          {selectedImageIndex + 1}/{images.length}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 rounded-lg transition-all duration-200 ${
                selectedImageIndex === index
                  ? 'border-amber-500 ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <ImageWithFallback
                src={image.image}
                alt={`${productName} - миниатюра ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 