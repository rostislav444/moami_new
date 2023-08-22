import React from 'react'
import Layout from "@/components/Shared/Layout";
import {CartPage} from "@/components/App/Cart";


export default function Cart() {
    const breadcrumbs = [
        {title: 'Главная', url: '/'},
        {title: 'Корзина', url: '/cart'},
    ]

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <CartPage />
        </Layout>
    )
}