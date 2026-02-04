import axios from 'axios';
import { CategoryState, CollectionState } from '@/types/categories';
import { PageListItem, PageData } from '@/types/pages';

// Client-side API URL (used in browser)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moami.com.ua';
// Server-side API URL (used in SSR)
const SERVER_API_URL = process.env.API_URL || (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'uk', // Украинский по умолчанию
    },
});

export const categoriesApi = {
    async getCategories(): Promise<CategoryState[]> {
        const response = await api.get('/category/categories/');
        return response.data;
    },
    
    async getCategoryById(id: number): Promise<CategoryState> {
        const response = await api.get(`/category/categories/${id}/`);
        return response.data;
    },
    
    async getCollections(): Promise<CollectionState[]> {
        const response = await api.get('/category/collections/');
        return response.data;
    },
    
    async getCollectionById(id: number): Promise<CollectionState> {
        const response = await api.get(`/category/collections/${id}/`);
        return response.data;
    },
};

export const productsApi = {
    async getProductsByCategory(categorySlug: string, page = 1, limit = 20) {
        const response = await api.get(`/products/category/${categorySlug}`, {
            params: { page, limit }
        });
        return response.data;
    },
    
    async getProductsBySubcategory(categorySlug: string, subcategorySlug: string, page = 1, limit = 20) {
        const response = await api.get(`/products/category/${categorySlug}/${subcategorySlug}`, {
            params: { page, limit }
        });
        return response.data;
    },
    
    async getProductById(id: number) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
};

export async function getPagesServer(): Promise<PageListItem[]> {
  const res = await fetch(`${SERVER_API_URL}/api/pages/pages/`, {
    next: { revalidate: 86400 }
  })

  if (!res.ok) {
    return []
  }

  return res.json()
}

export async function getPageServer(slug: string): Promise<PageData | null> {
  const res = await fetch(`${SERVER_API_URL}/api/pages/pages/${slug}/`, {
    next: { revalidate: 86400 }
  })

  if (!res.ok) {
    return null
  }

  return res.json()
} 