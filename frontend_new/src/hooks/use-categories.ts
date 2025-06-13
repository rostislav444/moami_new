'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { CategoryState, CollectionState } from '@/types/categories';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;
export const COLLECTIONS_QUERY_KEY = ['collections'] as const;

export function useCategories() {
    return useQuery({
        queryKey: CATEGORIES_QUERY_KEY,
        queryFn: categoriesApi.getCategories,
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000, // 10 минут
    });
}

export function useCollections() {
    return useQuery({
        queryKey: COLLECTIONS_QUERY_KEY,
        queryFn: categoriesApi.getCollections,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useCategoryById(id: number) {
    return useQuery({
        queryKey: ['category', id],
        queryFn: () => categoriesApi.getCategoryById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCollectionById(id: number) {
    return useQuery({
        queryKey: ['collection', id],
        queryFn: () => categoriesApi.getCollectionById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function usePrefetchCategories() {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.prefetchQuery({
            queryKey: CATEGORIES_QUERY_KEY,
            queryFn: categoriesApi.getCategories,
            staleTime: 5 * 60 * 1000,
        });
    };
}

export function usePrefetchCollections() {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.prefetchQuery({
            queryKey: COLLECTIONS_QUERY_KEY,
            queryFn: categoriesApi.getCollections,
            staleTime: 5 * 60 * 1000,
        });
    };
} 