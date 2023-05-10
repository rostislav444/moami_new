export interface CategoryState {
    id: number,
    name: string,
    slug: string,
    children: CategoryState[]
}

export interface CategoryProps {
    categories: CategoryState[]
}