import {CartHeaderDetails, CartHeaderPhoto, CartHeaderPrice, CartHeaderQty, CartHeaderTotal} from "@/components/App/Cart/CartPC/style";
import {useTranslation} from "next-i18next";

export const CartHeader = () => {
    const {t} = useTranslation('common', {useSuspense: false})

    return <>
        <CartHeaderPhoto>{t('cart.photo')}</CartHeaderPhoto>
        <CartHeaderDetails>{t('cart.details')}</CartHeaderDetails>
        <CartHeaderPrice>{t('cart.price')}</CartHeaderPrice>
        <CartHeaderQty>{t('cart.quantity')}</CartHeaderQty>
        <CartHeaderTotal>{t('cart.total')}</CartHeaderTotal>
    </>
}