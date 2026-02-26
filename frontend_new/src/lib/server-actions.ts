import { CategoryState, CollectionState } from '@/types/categories';
import { serverFetch } from './server-fetch';

export async function getCategoriesServer(): Promise<CategoryState[]> {
    return serverFetch('/api/category/categories/', []);
}

export async function getCollectionsServer(): Promise<CollectionState[]> {
    return serverFetch('/api/category/collections/', []);
}

export async function getCategoryByIdServer(id: number): Promise<CategoryState | null> {
    return serverFetch(`/api/category/categories/${id}/`, null);
}
