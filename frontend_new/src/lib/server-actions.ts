import { CategoryState, CollectionState } from '@/types/categories';

const getApiUrl = () => {
    // Prefer API_URL for server-side rendering (internal Docker network)
    // NEXT_PUBLIC_API_URL is for client-side only
    return process.env.API_URL ||
           (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
};

const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moami.com.ua';

// Replace internal Docker URLs (http://web:8000) with public URL in API responses
function fixMediaUrls<T>(data: T): T {
    const json = JSON.stringify(data);
    const fixed = json.replace(/http:\/\/web:8000/g, PUBLIC_URL)
                      .replace(/http:\/\/localhost:8000/g, PUBLIC_URL);
    return JSON.parse(fixed);
}

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

        return fixMediaUrls(await response.json());
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

        return fixMediaUrls(await response.json());
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

        return fixMediaUrls(await response.json());
    } catch {
        return null;
    }
}
