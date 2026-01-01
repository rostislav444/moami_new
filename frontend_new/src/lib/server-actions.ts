import { CategoryState, CollectionState } from '@/types/categories';

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL ||
           (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
};

export async function getCategoriesServer(): Promise<CategoryState[]> {
    const API_URL = getApiUrl();

    if (!API_URL) {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/category/categories/`, {
            next: { revalidate: 3600 },
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'uk',
            },
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch {
        return [];
    }
}

export async function getCollectionsServer(): Promise<CollectionState[]> {
    const API_URL = getApiUrl();

    if (!API_URL) {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/category/collections/`, {
            next: { revalidate: 3600 },
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'uk',
            },
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch {
        return [];
    }
}

export async function getCategoryByIdServer(id: number): Promise<CategoryState | null> {
    const API_URL = getApiUrl();

    if (!API_URL) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/api/category/categories/${id}/`, {
            next: { revalidate: 3600 },
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'uk',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    }
}
