import Layout from '@/components/Shared/Layout'
import {GetStaticProps} from 'next'
import {Catalogue} from "@/components/App/Catalogue";
import Error from 'next/error';
import {PaginatedVariants} from "@/interfaces/variant";
import fetchWithLocale from "@/utils/fetchWrapper";
import {BaseProps} from "@/interfaces/_base";
import {useStore} from "react-redux";
import {selectCategories} from "@/state/reducers/categories";
import {categoriesBySlugList, getCategoriesAndPage} from "@/utils/categories";
import {CategoryState} from "@/interfaces/categories";
import {API_BASE_URL} from "@/local";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {useTranslation} from "next-i18next";

const baseUrl = API_BASE_URL

export interface CatalogueCategoryProps extends BaseProps {
    paginatedVariants: PaginatedVariants,
    statusCode?: number,
    params: string[],
    locale: string,
    context: any,
    page: number,
}

export const perPage = 24;


export default function CatalogueCategory({
                                              paginatedVariants,
                                              statusCode,
                                              locale,
                                              params,
                                              page
                                          }: CatalogueCategoryProps) {
    const {t} = useTranslation('common', {useSuspense: false})
    const store = useStore();
    const categories = selectCategories(store.getState())

    if (params == undefined) {
        return <Error statusCode={404}/>
    }

    const path = params.join('/') + (page > 1 ? `/page/${page}` : '')
    const key = locale + '/' + path

    const {count, results} = paginatedVariants
    const breadcrumbsCategories = categoriesBySlugList(categories, params, [])

    return (
        <Layout key={key} breadcrumbs={[{title: t('pages.main'), link: '/'}, ...breadcrumbsCategories]}>
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

    const url = `/catalogue/?category=${categories.join(',')}&page=${page}`;
    const apiFetch = fetchWithLocale(locale);
    const response = await apiFetch.get(url);

    if (response.ok) {
        return {
            props: {
                paginatedVariants: response.data,
                params: categories,
                locale,
                page,
                // Translate
                ...(await serverSideTranslations(locale || 'uk', ['common',])),
            },
            revalidate: 60 * 5
        }
    }

    return {props: {statusCode: 404}};
}


export const getStaticPaths = async () => {
    const categoriesListUrl = baseUrl + '/category/categories/'
    const response = await fetch(categoriesListUrl)
    const categories: CategoryState[] = await response.json()

    const generateCategoriesPaths = (categories: CategoryState[], parentPath: string = ''): Array<string> => {
        let paths: Array<string> = [];
        categories.forEach(category => {
            const pages = Math.ceil(category.products_count / perPage)

            let newPath;
            for (let i = 0; i < pages; i++) {
                if (i === 0) {
                    newPath = category.slug;
                } else {
                    newPath = `${category.slug}/page/${i + 1}`;
                }
                paths.push(newPath);
            }
        });
        return paths;
    }

    const paths = generateCategoriesPaths(categories)

    return {
        paths: paths.map(path => ({params: {params: path.split('/')}})),
        fallback: true
    }
}


