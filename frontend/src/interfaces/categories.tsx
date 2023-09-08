export interface CategoryState {
    id: number,
    name: string,
    slug: string,
    children: CategoryState[],
    products_count: number,
    preferred_size_grid: string,
    selected_size_grid?: string,
    size_group: {
        id: number,
        grids: {
            name: string,
            slug: string
        }[]
    }
}

export interface CategoryProps {
    categories: CategoryState[]
}