import {GetStaticProps} from "next";
import fetchWithLocale from "@/utils/fetchWrapper";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {ProductLandingPageComponent} from "@/components/App/ProductLanding";
import {VariantPageProps} from "@/interfaces/variant";


export default function ProductLandingPage({variant, locale}: VariantPageProps) {
    return <ProductLandingPageComponent {...{variant, locale}} />
}


// export const getStaticProps: GetStaticProps = async ({params, locale}) => {
//     const apiFetch = fetchWithLocale(locale || 'uk')
//     const {slug} = params as { slug: string }
//
//     const response = await apiFetch.get(`/product/variants/${slug}/`)
//
//     return response.ok ? {
//         props: {
//             variant: response.data,
//             locale,
//             // translation
//             ...(await serverSideTranslations(locale || 'uk', ['common',]))
//         },
//         revalidate: 60 * 60 * 24 // 24 hours
//     } : {
//         notFound: true
//     }
// }


export const getServerSideProps = (async (context: any) => {
    const apiFetch = fetchWithLocale(context.locale || 'uk')
    const {slug} = context.params as { slug: string }

    const response = await apiFetch.get(`/product/variants/${slug}/`)

    return response.ok ? {
        props: {
            variant: response.data,
            locale: context.locale,
            // translation
            ...(await serverSideTranslations(context.locale || 'uk', ['common',]))
        },
    } : {
        notFound: true
    }
}) as GetStaticProps