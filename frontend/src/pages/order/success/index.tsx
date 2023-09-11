import Layout      from "@/components/Shared/Layout";
import {H1, P}     from "@/components/Shared/Typograpy";
import {useEffect} from "react";
import {clearCart} from "@/state/reducers/cart";
import {useStore}  from "react-redux";
import {GetStaticProps} from "next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";


export default function OrderSuccessPage() {
    const store = useStore()

    const breadcrumbs = [
        {title: 'Главная', url: '/'},
        {title: 'Оформление заказа', url: '/order'},
        {title: 'Заказ оформлен', url: '/order/success'}
    ]

    useEffect(() => {
        localStorage.removeItem('cart')
        store.dispatch(clearCart())
    }, [])

    return <Layout breadcrumbs={breadcrumbs}>
        <H1>Заказ оформлен</H1>
        <P mt={2}>В скором времени мы позвоним Вам для подтверждения заказа</P>
    </Layout>
}

export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'uk', ['common',])),
        },
    }
}
