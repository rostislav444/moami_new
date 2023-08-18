export interface CategoryState {
    id: number,
    name: string,
    slug: string,
    children: CategoryState[],
    products_count: number
}

export interface CategoryProps {
    categories: CategoryState[]
}