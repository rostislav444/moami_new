'use client';

import { useCartStore } from '@/store/cart';
import { CartItem } from './CartItem';
import Link from 'next/link';

export function CartDrawer() {
  const { items, total, quantity, isOpen, closeCart, clearCart } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-amber-200/50">
            <h2 className="text-xl font-light text-amber-900 font-serif tracking-wide" style={{ letterSpacing: '0.05em' }}>
              Кошик ({quantity})
            </h2>
            <button 
              onClick={closeCart}
              className="text-amber-800 hover:text-amber-900 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-amber-700/40 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-lg font-light text-amber-800 mb-2 font-serif">Кошик порожній</p>
                <p className="text-sm text-amber-700/60 font-light font-serif">Додайте товари для покупки</p>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-amber-200/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-light text-amber-900 font-serif">Загальна сума:</span>
                  <span className="text-xl font-medium text-amber-900 font-serif">{total} ₴</span>
                </div>
                
                <div className="space-y-3">
                  <Link 
                    href="/cart"
                    onClick={closeCart}
                    className="block w-full bg-amber-50 text-amber-900 py-3 px-6 text-center font-light text-sm tracking-wide hover:bg-amber-100 transition-colors duration-300 font-serif border border-amber-200"
                  >
                    ПЕРЕГЛЯНУТИ КОШИК
                  </Link>
                  
                  <Link 
                    href="/order"
                    onClick={closeCart}
                    className="block w-full bg-amber-900 text-white py-3 px-6 text-center font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif"
                  >
                    ОФОРМИТИ ЗАМОВЛЕННЯ
                  </Link>
                </div>

                <button 
                  onClick={clearCart}
                  className="w-full text-center text-xs text-amber-700/60 hover:text-amber-800 transition-colors duration-300 font-light font-serif py-2"
                >
                  Очистити кошик
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
} 