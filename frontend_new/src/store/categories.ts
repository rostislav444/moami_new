import { create } from 'zustand';
import { CategoryState, CategoryStore } from '@/types/categories';

export const useCategoriesStore = create<CategoryStore>((set) => ({
    categories: [],
    isLoading: false,
    
    setCategories: (categories: CategoryState[]) => set({ categories }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const mockCategories: CategoryState[] = [
    {
        id: 1,
        name: 'Платья',
        slug: 'dresses',
        parent: null,
        image: null,
        products_count: 45,
        preferred_size_grid: null,
        size_group: null,
        children: [
            {
                id: 11,
                name: 'Летние платья',
                slug: 'summer-dresses',
                parent: 1,
                image: '/images/summer-dress.jpg',
                products_count: 15,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 12,
                name: 'Вечерние платья',
                slug: 'evening-dresses',
                parent: 1,
                image: '/images/evening-dress.jpg',
                products_count: 12,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 13,
                name: 'Коктейльные платья',
                slug: 'cocktail-dresses',
                parent: 1,
                image: '/images/cocktail-dress.jpg',
                products_count: 18,
                preferred_size_grid: null,
                size_group: null,
                children: []
            }
        ]
    },
    {
        id: 2,
        name: 'Блузки',
        slug: 'blouses',
        parent: null,
        image: null,
        products_count: 32,
        preferred_size_grid: null,
        size_group: null,
        children: [
            {
                id: 21,
                name: 'Рубашки',
                slug: 'shirts',
                parent: 2,
                image: '/images/shirts.jpg',
                products_count: 18,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 22,
                name: 'Топы',
                slug: 'tops',
                parent: 2,
                image: '/images/tops.jpg',
                products_count: 14,
                preferred_size_grid: null,
                size_group: null,
                children: []
            }
        ]
    },
    {
        id: 3,
        name: 'Юбки',
        slug: 'skirts',
        parent: null,
        image: null,
        products_count: 28,
        preferred_size_grid: null,
        size_group: null,
        children: [
            {
                id: 31,
                name: 'Миди юбки',
                slug: 'midi-skirts',
                parent: 3,
                image: '/images/midi-skirts.jpg',
                products_count: 12,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 32,
                name: 'Мини юбки',
                slug: 'mini-skirts',
                parent: 3,
                image: '/images/mini-skirts.jpg',
                products_count: 10,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 33,
                name: 'Макси юбки',
                slug: 'maxi-skirts',
                parent: 3,
                image: '/images/maxi-skirts.jpg',
                products_count: 6,
                preferred_size_grid: null,
                size_group: null,
                children: []
            }
        ]
    },
    {
        id: 4,
        name: 'Аксессуары',
        slug: 'accessories',
        parent: null,
        image: null,
        products_count: 23,
        preferred_size_grid: null,
        size_group: null,
        children: [
            {
                id: 41,
                name: 'Сумки',
                slug: 'bags',
                parent: 4,
                image: '/images/bags.jpg',
                products_count: 15,
                preferred_size_grid: null,
                size_group: null,
                children: []
            },
            {
                id: 42,
                name: 'Украшения',
                slug: 'jewelry',
                parent: 4,
                image: '/images/jewelry.jpg',
                products_count: 8,
                preferred_size_grid: null,
                size_group: null,
                children: []
            }
        ]
    }
]; 