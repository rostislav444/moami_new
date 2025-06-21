import { Layout } from '@/components/layout/Layout';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { getCategoriesServer } from '@/lib/server-actions';
import { getPagesServer } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, pages] = await Promise.all([
    getCategoriesServer(),
    getPagesServer()
  ]);

  return (
    <Layout categories={categories} pages={pages}>
      <CategoriesGrid categories={categories} />
    </Layout>
  );
}
