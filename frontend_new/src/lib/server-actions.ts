import { CategoryState, CollectionState } from '@/types/categories';

export async function getCategoriesServer(): Promise<CategoryState[]> {
    // Для server-side запросов используем внутренний URL контейнера
    const API_URL = process.env.API_URL || 'http://web:8000';
    
    console.log('🌐 getCategoriesServer - API_URL:', API_URL);
    
    if (!API_URL) {
        console.warn('⚠️ API_URL не настроен, возвращаем пустой массив');
        return [];
    }

    const fullUrl = `${API_URL}/api/category/categories/`;
    console.log('📡 Делаем запрос к:', fullUrl);

    try {
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
    } catch (error) {
        console.error('❌ Ошибка получения категорий:', error);
        return [];
    }
}

export async function getCollectionsServer(): Promise<CollectionState[]> {
    // Для server-side запросов используем внутренний URL контейнера
    const API_URL = process.env.API_URL || 'http://web:8000';
    
    if (!API_URL) {
        console.warn('API_URL не настроен, возвращаем пустой массив');
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
            console.error(`Ошибка API: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка получения коллекций:', error);
        return [];
    }
}

export async function getCategoryByIdServer(id: number): Promise<CategoryState | null> {
    // Для server-side запросов используем внутренний URL контейнера
    const API_URL = process.env.API_URL || 'http://web:8000';
    
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

        return response.json();
    } catch (error) {
        console.error('Ошибка получения категории:', error);
        return null;
    }
} 