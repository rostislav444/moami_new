import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, createQueryKeys } from '@/lib/api'

export const useCategories = () => {
  return useQuery({
    queryKey: createQueryKeys.categories,
    queryFn: () => api.get('/category/categories/'),
  })
}

export const useCollections = () => {
  return useQuery({
    queryKey: createQueryKeys.collections,
    queryFn: () => api.get('/category/collections/'),
  })
}

export const useProducts = (params?: any) => {
  return useQuery({
    queryKey: createQueryKeys.products(params),
    queryFn: () => api.get('/catalogue/', params),
    enabled: !!params,
  })
}

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: createQueryKeys.product(id),
    queryFn: () => api.get(`/product/${id}/`),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderData: any) => api.post('/order/', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: any) => api.put('/user/profile/', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKeys.user })
    },
  })
} 