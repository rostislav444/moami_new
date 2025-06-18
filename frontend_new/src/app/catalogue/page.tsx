import { Layout } from '@/components/layout/Layout'
import { CategoriesGrid } from '@/components/home/CategoriesGrid'
import { getCategoriesServer } from '@/lib/server-actions'
import { getPagesServer } from '@/lib/api'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Каталог товарів - MOAMI',
  description: 'Повний каталог жіночого одягу, аксесуарів та взуття в інтернет-магазині MOAMI',
}

export default async function CataloguePage() {
  const [categories, pages] = await Promise.all([
    getCategoriesServer(),
    getPagesServer()
  ])

  return (
    <Layout categories={categories} pages={pages}>
      <div className="py-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-thin tracking-wide text-amber-900 mb-6 font-serif" style={{ letterSpacing: '0.06em' }}>
            Каталог товарів
          </h1>
          <p className="text-amber-800/60 text-xl font-light font-serif">
            Оберіть категорію для перегляду товарів
          </p>
        </div>
        <CategoriesGrid categories={categories} />
      </div>
    </Layout>
  )
} 