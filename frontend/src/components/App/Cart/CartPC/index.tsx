import {CartProductsProps}                         from "@/interfaces/cart";
import {CartActions, CartActionsButtons, CartGrid} from "./style";
import {CartHeader}                                from "@/components/App/Cart/CartPC/CartHeader";
import {CartItem}                                  from "@/components/App/Cart/CartPC/CartItem";
import Link                                        from "next/link";
import {ShoppingCartButton}                        from "@/components/App/Cart/style";
import {PL}                                        from "@/components/Shared/Typograpy";
import {useTranslation} from "next-i18next";

export const CartPC = ({items, quantity, total, handelRemoveItem, handleUpdate,}: CartProductsProps) => {
    const { t } = useTranslation('common', { useSuspense: false })

    return <>
        <CartGrid>
            <CartHeader/>
            {items.map(item =>
                <CartItem key={item.id} item={item} handelRemoveItem={handelRemoveItem} handleUpdate={handleUpdate}/>
            )}
        </CartGrid>
        <CartActions>
             <PL bold>{t('cart.amount')}: {total} ₴</PL>
            <CartActionsButtons>
                <Link href='/'>
                    <ShoppingCartButton light>{t('cart.continueShopping')}</ShoppingCartButton>
                </Link>
                <Link href='/order'>
                    <ShoppingCartButton>{t('cart.checkout')}</ShoppingCartButton>
                </Link>
            </CartActionsButtons>
        </CartActions>
    </>

}