import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CatalogueGrid from '@/components/catalogue/CatalogueGrid'

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
  searchParams: Promise<{
    page?: string
    page_size?: string
  }>
}

interface ProductVariant {
  id: number
  slug: string
  product: {
    id: number
    name: string
    price: number
    old_price?: number
  }
  images: Array<{
    image: string
    dimensions?: any
    thumbnails?: Array<{
      image: string
    }>
  }>
  sizes: Array<{
    id: number
    size: {
      ua: string
      int: string
      eu: string
    }
    stock: number
  }>
}

interface CatalogueResponse {
  count: number
  next: string | null
  previous: string | null
  results: ProductVariant[]
}

async function getCatalogue(categorySlug: string, page: number = 1, pageSize: number = 24): Promise<CatalogueResponse | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/catalogue/?category=${categorySlug}&page=${page}&page_size=${pageSize}`, {
    next: { revalidate: 3600 }
  })
  
  if (!res.ok) {
    return null
  }
  
  return res.json()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const categoryPath = resolvedParams.slug.join('/')
  
  return {
    title: `Каталог - ${categoryPath} - MOAMI`,
    description: `Перегляньте нашу колекцію товарів у категорії ${categoryPath}`,
  }
}

export default async function CataloguePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const categorySlug = resolvedParams.slug.join(',')
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10)
  const pageSize = parseInt(resolvedSearchParams.page_size || '24', 10)
  
  const catalogue = await getCatalogue(categorySlug, currentPage, pageSize)
  
  if (!catalogue) {
    notFound()
  }
  
  return (
    <CatalogueGrid 
      products={catalogue.results}
      totalCount={catalogue.count}
      currentPage={currentPage}
      pageSize={pageSize}
      categoryPath={`catalogue/${resolvedParams.slug.join('/')}`}
    />
  )
} 