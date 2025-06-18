import { Metadata } from 'next'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getPagesServer } from '@/lib/api'
import { getCategoriesServer } from '@/lib/server-actions'

export const metadata: Metadata = {
  title: 'Інформація - MOAMI',
  description: 'Корисна інформація про доставку, оплату, публічну оферту та інші умови',
}

export default async function InfoIndexPage() {
  const [pages, categories] = await Promise.all([
    getPagesServer(),
    getCategoriesServer()
  ])
  
  const breadcrumbs = [
    { label: 'Головна', href: '/' },
    { label: 'Інформація' }
  ]
  
  return (
    <Layout categories={categories} pages={pages}>
      <div className="py-8">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light text-stone-800 mb-8 font-serif tracking-wide" 
              style={{ letterSpacing: '0.05em' }}>
            Інформація
          </h1>
          
          {pages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/info/${page.slug}`}
                  className="group block p-6 bg-stone-50 hover:bg-stone-100 rounded transition-colors duration-300 border border-stone-200/50 hover:border-stone-300"
                >
                  <h3 className="text-lg font-medium text-stone-800 group-hover:text-stone-600 transition-colors duration-300 font-serif"
                      style={{ letterSpacing: '0.02em' }}>
                    {page.name}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-stone-700 mb-4" style={{ fontFamily: 'serif' }}>
                Інформаційні сторінки не знайдені
              </p>
              <p className="text-stone-600">
                Спробуйте пізніше або зверніться до адміністратора
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 