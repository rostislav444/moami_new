import Layout from "@/components/Shared/Layout";
import {useRouter} from "next/router";
import {ProductPage} from "@/components/App/Product";

import {GetStaticProps} from "next";
import {VariantPageProps} from "@/interfaces/variant";
import fetchWithLocale from "@/utils/fetchWrapper";
import {useEffect} from "react";
import {pageView, event} from "@/lib/FacebookPixel";
import {useStore} from "react-redux";
import {addViewedProductData} from "@/state/reducers/user";
import {useSession} from "next-auth/react";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {useTranslation} from "next-i18next";
import Error from "next/error";


export default function Product({variant, locale}: VariantPageProps) {
    const {t} = useTranslation('common', {useSuspense: false})
    const {data: session} = useSession();
    const router = useRouter()
    const store = useStore()
    const api = fetchWithLocale()

    useEffect(() => {
        let isMounted = true

        if (session === undefined || (session && session.user && session.user.name === 'admin')) {
            return
        }

        if (isMounted) {
            pageView()
            
            // Facebook Pixel ViewContent event
            event('ViewContent', {
                content_name: variant.name,
                content_ids: [variant.code],
                content_type: 'product',
                value: variant.product.price,
                currency: 'UAH'
            });
            
            store.dispatch(addViewedProductData(variant))

            let url = '/product/variants/views?variant_id=' + variant.id
            if ('utm_source' in router.query) {
                url += `&utm_source=${router.query.utm_source}`
            }
            if ('utm_medium' in router.query) {
                url += `&utm_medium=${router.query.utm_medium}`
            }

            api.get(url)
        }
        return () => {
            isMounted = false
        }
    }, [session, store, api, variant]);

    if (variant === undefined) {
        return <Error statusCode={404}/>
    }

    const {slug} = router.query
    const categoriesBreadcrumbs = variant.product.breadcrumbs

    const breadcrumbs = [
        {title: t('pages.main'), link: '/'},
        ...categoriesBreadcrumbs,
        {title: variant.name, link: `/p-${slug}/`}
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
            locale,
            // translation
            ...(await serverSideTranslations(locale || 'uk', ['common',]))
        },
        revalidate: 5 * 60
    } : {
        notFound: true
    }
}


export const getStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking'
    }
}
