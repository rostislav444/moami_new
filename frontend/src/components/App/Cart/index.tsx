import dynamic from "next/dynamic";
import {H1} from "@/components/Shared/Typograpy";
import {useAppSelector} from "@/state/hooks";
import {removeItemFromCart, selectCart, updateItemInCart} from "@/state/reducers/cart";
import {useEffect} from "react";
import {CartTablePC} from "@/components/App/Cart/CartTable";
import {Button} from "@/components/Shared/Buttons";
import {ActionsWrapper, Wrapper} from "@/components/App/Cart/style";
import Link from "next/link";
import {useApi} from "@/context/api";
import store from "@/state/store";

const CartTableDynamic = dynamic(() => Promise.resolve(CartTablePC), {ssr: false})


export const CartPage = () => {
    const {apiFetch} = useApi()
    const {items} = useAppSelector(selectCart)

    useEffect(() => {
        apiFetch.post('order/check-sizes-availability/', items.map(item => ({id: item.id, quantity: item.quantity})))
            .then(data => {
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
            })
    }, [])


    return (
        <Wrapper>
            <H1 center>Cart</H1>
            <CartTableDynamic/>
            <ActionsWrapper>
                <Link href='/'>
                    <Button light>Продолжить покупки</Button>
                </Link>
                <Link href='/order'>
                    <Button>Оформить заказ</Button>
                </Link>
            </ActionsWrapper>
        </Wrapper>
    )
}