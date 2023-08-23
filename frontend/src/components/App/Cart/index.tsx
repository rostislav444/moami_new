import dynamic                                       from "next/dynamic";
import {useAppSelector}                              from "@/state/hooks";
import {selectCart, updateItemInCart}                from "@/state/reducers/cart";
import {useEffect}                                   from "react";
import {ActionsWrapper, ShoppingCartButton, Wrapper} from "@/components/App/Cart/style";
import Link                                          from "next/link";
import {useStore}                                    from "react-redux";
import {fitItemsQuantity}                            from "@/components/App/Cart/hooks";
import {useRouter}                                   from "next/navigation";
import {useIsMobile}                                 from "@/components/Shared/Header/hooks";
import {CartMobile}                                  from "@/components/App/Cart/CartMobile";
import {CartPC}                                      from "@/components/App/Cart/CartPC";

const CartMobileDynamic = dynamic(() => Promise.resolve(CartMobile), {ssr: false})
const CartPCDynamic = dynamic(() => Promise.resolve(CartPC), {ssr: false})


export const CartPage = () => {
    const {push} = useRouter();
    const store = useStore()

    useEffect(() => {
        if (items.length > 0) {
            fitItemsQuantity(items, store)
        }
    }, [])


    const {items, quantity, total} = useAppSelector(selectCart)
    // const {selected} = useAppSelector(state => state.sizes)

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


    // return (
    //     <Wrapper>
    //         {/* Cart products */}
    //         <CartProductsDynamic/>
    //         {/* Actions */}
    //         <ActionsWrapper>
    //             <Link href='/'>
    //                 <ShoppingCartButton light>Продолжить покупки</ShoppingCartButton>
    //             </Link>
    //             <Link href='/order'>
    //                 <ShoppingCartButton>Оформить заказ</ShoppingCartButton>
    //             </Link>
    //         </ActionsWrapper>
    //     </Wrapper>
    // )
}