import Layout from "@/components/Shared/Layout";
import {useRouter} from "next/router";
import {ProductPage} from "@/components/App/Product";

import {GetServerSideProps} from "next";

import {BASE_URL} from "@/context/api";
import {VariantPageProps} from "@/interfaces/variant";


export default function Product({variant}: VariantPageProps) {
    const router = useRouter()
    const {slug} = router.query
    const categoriesBreadcrumbs = variant.product.breadcrumbs

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
    const { slug } = context.params as { slug: string }

    const res = await fetch(`${BASE_URL}product/variants/${slug}/`)
    const variant = await res.json()

    return {
        props: {
            variant
        }
    }
}
