'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProductVariant {
  id: number
  slug: string
  product: {
    id: number
    name: string
    price: number
    old_price?: number
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

interface CatalogueGridProps {
  products: ProductVariant[]
  totalCount: number
  currentPage: number
  pageSize: number
  categoryPath: string
}

export default function CatalogueGrid({ 
  products, 
  totalCount, 
  currentPage, 
  pageSize, 
  categoryPath 
}: CatalogueGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
  
  const totalPages = Math.ceil(totalCount / pageSize)
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/${categoryPath}?${params.toString()}`)
  }
  
  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page_size', newPageSize.toString())
    params.delete('page')
    router.push(`/${categoryPath}?${params.toString()}`)
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <span className="text-sm text-amber-700">Показати:</span>
          <select 
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-amber-200 rounded px-3 py-1 text-sm bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value={24}>24</option>
            <option value={48}>48</option>
            <option value={96}>96</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {products.map((variant) => (
          <Link
            key={variant.id}
            href={`/p-${variant.slug}`}
            className="group block"
            onMouseEnter={() => setHoveredProduct(variant.id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-amber-50 rounded-lg">
              {variant.images.length > 0 && (
                <Image
                  src={variant.images[0].image}
                  alt={variant.product.name}
                  fill
                  className={`object-cover transition-transform duration-700 ${
                    hoveredProduct === variant.id ? 'scale-110' : 'scale-100'
                  }`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              
              {variant.images.length > 1 && hoveredProduct === variant.id && (
                <Image
                  src={variant.images[1].image}
                  alt={variant.product.name}
                  fill
                  className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              
              {variant.product.old_price && (
                <div className="absolute top-3 left-3 bg-amber-800 text-white text-xs px-2 py-1 rounded">
                  ЗНИЖКА
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-light text-amber-900 line-clamp-2 group-hover:text-amber-700 transition-colors duration-300"
                  style={{ fontFamily: 'Crimson Text, serif' }}>
                {variant.product.name}
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-light text-amber-900">
                  {variant.product.price} ₴
                </span>
                {variant.product.old_price && (
                  <span className="text-sm text-amber-600 line-through">
                    {variant.product.old_price} ₴
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {variant.sizes.filter(size => size.stock > 0).map((size) => (
                  <span 
                    key={size.id}
                    className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded"
                  >
                    {size.size.ua}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm border border-amber-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors duration-300"
          >
            Попередня
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 text-sm rounded transition-colors duration-300 ${
                    currentPage === pageNum
                      ? 'bg-amber-800 text-white'
                      : 'border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm border border-amber-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors duration-300"
          >
            Наступна
          </button>
        </div>
      )}
      
      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl text-amber-700 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Товари не знайдені
          </p>
          <p className="text-amber-600">
            Спробуйте змінити фільтри або перейти до іншої категорії
          </p>
        </div>
      )}
    </div>
  )
} 