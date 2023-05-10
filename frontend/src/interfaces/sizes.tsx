export interface SizeGridState {
    id: number;
    name: string;
    slug: string;
    order: number;
    is_default: boolean;
}

export interface SizeGridProps {
    sizeGrids: SizeGridState[];
    selected: null | string;
}