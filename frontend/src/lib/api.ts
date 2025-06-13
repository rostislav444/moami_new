import axios from 'axios'
import { API_BASE_URL } from '@/local'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export const api = {
  get: <T>(url: string, params?: any) => 
    apiClient.get<ApiResponse<T>>(url, { params }).then(res => res.data),
  
  post: <T>(url: string, data?: any) => 
    apiClient.post<ApiResponse<T>>(url, data).then(res => res.data),
  
  put: <T>(url: string, data?: any) => 
    apiClient.put<ApiResponse<T>>(url, data).then(res => res.data),
  
  delete: <T>(url: string) => 
    apiClient.delete<ApiResponse<T>>(url).then(res => res.data),
}

export const createQueryKeys = {
  categories: ['categories'] as const,
  collections: ['collections'] as const,
  products: (params?: any) => ['products', params] as const,
  product: (id: number) => ['product', id] as const,
  cart: ['cart'] as const,
  user: ['user'] as const,
} 