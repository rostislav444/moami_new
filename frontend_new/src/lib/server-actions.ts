import { CategoryState, CollectionState } from '@/types/categories';

export async function getCategoriesServer(): Promise<CategoryState[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL ||
                   (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
    
    console.log('🌐 getCategoriesServer - API_URL:', API_URL);
    console.log('🌐 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🌐 API_URL:', process.env.API_URL);
    console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
    
    if (!API_URL) {
        console.warn('⚠️ API_URL не настроен, возвращаем пустой массив');
        return [];
    }

    const fullUrl = `${API_URL}/api/category/categories/`;
    console.log('📡 Делаем запрос к:', fullUrl);

    const response = await fetch(fullUrl, {
        next: { revalidate: 3600 },
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': 'uk',
        },
    });

    console.log('📥 Ответ от API:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
    });

    if (!response.ok) {
        console.error(`❌ Ошибка API: ${response.status} ${response.statusText}`);
        return [];
    }

    const data = await response.json();
    console.log('✅ Данные получены:', {
        categoriesCount: Array.isArray(data) ? data.length : 'не массив',
        firstCategory: Array.isArray(data) && data.length > 0 ? data[0].name : 'нет данных'
    });
    
    return data;
}

export async function getCollectionsServer(): Promise<CollectionState[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL ||
                   (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
    
    if (!API_URL) {
        console.warn('API_URL не настроен, возвращаем пустой массив');
        return [];
    }

    const response = await fetch(`${API_URL}/api/category/collections/`, {
        next: { revalidate: 3600 },
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': 'uk',
        },
    });

    if (!response.ok) {
        console.error(`Ошибка API: ${response.status} ${response.statusText}`);
        return [];
    }

    const data = await response.json();
    return data;
}

export async function getCategoryByIdServer(id: number): Promise<CategoryState | null> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL ||
                   (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');
    
    if (!API_URL) {
        return null;
    }

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

    return response.json();
} 