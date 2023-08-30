import dynamic                                                                                                  from "next/dynamic";
import {useAppSelector}                                                                                         from "@/state/hooks";
import {selectCart}                                                                                             from "@/state/reducers/cart";
import {OrderItem, OrderItemDescription, OrderItemDescriptionRight, OrderItemsList, OrderTotalWrapper, Wrapper} from "@/components/App/Order/OrderProductsList/style";
import {Caption, H3, H4, P, PL}                                                                                 from "@/components/Shared/Typograpy";
import {CartItemState}                                                                                          from "@/interfaces/cart";


import Image                from 'next/image'
import {selectSelectedGrid} from "@/state/reducers/sizes";
import {useEffect}          from "react";
import {useRouter}          from "next/navigation";
import {MobileItemData} from "@/components/App/Cart/CartMobile/CartItem/ItemIData";


const OrderProductsListComponent = () => {
    const {push} = useRouter();
    const {items, quantity, total} = useAppSelector(selectCart);
    const selected = useAppSelector(selectSelectedGrid)

    useEffect(() => {quantity === 0 && push('/')}, [quantity]);

    return (
        <div className={'order-product-list'}>
            <H3 mb={3}>Товары в заказе</H3>
            <Wrapper>
                <OrderItemsList>
                    {items.map((item: CartItemState, index: number) => (
                        <MobileItemData key={index} item={item}/>
                    ))}
                </OrderItemsList>
                <OrderTotalWrapper>
                    <H3>Всего: {total} ₴</H3>
                    <Caption>Общее кол-во: {quantity}</Caption>
                </OrderTotalWrapper>
            </Wrapper>
        </div>
    );
};

export const OrderProductsList = dynamic(() => Promise.resolve(OrderProductsListComponent), {
    ssr: false
})