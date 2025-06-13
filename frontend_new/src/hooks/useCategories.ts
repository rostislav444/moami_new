import { useQuery } from '@tanstack/react-query'
import { CategoryState } from '@/types/categories'

async function fetchCategories(): Promise<CategoryState[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category/categories/`)
  
  if (!res.ok) {
    throw new Error('Failed to fetch categories')
  }
  
  return res.json()
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 30 * 60 * 1000, // 30 минут в кеше
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
} 