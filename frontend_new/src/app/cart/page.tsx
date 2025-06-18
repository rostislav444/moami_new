'use client';

import { Layout } from '@/components/layout/Layout';
import { useCartStore } from '@/store/cart';
import { CartItem } from '@/components/cart/CartItem';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';

export default function CartPage() {
  const { data: categories = [] } = useCategories();
  const { items, total, quantity, clearCart } = useCartStore();

  if (quantity === 0) {
    return (
      <Layout categories={categories}>
        <div className="py-16 text-center">
          <div className="text-amber-700/40 mb-8">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-amber-900 mb-4 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ваш кошик порожній
          </h1>
          <p className="text-amber-700/60 mb-8 font-light font-serif">
            Додайте товари для покупки
          </p>
          <Link
            href="/"
            className="inline-block bg-amber-900 text-white py-3 px-8 font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif"
            style={{ borderRadius: '2px' }}
          >
            ПРОДОВЖИТИ ПОКУПКИ
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout categories={categories}>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-amber-900 mb-2 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
            Кошик
          </h1>
          <p className="text-amber-700/60 font-light font-serif">
            {quantity} {quantity === 1 ? 'товар' : quantity < 5 ? 'товари' : 'товарів'} у вашому кошику
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-sm p-6 space-y-6">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 rounded-sm p-6 space-y-6 sticky top-8">
              <h2 className="text-xl font-light text-amber-900 font-serif">
                Підсумок замовлення
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-amber-800/70">
                  <span className="font-light font-serif">Кількість товарів:</span>
                  <span className="font-serif">{quantity}</span>
                </div>
                <div className="flex justify-between text-amber-800/70">
                  <span className="font-light font-serif">Доставка:</span>
                  <span className="font-serif">Розраховується на кроці оформлення</span>
                </div>
                <div className="border-t border-amber-200/50 pt-3">
                  <div className="flex justify-between text-lg font-medium text-amber-900">
                    <span className="font-serif">Загальна сума:</span>
                    <span className="font-serif">{total} ₴</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/order"
                  className="block w-full bg-amber-900 text-white py-3 px-6 text-center font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif"
                  style={{ borderRadius: '2px' }}
                >
                  ОФОРМИТИ ЗАМОВЛЕННЯ
                </Link>
                
                <Link
                  href="/"
                  className="block w-full bg-amber-50 text-amber-900 py-3 px-6 text-center font-light text-sm tracking-wide hover:bg-amber-100 transition-colors duration-300 font-serif border border-amber-200"
                  style={{ borderRadius: '2px' }}
                >
                  ПРОДОВЖИТИ ПОКУПКИ
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs text-amber-700/60 hover:text-amber-800 transition-colors duration-300 font-light font-serif py-2"
                >
                  Очистити кошик
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 