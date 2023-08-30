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


export default function Product({variant}: VariantPageProps) {
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
        <Layout breadcrumbs={breadcrumbs}>
            <ProductPage variant={variant}/>
        </Layout>
    )
}


export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    const apiFetch = fetchWithLocale(locale || 'uk')
    const {slug} = params as { slug: string }

    const response = await apiFetch.get(`/product/variants/${slug}/`)

    if (!response.ok) {
        return {
            notFound: true
        }
    }

    return {
        props: {
            variant: response.data
        }
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
