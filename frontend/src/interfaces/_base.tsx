import {CategoryProps} from "@/interfaces/categories";
import {CollectionsProps} from "@/interfaces/collections";

export interface InitialDataProps {
    data: {
        categories: CategoryProps[],
        collections: CollectionsProps[],
    },
    locale: string
}

export interface BaseProps {
    initialData: InitialDataProps
}