'use client'

import { Layout } from '@/components/layout/Layout';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { useCategories } from '@/hooks/useCategories';

export default function Home() {
  const { data: categories = [], isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fefcf7' }}>
        <div className="text-2xl font-thin text-amber-900 font-serif">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fefcf7' }}>
        <div className="text-2xl font-thin text-red-600 font-serif">Помилка завантаження категорій</div>
      </div>
    );
  }

  return (
    <Layout categories={categories}>
      <CategoriesGrid categories={categories} />
    </Layout>
  );
}
