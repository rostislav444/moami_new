'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { event as fbEvent } from '@/lib/FacebookPixel'
import { event as gaEvent } from '@/components/analytics/GoogleAnalytics'

interface ProductVariant {
  id: number
  name: string
  slug: string
  code: string
  product: {
    id: number
    name: string
    slug: string
    price: number
    old_price?: number
    description: string
    extra_description?: string
    properties: Array<{
      key: string
      value: string
    }>
    variants: Array<{
      id: number
      slug: string
      image: string
      color: {
        id: number
        name: string
        code: string
      }
      code: string
      sizes: Array<{
        id: number
        size: {
          ua: string
          int: string
          eu: string
        }
        stock: number
      }>
    }>
  }
  color: {
    id: number
    name: string
    code: string
  }
  images: Array<{
    image: string
    dimensions?: any
    thumbnails?: Array<{
      image: string
    }>
  }>
  sizes: Array<{
    id: number
    size: {
      ua: string
      int: string
      eu: string
    }
    stock: number
  }>
}

interface ProductDescriptionProps {
  variant: ProductVariant
}

export default function ProductDescription({ variant }: ProductDescriptionProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const { addItem } = useCartStore()
  
  const handleSizeSelect = (sizeId: number) => {
    setSelectedSize(sizeId)
    setSizeError(false)
  }
  
  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true)
      return
    }
    
    const selectedSizeData = variant.sizes.find(size => size.id === selectedSize)
    if (!selectedSizeData) return
    
    const cartItem = {
      id: selectedSize,
      stock: selectedSizeData.stock,
      image: variant.images[0]?.image || '',
      size: selectedSizeData.size,
      name: variant.name,
      slug: variant.slug,
      code: variant.code,
      price: variant.product.price,
      old_price: variant.product.old_price,
      selectedGrid: 'ua',
      variantId: variant.id,
      sizeId: selectedSize,
    }
    
    // Facebook Pixel event
    fbEvent('AddToCart', {
      content_name: variant.name,
      content_ids: [variant.code],
      content_type: 'product',
      value: variant.product.price,
      currency: 'UAH'
    })
    
    // Google Analytics event
    gaEvent({
      action: 'add_to_cart',
      category: 'ecommerce',
      label: variant.name,
      value: variant.product.price
    })
    
    addItem(cartItem)
  }
  
  return (
    <div className="space-y-6">
      <div className="border-b border-amber-200/30 pb-4">
        <div className="text-xs text-amber-700/40 font-light tracking-wide font-serif uppercase mb-4" 
             style={{ letterSpacing: '0.1em' }}>
          Код: {variant.code}
        </div>
        
        <h1 className="text-2xl md:text-3xl font-thin text-amber-900 mb-4 leading-tight" 
            style={{ fontFamily: 'Playfair Display, serif' }}>
          {variant.name}
        </h1>
        
        <div className="flex items-baseline gap-4">
          <span className="text-2xl font-light text-amber-900" 
                style={{ fontFamily: 'Playfair Display, serif' }}>
            {variant.product.price} ₴
          </span>
          {variant.product.old_price && (
            <span className="text-lg text-amber-600/60 line-through font-light">
              {variant.product.old_price} ₴
            </span>
          )}
        </div>
        {variant.product.old_price && (
          <div className="text-xs text-amber-700/50 font-light mt-1">
            Спеціальна ціна
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <p className="text-amber-800/70 leading-relaxed font-light text-sm">
          {variant.product.description}
        </p>
        
        {variant.product.properties.length > 0 && (
          <div className="space-y-2">
            {variant.product.properties.map((property, index) => (
              <div key={index} className="flex text-sm">
                <span className="font-medium text-amber-900/60 mr-2 min-w-fit">
                  {property.key}:
                </span>
                <span className="text-amber-800/70 font-light">
                  {property.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {variant.product.variants.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-light text-amber-900 font-serif">
            Кольори
          </h3>
          <div className="flex gap-3">
            {variant.product.variants.map((variantOption) => (
              <Link
                key={variantOption.id}
                href={`/p-${variantOption.slug}`}
                className={`relative w-16 h-20 overflow-hidden bg-white/30 transition-all duration-300 group ${
                  variantOption.id === variant.id
                    ? 'ring-1 ring-amber-800/40'
                    : 'opacity-70 hover:opacity-90'
                }`}
                title={variantOption.color.name}
              >
                {variantOption.image ? (
                  <img
                    src={variantOption.image}
                    alt={variantOption.color.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-amber-100/50" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <div className="text-white text-xs font-light text-center leading-tight">
                    {variantOption.color.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {variant.sizes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-light text-amber-900 font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>
            Розміри
          </h3>
          <div className="flex flex-wrap gap-3">
            {variant.sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => size.stock > 0 && handleSizeSelect(size.id)}
                disabled={size.stock === 0}
                className={`inline-flex flex-col items-center justify-center w-16 h-16 border transition-all duration-500 font-serif ${
                  size.stock === 0
                    ? 'border-amber-200/30 text-amber-400/40 cursor-not-allowed bg-amber-50/20'
                    : selectedSize === size.id
                    ? 'border-amber-800 bg-amber-900 text-white shadow-sm'
                    : 'border-amber-600/40 text-amber-900 hover:border-amber-800 hover:bg-amber-50/30 bg-white/50'
                }`}
              >
                <span className="text-base font-light tracking-wide">{size.size.ua}</span>
                <span className="text-xs font-light opacity-70">{size.size.int}</span>
              </button>
            ))}
          </div>
          {sizeError && (
            <p className="text-amber-900/70 text-sm font-light font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>
              Будь ласка, оберіть розмір
            </p>
          )}
        </div>
      )}
      
      <div className="pt-4">
        <button
          onClick={handleAddToCart}
          className="w-full bg-amber-900 text-white py-3 px-6 font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif"
        >
          ДОДАТИ ДО КОШИКА
        </button>
      </div>
    </div>
  )
} 