export interface SizeGridState {
    id: number;
    name: string;
    slug: string;
    order: number;
    is_default: boolean;
}

export interface SizesState {
    sizeGrids: SizeGridState[];
    selected: null | string;
}