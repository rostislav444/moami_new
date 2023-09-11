import Layout from '@/components/Shared/Layout'
import {H1} from "@/components/Shared/Typograpy";
import {useSelector} from "react-redux";
import {RootState} from "@/state/store";
import {useRouter} from "next/router";
import Link from "next/link";
import React from "react";
import {GetStaticProps} from "next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";


export default function Info() {
    const pages = useSelector((state: RootState) => state.pages.pages)
    const router = useRouter()
    const {locale} = router

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        {title: 'Информация', link: '/info/'},
    ]
    return (
        <Layout breadcrumbs={breadcrumbs}>
            <H1>Информация для клиента</H1>

            <ul>
                {pages.map((page, index) => <li key={index}>
                    <Link locale={locale} href={'/info/' + page.slug}>{page.name}</Link>
                </li>)}
            </ul>
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
