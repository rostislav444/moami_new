'use client';

import { Layout } from '@/components/layout/Layout';
import { useCategories } from '@/hooks/useCategories';
import { event as fbEvent } from '@/lib/FacebookPixel';
import Link from 'next/link';
import { useEffect } from 'react';

export default function OrderSuccessPage() {
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    // Facebook Pixel Purchase event
    const completedOrderData = localStorage.getItem('completedOrder');
    if (completedOrderData) {
      const orderData = JSON.parse(completedOrderData);
      
      fbEvent('Purchase', {
        content_ids: orderData.items.map((item: any) => item.content_id),
        content_type: 'product',
        contents: orderData.items,
        value: orderData.total_value,
        currency: orderData.currency
      });
      
      // Очищаем данные после отправки события
      localStorage.removeItem('completedOrder');
    }
  }, []);

  return (
    <Layout categories={categories}>
      <div className="py-16 text-center">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-green-600 mb-8">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-light text-amber-900 mb-4 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
            Замовлення успішно оформлено!
          </h1>
          
          <div className="text-amber-700/70 mb-8 space-y-3 font-light font-serif">
            <p className="text-lg">
              Дякуємо за ваше замовлення! Ми зв'яжемося з вами найближчим часом для підтвердження деталей.
            </p>
            <p>
              Інформація про замовлення буде надіслана на вказаний номер телефону та email (якщо вказано).
            </p>
          </div>

          {/* Order Details Info */}
          <div className="bg-white/70 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-light text-amber-900 mb-4 font-serif">
              Що далі?
            </h2>
            <div className="space-y-3 text-amber-800/70 font-light font-serif">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium text-amber-800 mt-0.5">
                  1
                </span>
                <p>Наш менеджер зв'яжеться з вами протягом робочого дня для підтвердження замовлення</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium text-amber-800 mt-0.5">
                  2
                </span>
                <p>Після підтвердження ми підготуємо ваше замовлення до відправки</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-medium text-amber-800 mt-0.5">
                  3
                </span>
                <p>Ви отримаете повідомлення з трек-номером для відстеження посилки</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-amber-50/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-light text-amber-900 mb-3 font-serif">
              Є питання?
            </h3>
            <div className="text-amber-800/70 font-light font-serif space-y-2">
              <p>Зв'яжіться з нами:</p>
              <p className="text-amber-900 font-medium">
                📞 +38 (XXX) XXX-XX-XX
              </p>
              <p className="text-amber-900 font-medium">
                ✉️ info@moami.com.ua
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block bg-amber-900 text-white py-3 px-8 font-light text-sm tracking-wide hover:bg-amber-800 transition-colors duration-300 font-serif"
              style={{ borderRadius: '2px' }}
            >
              ПОВЕРНУТИСЯ НА ГОЛОВНУ
            </Link>
            
            <div>
              <Link
                href="/catalogue"
                className="inline-block bg-amber-50 text-amber-900 py-3 px-8 font-light text-sm tracking-wide hover:bg-amber-100 transition-colors duration-300 font-serif border border-amber-200"
                style={{ borderRadius: '2px' }}
              >
                ПРОДОВЖИТИ ПОКУПКИ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 