import Layout from "@/components/Shared/Layout";
import {OrderProductsList} from "@/components/App/Order/OrderProductsList";
import {OrderForm} from "@/components/App/Order/OrderForm";
import {Wrapper} from "@/components/App/Order/style";


export const OrderPage = () => {
    const breadcrumbs = [
        {
            title: 'Главная',
            url: '/'
        },
        {
            title: 'Оформление заказа',
            url: '/order'
        }
    ]

    return <Layout breadcrumbs={breadcrumbs}>
        <Wrapper>
            <OrderForm />
            <OrderProductsList/>
        </Wrapper>
    </Layout>

}