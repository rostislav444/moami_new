import {CartProductsProps}                         from "@/interfaces/cart";
import {CartActions, CartActionsButtons, CartGrid} from "./style";
import {CartHeader}                                from "@/components/App/Cart/CartPC/CartHeader";
import {CartItem}                                  from "@/components/App/Cart/CartPC/CartItem";
import Link                                        from "next/link";
import {ShoppingCartButton}                        from "@/components/App/Cart/style";
import {PL}                                        from "@/components/Shared/Typograpy";

export const CartPC = ({items, quantity, total, handelRemoveItem, handleUpdate,}: CartProductsProps) => {
    return <>
        <CartGrid>
            <CartHeader/>
            {items.map(item =>
                <CartItem key={item.id} item={item} handelRemoveItem={handelRemoveItem} handleUpdate={handleUpdate}/>
            )}
        </CartGrid>
        <CartActions>
             <PL bold>Всего: {total} ₴</PL>
            <CartActionsButtons>
                <Link href='/'>
                    <ShoppingCartButton light>Продолжить покупки</ShoppingCartButton>
                </Link>
                <Link href='/order'>
                    <ShoppingCartButton>Оформить заказ</ShoppingCartButton>
                </Link>
            </CartActionsButtons>

        </CartActions>
    </>

}