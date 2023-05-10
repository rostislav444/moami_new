export interface CartItemState {
    id: number,
    stock: number,
    image: string,
    size: {
        [key: string]: string | number
    }
    quantity: number,
    name: string,
    slug: string,
    price: number,
    old_price: number,

}

export interface CartState {
    items: CartItemState[],
    total: number,
    quantity: number,
}

export interface CartTableProps {
    items: CartItemState[],
    total: number,
    selected: string | number | null,
    remove: (id: number) => void,
}