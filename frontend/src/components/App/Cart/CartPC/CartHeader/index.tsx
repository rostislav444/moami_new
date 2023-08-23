import {CartHeaderDetails, CartHeaderPhoto, CartHeaderPrice, CartHeaderQty, CartHeaderTotal} from "@/components/App/Cart/CartPC/style";

export const CartHeader = () => {
    return <>
        <CartHeaderPhoto>Фото</CartHeaderPhoto>
        <CartHeaderDetails>Детали</CartHeaderDetails>
        <CartHeaderPrice>Цена</CartHeaderPrice>
        <CartHeaderQty>Кол-во</CartHeaderQty>
        <CartHeaderTotal>Всего</CartHeaderTotal>
    </>
}