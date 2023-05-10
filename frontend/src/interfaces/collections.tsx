export interface CollectionsState {
    id: number;
    name: string;
    slug: string;
    image: string;
}

export interface CollectionsProps {
    collections: CollectionsState[];
}