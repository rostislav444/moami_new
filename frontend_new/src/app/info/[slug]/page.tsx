import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getPageServer, getPagesServer } from '@/lib/api'
import { getCategoriesServer } from '@/lib/server-actions'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const page = await getPageServer(resolvedParams.slug)
  
  if (!page) {
    return {
      title: 'Сторінка не знайдена - MOAMI',
    }
  }
  
  return {
    title: `${page.name} - MOAMI`,
    description: page.description.replace(/<[^>]*>/g, '').substring(0, 160),
  }
}

export default async function InfoPage({ params }: PageProps) {
  const resolvedParams = await params
  const [page, categories, pages] = await Promise.all([
    getPageServer(resolvedParams.slug),
    getCategoriesServer(),
    getPagesServer()
  ])
  
  if (!page) {
    notFound()
  }
  
  const breadcrumbs = [
    { label: 'Головна', href: '/' },
    { label: 'Інформація', href: '/info' },
    { label: page.name }
  ]
  
  return (
    <Layout categories={categories} pages={pages}>
      <div className="py-8">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light text-stone-800 mb-8 font-serif tracking-wide" 
              style={{ letterSpacing: '0.05em' }}>
            {page.name}
          </h1>
          
          <div 
            className="prose prose-stone max-w-none prose-lg"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.7',
              color: '#57534e'
            }}
            dangerouslySetInnerHTML={{ __html: page.description }}
          />
        </div>
      </div>
    </Layout>
  )
} 