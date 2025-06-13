'use client';

import { useEffect } from 'react';
import { CategoryState } from '@/types/categories';
import { useQueryClient } from '@tanstack/react-query';
import { CATEGORIES_QUERY_KEY } from '@/hooks/use-categories';

interface CategoriesClientProps {
    initialCategories: CategoryState[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const queryClient = useQueryClient();

    useEffect(() => {
        queryClient.setQueryData(CATEGORIES_QUERY_KEY, initialCategories);
    }, [initialCategories, queryClient]);

    return null;
} 