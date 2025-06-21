import { Layout } from '@/components/layout/Layout';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { getPagesServer } from '@/lib/api';
import { CategoryState } from '@/types/categories';

async function getCategoriesForHome(): Promise<CategoryState[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category/categories/`, {
    next: { revalidate: 3600 },
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'uk',
    },
  });

  if (!res.ok) {
    console.error('Ошибка получения категорий для главной страницы:', res.status, res.statusText);
    return [];
  }

  return res.json();
}

export default async function Home() {
  const [categories, pages] = await Promise.all([
    getCategoriesForHome(),
    getPagesServer()
  ]);

  console.log('🏠 Главная страница - категории:', categories.length);

  return (
    <Layout categories={categories} pages={pages}>
      <CategoriesGrid categories={categories} />
    </Layout>
  );
}
