import Layout from '@/components/Shared/Layout'
import {GetServerSideProps} from 'next'
import {useAppSelector} from "@/state/hooks";
import {selectCategories} from "@/state/reducers/categories";
import {Catalogue} from "@/components/App/Catalogue";
import Error from 'next/error';
import {categoriesBySlugList} from "@/utils/categories";
import {PaginatedVariants} from "@/interfaces/variant";
import fetchWithLocale from "@/utils/fetchWrapper";


interface CatalogueCategoryProps {
    paginatedVariants: PaginatedVariants,
    statusCode?: number,
    params: string[],
    url: string
}


export default function CatalogueCategory({paginatedVariants, statusCode, params, url}: CatalogueCategoryProps) {
    const {categories} = useAppSelector(selectCategories)

    if (statusCode) {
        return <Error statusCode={statusCode}/>
    }

    const {count, results} = paginatedVariants
    const breadcrumbsCategories = categoriesBySlugList(categories, params, [])

    return (
        <Layout
            key={JSON.stringify(params)}
            breadcrumbs={[{title: 'Главная', link: '/'}, ...breadcrumbsCategories]
            }>
            <Catalogue initialVariants={results} count={count} url={url}/>
        </Layout>
    )
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    const {params} = context.query
    const locale = context.req.headers['accept-language'] || 'uk'
    const apiFetch = fetchWithLocale(locale)
    const paramArray = Array.isArray(params) ? params : []
    const url = `/catalogue/?category=${paramArray.join(',')}`

    const props = {
        paginatedVariants: null,
        statusCode: null,
        params: paramArray,
        url: url
    }

    const response = await apiFetch.get(url)

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