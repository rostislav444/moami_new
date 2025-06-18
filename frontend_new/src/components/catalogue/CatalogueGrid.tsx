'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CategoryState } from '@/types/categories'

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
  categories?: CategoryState[]
  currentCategory?: CategoryState
}

export default function CatalogueGrid({ 
  products, 
  totalCount, 
  currentPage, 
  pageSize, 
  categoryPath,
  categories = [],
  currentCategory
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

  const getSubcategories = () => {
    if (!currentCategory || !currentCategory.children || currentCategory.children.length === 0) {
      return []
    }

    return currentCategory.children.filter(child => child.children.length === 0 || child.children.length > 0)
  }

  const subcategories = getSubcategories()
  
  return (
    <div>
      {subcategories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-light text-amber-900 mb-6 font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>
            Категорії
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {subcategories.map((category) => (
              <Link
                key={category.id}
                href={`/${categoryPath}/${category.slug}`}
                className="group block relative overflow-hidden rounded transition-all duration-300 hover:shadow-md"
              >
                <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-amber-100">
                  {category.image && (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover opacity-90 group-hover:opacity-70 transition-opacity duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 via-amber-800/10 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <h3 className="text-sm font-medium text-white group-hover:text-amber-900 transition-colors duration-300 leading-tight font-serif mb-1"
                        style={{ letterSpacing: '0.02em'}}>
                      {category.name}
                    </h3>
                    {category.products_count > 0 && (
                      <p className="text-xs text-stone-300 font-light">
                        {category.products_count} товарів
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <span className="text-base text-amber-900 font-light font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>Показати:</span>
          <select 
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-amber-300 rounded px-3 py-2 text-base bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 font-light font-serif"
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
            <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-amber-50 rounded-sm">
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
            </div>
            
            <div>
              <h3 className="text-base font-light text-amber-900 line-clamp-2 group-hover:text-amber-700 transition-colors duration-300 leading-relaxed mb-2"
                  style={{ fontFamily: 'Crimson Text, serif' }}>
                {variant.product.name}
              </h3>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-medium text-amber-900">
                  {variant.product.price} ₴
                </span>
                {variant.product.old_price && (
                  <span className="text-base text-amber-600 line-through font-light">
                    {variant.product.old_price} ₴
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {variant.sizes.filter(size => size.stock > 0).map((size) => (
                  <span 
                    key={size.id}
                    className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded font-light"
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
        <div className="flex justify-center items-center gap-8 mt-8 py-12">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="text-base text-amber-800/70 hover:text-amber-900 disabled:text-amber-400 disabled:cursor-not-allowed transition-all duration-500 font-light tracking-wide font-serif"
            style={{ letterSpacing: '0.05em' }}
          >
            ← Попередня
          </button>
          
          <div className="flex gap-6">
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
                  className={`text-base transition-all duration-500 font-light tracking-wide font-serif ${
                    currentPage === pageNum
                      ? 'text-amber-900 border-b-2 border-amber-900 pb-1'
                      : 'text-amber-700/60 hover:text-amber-900 hover:border-b border-amber-300 pb-1'
                  }`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="text-base text-amber-800/70 hover:text-amber-900 disabled:text-amber-400 disabled:cursor-not-allowed transition-all duration-500 font-light tracking-wide font-serif"
            style={{ letterSpacing: '0.05em' }}
          >
            Наступна →
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