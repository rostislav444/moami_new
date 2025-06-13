import {GetStaticProps} from "next";
import fetchWithLocale from "@/utils/fetchWrapper";
import Layout from '@/components/Shared/Layout'
import {H1} from "@/components/Shared/Typograpy";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";


interface PageProps {
    statusCode?: number,
    locale: string,
    data: {
        id: number,
        name: string,
        slug: string,
        description: string
    }
}


export default function Page({statusCode, locale, data}: PageProps) {
    const {name, slug, description} = data
    const ReactSafeHtml = require('react-safe-html')

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        {title: 'Информация', link: '/info/'},
        {title: name, link: '/info/' + slug},
    ]

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <H1>{name}</H1>
            <ReactSafeHtml html={description}/>
        </Layout>
    )
}


export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    const {slug} = params as { slug: string };
    const api = fetchWithLocale(locale);
    const response = await api.get(`/pages/pages/${slug}/`);

    if (response.ok) {
        return {
            props: {
                data: response.data,
                // translation
                ...(await serverSideTranslations(locale || 'uk', ['common',]))
            },
            revalidate: 60 * 60 * 24
        }
    }

    return {props: {statusCode: 404}};
}


export const getStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking'
    };
};

