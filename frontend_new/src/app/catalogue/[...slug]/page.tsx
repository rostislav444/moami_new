import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CatalogueGrid from '@/components/catalogue/CatalogueGrid'
import { Layout } from '@/components/layout/Layout'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { CategoryState } from '@/types/categories'

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

async function getCategories(): Promise<CategoryState[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category/categories/`, {
    next: { revalidate: 3600 }
  })
  
  if (!res.ok) {
    return []
  }
  
  return res.json()
}

function createBreadcrumbs(slugs: string[], categories: CategoryState[]) {
  const breadcrumbs = []
  let currentCategories = categories
  
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const category = currentCategories.find(cat => cat.slug === slug)
    
    if (category) {
      const href = i === slugs.length - 1 ? undefined : `/catalogue/${slugs.slice(0, i + 1).join('/')}`
      breadcrumbs.push({
        label: category.name,
        href
      })
      currentCategories = category.children
    }
  }
  
  return breadcrumbs
}

function findCurrentCategory(slugs: string[], categories: CategoryState[]): CategoryState | undefined {
  let currentCategories = categories
  let currentCategory: CategoryState | undefined
  
  for (const slug of slugs) {
    currentCategory = currentCategories.find(cat => cat.slug === slug)
    if (!currentCategory) break
    currentCategories = currentCategory.children
  }
  
  return currentCategory
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
  
  const [catalogue, categories] = await Promise.all([
    getCatalogue(categorySlug, currentPage, pageSize),
    getCategories()
  ])
  
  if (!catalogue) {
    notFound()
  }
  
  const breadcrumbs = createBreadcrumbs(resolvedParams.slug, categories)
  const currentCategory = findCurrentCategory(resolvedParams.slug, categories)
  
  return (
    <Layout categories={categories}>
      <div className="py-8">
        <Breadcrumbs items={breadcrumbs} />
        <CatalogueGrid 
          products={catalogue.results}
          totalCount={catalogue.count}
          currentPage={currentPage}
          pageSize={pageSize}
          categoryPath={`catalogue/${resolvedParams.slug.join('/')}`}
          categories={categories}
          currentCategory={currentCategory}
        />
      </div>
    </Layout>
  )
} 