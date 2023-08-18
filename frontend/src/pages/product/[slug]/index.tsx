import Layout from "@/components/Shared/Layout";
import {useRouter} from "next/router";
import {ProductPage} from "@/components/App/Product";

import {GetServerSideProps} from "next";
import {VariantPageProps} from "@/interfaces/variant";
import fetchWithLocale from "@/utils/fetchWrapper";
import {useEffect} from "react";
import {pageView} from "@/lib/FacebookPixel";



export default function Product({variant}: VariantPageProps) {
    const router = useRouter()
    const {slug} = router.query
    const categoriesBreadcrumbs = variant.product.breadcrumbs

    useEffect(() => {
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

export const getServerSideProps: GetServerSideProps = async (context) => {
    const apiFetch = fetchWithLocale(context.locale || 'uk')
    const {slug} = context.params as { slug: string }

    console.log('getServerSideProps', slug)

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
