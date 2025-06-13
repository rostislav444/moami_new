export interface CategoryState {
    id: number;
    name: string;
    slug: string;
    parent?: number | null;
    image?: string | null;
    children: CategoryState[];
    products_count: number;
    preferred_size_grid?: string | null;
    size_group?: {
        grids: {
            id: number;
            name: string;
            slug: string;
            order: number;
            is_default: boolean;
        }[];
    } | null;
}

export interface CollectionState {
    id: number;
    name: string;
    slug: string;
    image?: string | null;
    products_count: number;
}

export interface CategoryStore {
    categories: CategoryState[];
    setCategories: (categories: CategoryState[]) => void;
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
} 