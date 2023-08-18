export interface CollectionsState {
    id: number;
    name: string;
    slug: string;
    image: string;
    products_count: number;
}

export interface CollectionsProps {
    collections: CollectionsState[];
}