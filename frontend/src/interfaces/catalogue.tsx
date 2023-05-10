export interface variantProductState {
    id: number,
    name: string,
    price: number,
    old_price: number,
}


export interface ClorState {
    id: number,
    name: string,
    code: string,
    images: [],
    sizes: []
}


export interface variantImageState {
    image: string,
    dimensions: {
        width: number,
        height: number
    }
}

export interface variantState {
    product: variantProductState,
    id: number,
    name: string,
    slug: string,
    color: ClorState
    images: variantImageState[]
}

export interface paginatedVariantsState {
    results: variantState[],
    next: string,
    previous: string,
    count: number,
}

export interface CatalogueProps {
    initialVariants: variantState[],
    count: number,
    url: string
}

export interface variantListProps {
    variants: variantState[],
    preloader: boolean
}

