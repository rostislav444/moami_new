import {TotalWrapper, Wrapper} from "@/components/App/Cart/CartMobile/CarSummery/style";

import {ShoppingCartButton} from "@/components/App/Cart/style";
import Link        from "next/link";
import {H4, P, PL} from "@/components/Shared/Typograpy";


interface CartSummeryProps {
    total: number
    quantity: number
}


export const CartSummery = ({total, quantity}: CartSummeryProps) => {
    return <Wrapper>
        <TotalWrapper>
            <PL bold>Всего: {total} ₴</PL>
        </TotalWrapper>
        <Link href='/'>
            <ShoppingCartButton light>Продолжить покупки</ShoppingCartButton>
        </Link>
        <Link href='/order'>
            <ShoppingCartButton>Оформить заказ</ShoppingCartButton>
        </Link>
    </Wrapper>
}