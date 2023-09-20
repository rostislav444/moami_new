import {variantState} from "@/interfaces/catalogue";

interface Color {
    id: number;
    name: string;
    code: string;
}


export interface VariantSize {
    id: number;
    size: { [key: string]: number | string };
    stock: number;
}

interface VariantImageThumbnail {
    image: string;
}

export interface VariantImage {
    image: string;
    dimensions: { width: number; height: number };
    thumbnails: VariantImageThumbnail[];
}

export interface VariantWithImage extends VariantState {
    image: string;
}


interface ProductProperty {
    key: string;
    value: string;
}


interface SizeGrid {
    slug: string;
    name: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    old_price: number;
    description: string;
    variants: VariantWithImage[];
    properties: ProductProperty[];
    breadcrumbs: { title: string; link: string }[];
    size_grids: SizeGrid[]
    product_preferred_size_grid: string
    category: {
        id: number;
        parent: number;
    }
    compositions: {
        composition: string;
        value: string;
    }[]
}

export interface VariantState {
    id: number;
    code: string;
    name: string;
    slug: string;
    product: Product;
    images: VariantImage[];
    sizes: VariantSize[];
    color: string;
    product_video?: string;
    video?: string;
}

export interface VariantPageProps {
    variant: VariantState;
    locale?: string;
}

export interface PaginatedVariants {
    count: number
    results: variantState[],
}
