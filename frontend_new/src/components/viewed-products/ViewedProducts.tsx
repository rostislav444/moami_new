'use client';

import { useViewedProductsStore } from '@/store/viewed-products';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

export function ViewedProducts() {
  const { viewedProducts } = useViewedProductsStore();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Скрыть на страницах корзины и заказа
  if (
    viewedProducts.length === 0 ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/order')
  ) {
    return null;
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white/30 border-t border-amber-200/30 py-8 mb-8">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-light text-amber-900 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ви переглядали
            </h2>
            <span className="text-amber-700/60 font-light font-serif">
              ({viewedProducts.length})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={scrollLeft}
                className="w-8 h-8 flex items-center justify-center text-amber-700/60 hover:text-amber-800 hover:bg-amber-100/50 transition-all duration-300"
                title="←"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                className="w-8 h-8 flex items-center justify-center text-amber-700/60 hover:text-amber-800 hover:bg-amber-100/50 transition-all duration-300"
                title="→"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-amber-700/40 hover:text-amber-800 transition-colors duration-300 p-1"
              title="Приховати"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {viewedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/p-${product.slug}`}
              className="flex-shrink-0 group"
            >
              <div className="w-32 space-y-3">
                {/* Image */}
                <div className="relative w-32 h-40 bg-gray-100 overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="text-xs font-light text-amber-900 line-clamp-2 leading-tight font-serif" style={{ letterSpacing: '0.02em' }}>
                    {product.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-amber-900 font-serif">
                      {product.price} ₴
                    </span>
                    {product.old_price && (
                      <span className="text-xs text-amber-600/60 line-through font-light">
                        {product.old_price} ₴
                      </span>
                    )}
                  </div>
                  
                  {/* Color */}
                  <div className="text-xs text-amber-700/50 font-light font-serif">
                    {product.color.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 