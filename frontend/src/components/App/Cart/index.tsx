import dynamic                   from "next/dynamic";
import {H1}                      from "@/components/Shared/Typograpy";
import {useAppSelector}          from "@/state/hooks";
import {selectCart}              from "@/state/reducers/cart";
import {useEffect}               from "react";
import {CartTablePC}             from "@/components/App/Cart/CartTable";
import {Button}                  from "@/components/Shared/Buttons";
import {ActionsWrapper, Wrapper} from "@/components/App/Cart/style";
import Link                      from "next/link";
import {useStore}                from "react-redux";
import {fitItemsQuantity}        from "@/components/App/Cart/hooks";

const CartTableDynamic = dynamic(() => Promise.resolve(CartTablePC), {ssr: false})


export const CartPage = () => {
    const store = useStore()
    const {items} = useAppSelector(selectCart)

    useEffect(() => {
        if (items.length > 0) {
            fitItemsQuantity(items, store)
        }
    }, [])

    return (
        <Wrapper>
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