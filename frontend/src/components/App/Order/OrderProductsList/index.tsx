import dynamic from "next/dynamic";
import {useAppSelector} from "@/state/hooks";
import {selectCart} from "@/state/reducers/cart";
import {
    OrderItem,
    OrderItemDescription,
    OrderItemDescriptionRight,
    OrderItemsList, OrderTotalWrapper,
    Wrapper
} from "@/components/App/Order/OrderProductsList/style";
import {Caption, H2, H3, H4, P, PL} from "@/components/Shared/Typograpy";
import {CartItemState} from "@/interfaces/cart";


import Image from 'next/image'
import {selectSizes} from "@/state/reducers/sizes";
import {useEffect} from "react";
import {useRouter} from "next/navigation";


const OrderProductsListComponent = () => {
    const {push} = useRouter();
    const {items, quantity, total} = useAppSelector(selectCart);
    const {selected} = useAppSelector(selectSizes)

    useEffect(() => {quantity === 0 && push('/')}, [quantity]);

    return (
        <div className={'order-product-list'}>
            <H3 mb={3}>Order products</H3>
            <Wrapper>
                <OrderItemsList>
                    {items.map((item: CartItemState, index: number) => (
                        <OrderItem key={index}>
                            <div>
                                <Image width={50} height={70} src={item.image} alt={item.name}/>
                            </div>
                            <OrderItemDescription>
                                <div>
                                    <H4 mb={1}>{item.name}</H4>
                                    <P>Размер: {selected && item.size[selected]}</P>
                                </div>
                                <OrderItemDescriptionRight>
                                    <PL bold>{item.price * item.quantity} ₴</PL>
                                    <Caption>Price: {item.price} ₴</Caption>
                                    <Caption>Qty: {item.quantity}</Caption>
                                </OrderItemDescriptionRight>
                            </OrderItemDescription>
                        </OrderItem>
                    ))}
                </OrderItemsList>
                <OrderTotalWrapper>
                    <H3>Total: {total} ₴</H3>
                    <Caption>Qty: {quantity}</Caption>
                </OrderTotalWrapper>
            </Wrapper>
        </div>
    );
};

export const OrderProductsList = dynamic(() => Promise.resolve(OrderProductsListComponent), {
    ssr: false
})