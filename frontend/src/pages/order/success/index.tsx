import Layout from "@/components/Shared/Layout";
import {Wrapper} from "@/components/App/Order/style";
import {H1, P} from "@/components/Shared/Typograpy";
import {useEffect} from "react";
import store from "@/state/store";
import {clearCart} from "@/state/reducers/cart";


export default function OrderSuccessPage() {
    const breadcrumbs = [
        {
            title: 'Главная',
            url: '/'
        },
        {
            title: 'Оформление заказа',
            url: '/order'
        },
        {
            title: 'Заказ оформлен',
            url: '/order/success'
        }
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
