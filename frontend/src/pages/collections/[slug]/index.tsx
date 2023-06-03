import Layout from '@/components/Shared/Layout'
import {GetServerSideProps} from "next";
import {useAppSelector} from "@/state/hooks";
import {selectCollections} from "@/state/reducers/collections";
import {PaginatedVariants} from "@/interfaces/variant";
import Error from 'next/error';
import {Catalogue} from "@/components/App/Catalogue";
import fetchWithLocale from "@/utils/fetchWrapper";

interface CollectionProps {
    paginatedVariants: PaginatedVariants,
    statusCode?: number,
    slug: string,
    url: string
}


export default function Collection({paginatedVariants, statusCode, slug, url}: CollectionProps) {
    const {collections} = useAppSelector(selectCollections)
    const collection = collections.find(collection => collection.slug === slug)

    if (statusCode) {
        return <Error statusCode={statusCode}/>
    }

    const {count, results} = paginatedVariants

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        {title: 'Коллекции', link: '/collections'},
        {title: collection?.name || slug, link: `/collections/${collection?.slug}`}
    ]

    return (
        <Layout
            key={JSON.stringify(slug)}
            breadcrumbs={breadcrumbs}
        >
            <Catalogue initialVariants={results} count={count} url={url}/>
        </Layout>
    )
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const {slug} = context.query
    const locale = context.locale
    const apiFetch = fetchWithLocale(locale)
    const url = `catalogue/?collection=${slug}`

    const props = {
        paginatedVariants: null,
        statusCode: null,
        slug: slug,
        url: url
    }

    // const response = await fetch(BASE_URL + props.url, {
    //     headers: RequestHeaders(context)
    // })

    const response = await apiFetch.get(props.url)

    if (!response.ok) {
        return {
            props: {
                statusCode: 404,
            },
        }
    }

    props.paginatedVariants = response.data

    return {props}
}