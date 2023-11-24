import React from 'react'
import Layout from "@/components/Shared/Layout";
import {CartPage} from "@/components/App/Cart";
import {GetStaticProps} from "next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {useTranslation} from "next-i18next";


export default function Cart() {
    const {t} = useTranslation('common', {useSuspense: false})

    const breadcrumbs = [
        {title: t('pages.main'), url: '/'},
        {title: t('pages.cart'), url: '/cart'},
    ]

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <CartPage/>
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
