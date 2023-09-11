import Layout from '@/components/Shared/Layout'
import {GetStaticProps} from "next";
import {selectCollections} from "@/state/reducers/collections";
import Error from 'next/error';
import {Catalogue} from "@/components/App/Catalogue";
import fetchWithLocale from "@/utils/fetchWrapper";
import {useStore} from "react-redux";
import {CollectionsState} from "@/interfaces/collections";
import {CatalogueCategoryProps, perPage} from "@/pages/[...params]";
import {getCategoriesAndPage} from "@/utils/categories";
import {API_BASE_URL} from "@/local";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";

export const baseUrl = API_BASE_URL

export default function Collection({paginatedVariants, statusCode, params, page}: CatalogueCategoryProps) {
    const store = useStore()
    const collections: CollectionsState[] = selectCollections(store.getState())
    const slug = params[0]
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
            key={page}
            breadcrumbs={breadcrumbs}
        >
            <Catalogue initialVariants={results} count={count} url={params.join('/')} page={page}/>
        </Layout>
    )
}


export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    if (!params) {
        return {props: {statusCode: 404}}
    }

    const paramsArray = Array.isArray(params.params) ? params.params : params.params ? [params.params] : [];
    const {page, categories} = getCategoriesAndPage(paramsArray);

    if (!categories.length || !categories[0]) {
        return {props: {statusCode: 404}};
    }

    const url = `/catalogue/?collection=${categories.join(',')}&page=${page}`;
    const apiFetch = fetchWithLocale(locale);
    const response = await apiFetch.get(url);

    if (response.ok) {
        return {
            props: {
                paginatedVariants: response.data,
                params: categories,
                page,
                // translation
                ...(await serverSideTranslations(locale || 'uk', ['common',]))
            },
            revalidate: 60 * 5
        }
    }

    return {props: {statusCode: 404}};
}


export const getStaticPaths = async () => {
    const collectionsListUrl = baseUrl + '/category/collections/'
    const response = await fetch(collectionsListUrl)
    const collections: CollectionsState[] = await response.json()

    const setCollectionsPages = (collections: CollectionsState[]): Array<string> => {
        let paths: Array<string> = [];

        collections.forEach(collection => {
            const pages = Math.ceil(collection.products_count / perPage)

            for (let i = 0; i < pages; i++) {
                let newPath;
                if (i === 0) {
                    newPath = `${collection.slug}`;
                } else {
                    newPath = `${collection.slug}/page/${i + 1}`;
                }
                paths.push(newPath);
            }
        });
        return paths;
    }

    const paths = setCollectionsPages(collections)
    return {
        paths: paths.map(path => ({params: {params: path.split('/')}})),
        fallback: 'blocking'
    }
}
