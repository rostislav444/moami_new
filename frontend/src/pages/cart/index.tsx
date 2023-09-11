import React from 'react'
import Layout from "@/components/Shared/Layout";
import {CartPage} from "@/components/App/Cart";
import {GetStaticProps} from "next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";


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

export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'uk', ['common',])),
        },
    }
}
