'use client';

import { Layout } from '@/components/layout/Layout';
import { useCartStore } from '@/store/cart';
import { useCategories } from '@/hooks/useCategories';
import { OrderForm } from '@/components/order/OrderForm';
import { OrderSummary } from '@/components/order/OrderSummary';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderPage() {
  const { data: categories = [] } = useCategories();
  const { quantity } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    if (quantity === 0) {
      router.push('/');
    }
  }, [quantity, router]);

  if (quantity === 0) {
    return null;
  }

  return (
    <Layout categories={categories}>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-amber-900 mb-2 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
            Оформлення замовлення
          </h1>
          <p className="text-amber-700/60 font-light font-serif">
            Заповніть форму для оформлення замовлення
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <OrderForm />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </Layout>
  );
} 