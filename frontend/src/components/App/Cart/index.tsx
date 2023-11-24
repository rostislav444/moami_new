import dynamic from "next/dynamic";
import {useAppSelector} from "@/state/hooks";
import {selectCart, updateItemInCart} from "@/state/reducers/cart";
import {useEffect} from "react";
import {useStore} from "react-redux";
import {fitItemsQuantity} from "@/components/App/Cart/hooks";
import {useRouter} from "next/navigation";
import {useIsMobile} from "@/components/Shared/Header/hooks";
import {CartMobile} from "@/components/App/Cart/CartMobile";
import {CartPC} from "@/components/App/Cart/CartPC";

const CartMobileDynamic = dynamic(() => Promise.resolve(CartMobile), {ssr: false})
const CartPCDynamic = dynamic(() => Promise.resolve(CartPC), {ssr: false})


export const CartPage = () => {
    const {push} = useRouter();
    const store = useStore()
    const {items, quantity, total} = useAppSelector(selectCart)

    useEffect(() => {
        if (items.length > 0) {
            fitItemsQuantity(items, store)
        }
    }, [])

    useEffect(() => {
        quantity === 0 && push('/')
    }, [quantity]);


    const handelRemoveItem = (id: number) => {
        store.dispatch({type: 'cart/removeItemFromCart', payload: id})
    }

    const handleUpdate = (id: number, quantity: number) => {
        store.dispatch(updateItemInCart({id, quantity}))
    }

    const props = {
        items,
        quantity,
        total,
        handelRemoveItem,
        handleUpdate,
    }

    const isMobile = useIsMobile();

    return isMobile ? <CartMobileDynamic {...props} /> : <CartPCDynamic {...props} />
}