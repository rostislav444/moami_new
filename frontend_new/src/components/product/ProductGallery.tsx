'use client'

import { useState, useEffect } from 'react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface ProductImage {
  image: string
}

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)

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

  const openZoomModal = () => {
    setIsZoomModalOpen(true)
  }

  const closeZoomModal = () => {
    setIsZoomModalOpen(false)
  }

  // Handle Escape key to close zoom modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomModalOpen) {
        closeZoomModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isZoomModalOpen])

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden cursor-zoom-in" onClick={openZoomModal}>
          <ImageWithFallback
            src={images[selectedImageIndex].image}
            alt={`${productName} - изображение ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 md:p-3 transition-all z-10 text-white hover:text-gray-200"
                title="Предыдущее изображение"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 md:p-3 transition-all z-10 text-white hover:text-gray-200"
                title="Следующее изображение"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
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
                className={`flex-shrink-0 w-20 aspect-[3/4] overflow-hidden border-2 transition-all duration-200 ${
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

      {/* Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-95 z-50 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={closeZoomModal}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-30 bg-black bg-opacity-50 w-10 h-10 flex items-center justify-center"
            title="Закрыть"
          >
            ✕
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-30 bg-black bg-opacity-50 w-14 h-14 flex items-center justify-center"
                title="Предыдущее изображение"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-30 bg-black bg-opacity-50 w-14 h-14 flex items-center justify-center"
                title="Следующее изображение"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white z-30 bg-black bg-opacity-50 px-3 py-1">
              {selectedImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoomable Image */}
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={5}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            doubleClick={{ mode: 'toggle' }}
            pinch={{ step: 5 }}
            limitToBounds={true}
            centerZoomedOut={true}
            alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
            velocityAnimation={{ sensitivity: 0.3, animationTime: 150 }}
            panning={{
              disabled: false,
              velocityDisabled: true,
              lockAxisX: false,
              lockAxisY: false,
              allowLeftClickPan: true,
              allowRightClickPan: false,
              allowMiddleClickPan: false,
            }}
            onPanningStart={(ref) => {
              if (ref.state.scale <= 1.05) {
                return false
              }
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                {/* Zoom Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
                  <button
                    onClick={() => zoomOut()}
                    className="bg-black bg-opacity-50 text-white px-4 py-2 hover:bg-opacity-70 transition-all"
                    title="Уменьшить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="bg-black bg-opacity-50 text-white px-4 py-2 hover:bg-opacity-70 transition-all"
                    title="Сбросить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => zoomIn()}
                    className="bg-black bg-opacity-50 text-white px-4 py-2 hover:bg-opacity-70 transition-all"
                    title="Увеличить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>

                <TransformComponent
                  wrapperClass="!w-screen !h-screen !absolute !inset-0"
                  contentClass="!w-full !h-full !flex !items-center !justify-center"
                >
                  <img
                    src={images[selectedImageIndex].image}
                    alt={`${productName} - увеличенное изображение ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100vw',
                      maxHeight: '100vh'
                    }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      )}
    </>
  )
} 