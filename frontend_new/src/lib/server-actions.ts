import { CategoryState, CollectionState } from '@/types/categories';

const getApiUrl = () => {
    // Prefer API_URL for server-side rendering (internal Docker network)
    // NEXT_PUBLIC_API_URL is for client-side only
    return process.env.API_URL ||
           (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
};

// Django requires Host header for proper routing
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept-Language': 'uk',
    'Host': 'moami.com.ua',
});

export async function getCategoriesServer(): Promise<CategoryState[]> {
    const API_URL = getApiUrl();

    if (!API_URL) {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/api/category/categories/`, {
            next: { revalidate: 3600 },
            headers: getHeaders(),
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
            headers: getHeaders(),
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
            headers: getHeaders(),
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    }
}
