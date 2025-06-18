import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductPage from '@/components/product/ProductPage'
import { Layout } from '@/components/layout/Layout'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { CategoryState } from '@/types/categories'
import { ProductViewTracker } from '@/components/product/ProductViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

interface ProductVariant {
  id: number
  name: string
  slug: string
  code: string
  product: {
    id: number
    name: string
    slug: string
    price: number
    old_price?: number
    description: string
    extra_description?: string
    properties: Array<{
      key: string
      value: string
    }>
    breadcrumbs: Array<{
      title: string
      link: string
    }>
    variants: Array<{
      id: number
      slug: string
      image: string
      color: {
        id: number
        name: string
        code: string
      }
      code: string
      sizes: Array<{
        id: number
        size: {
          ua: string
          int: string
          eu: string
        }
        stock: number
      }>
    }>
  }
  color: {
    id: number
    name: string
    code: string
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

async function getProduct(slug: string): Promise<ProductVariant | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/product/variants/${slug}/`, {
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.slug)
  
  if (!product) {
    return {
      title: 'Товар не знайдено'
    }
  }
  
  return {
    title: `${product.name} - MOAMI`,
    description: product.product.description.slice(0, 160) + '...',
    openGraph: {
      title: `${product.name} - MOAMI`,
      description: product.product.description.slice(0, 160) + '...',
      images: product.images.length > 0 ? [product.images[0].image] : [],
    }
  }
}

export default async function ProductPageRoute({ params }: PageProps) {
  const resolvedParams = await params
  
  const [product, categories] = await Promise.all([
    getProduct(resolvedParams.slug),
    getCategories()
  ])

  console.log(product)
  console.log(categories)
  
  if (!product) {
    notFound()
  }

  const serverBreadcrumbs = product.product.breadcrumbs.slice(0, 2).map(breadcrumb => ({
    label: breadcrumb.title,
    href: breadcrumb.link
  }));
  
  const breadcrumbs = [
    ...serverBreadcrumbs,
    { label: product.product.name }
  ]
  
  return (
    <Layout categories={categories}>
      <ProductViewTracker variant={product} />
      <div className="py-8">
        <Breadcrumbs items={breadcrumbs} />
        <ProductPage variant={product} />
      </div>
    </Layout>
  )
} 