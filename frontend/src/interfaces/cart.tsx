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
    selectedGrid: string,
}

export interface CartItemProps {
    item: CartItemState,
    handelRemoveItem: (id: number) => void,
    handleUpdate: (id: number, quantity: number) => void,
}

export interface CartState {
    items: CartItemState[],
    total: number,
    quantity: number,
}

export interface CartProductsProps {
    items: CartItemState[],
    quantity: number,
    total: number,
    handelRemoveItem: (id: number) => void,
    handleUpdate: (id: number, quantity: number) => void,
}