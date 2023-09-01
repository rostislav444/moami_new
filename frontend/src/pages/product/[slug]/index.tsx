import Layout from "@/components/Shared/Layout";
import {useRouter} from "next/router";
import {ProductPage} from "@/components/App/Product";

import {GetStaticProps} from "next";
import {VariantPageProps} from "@/interfaces/variant";
import fetchWithLocale from "@/utils/fetchWrapper";
import {useEffect} from "react";
import {pageView} from "@/lib/FacebookPixel";
import {useStore} from "react-redux";
import {addViewedProductData} from "@/state/reducers/user";


export default function Product({variant, locale}: VariantPageProps) {
    const router = useRouter()
    const store = useStore()
    const {slug} = router.query
    const categoriesBreadcrumbs = variant.product.breadcrumbs

    useEffect(() => {
        store.dispatch(addViewedProductData(variant))
        pageView()
    }, []);

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        ...categoriesBreadcrumbs,
        {title: variant.name, link: `/product/${slug}/`}
    ]

    return (
        <Layout key={locale} breadcrumbs={breadcrumbs}>
            <ProductPage locale={locale} variant={variant}/>
        </Layout>
    )
}


export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    const apiFetch = fetchWithLocale(locale || 'uk')
    const {slug} = params as { slug: string }

    const response = await apiFetch.get(`/product/variants/${slug}/`)

    return response.ok ? {
        props: {
            variant: response.data,
            locale
        },
        revalidate: 60 * 60 * 24 // 1 day
    } : {
        notFound: true
    }
}


export const getStaticPaths = async () => {
    const api = fetchWithLocale()
    const response = await api.get('/product/variants/slug-list/')

    const paths = response.data.map((slug: string) => ({
        params: {slug}
    }))

    return {
        paths,
        fallback: 'blocking'
    }
}
