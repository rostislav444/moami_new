import { MinimalCategoriesGrid } from '@/components/home/MinimalCategoriesGrid';
import { getCategoriesServer } from '@/lib/server-actions';
import { mockCategories } from '@/store/categories';

export default async function Home() {
  console.log('🏠 Главная страница: Начинаем загрузку категорий...');
  
  // Пытаемся получить данные с реального API
  const categories = await getCategoriesServer();
  
  console.log('📊 Результат API:', {
    loadedFromAPI: categories.length,
    fallbackToMock: categories.length === 0,
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  });
  
  const finalCategories = categories.length > 0 ? categories : mockCategories;
  
  console.log('✅ Финальные категории:', finalCategories.length, 'категорий');

  return <MinimalCategoriesGrid categories={finalCategories} />;
}
