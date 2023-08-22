import {CartItemState}                        from "@/interfaces/cart";
import fetchWithLocale                        from "@/utils/fetchWrapper";
import {removeItemFromCart, updateItemInCart} from "@/state/reducers/cart";

export const fitItemsQuantity = (items: CartItemState[], store: any) => {
    const api = fetchWithLocale()
    api.post('/order/check-sizes-availability/', items.map(item => ({id: item.id, quantity: item.quantity})))
        .then(({data, ok}) => {
                if (!ok) {
                    for (const item of data) {
                        const cartItem = items.find(cartItem => cartItem.id === item.id)
                        if (cartItem) {
                            if (item.quantity < cartItem.quantity) {
                                store.dispatch(updateItemInCart({id: item.id, quantity: item.quantity}))
                            } else if (item.quantity === 0) {
                                store.dispatch(removeItemFromCart(item.id))
                            }
                        } else {
                            store.dispatch(removeItemFromCart(item.id))
                        }
                    }
                } else {
                    console.log('Could not check sizes availability')
                }
            }
        )
}