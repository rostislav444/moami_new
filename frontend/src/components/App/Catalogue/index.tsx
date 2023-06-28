import {ProductsList} from "@/components/App/Catalogue/VarinatList";
import {CatalogueProps} from "@/interfaces/catalogue";

import {useEffect, useState} from "react";
import {Pagination} from "@/components/App/Catalogue/Pagination";
import {Button} from "@/components/Shared/Buttons";
import {useRouter} from "next/router";
import fetchWithLocale from "@/utils/fetchWrapper";
import {ParsedUrlQuery} from 'querystring';


const perPage = 24;

function getPageFromQuery(query: ParsedUrlQuery): number {
    const pageString = query.page as string;
    const pageNumber = parseInt(pageString);
    return Number.isNaN(pageNumber) ? 1 : pageNumber;
}


export const Catalogue = ({initialVariants, count, url}: CatalogueProps) => {
    const router = useRouter();
    const apiFetch = fetchWithLocale();
    const [variants, setVariants] = useState(initialVariants);
    const [page, setPage] = useState<number>(getPageFromQuery(router.query));
    const [showMore, setShowMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const totalPages = Math.ceil(count / perPage);
    const realPage = page === null ? 1 : page;


    useEffect(() => {
        if (page !== null) {
            setLoading(true);
            const pageUrl = page === 1 ? url : `${url}&page=${page}`;
            apiFetch.get(pageUrl).then(data => {
                setVariants(showMore ? [...variants, ...data.data.results] : data.data.results);
                setLoading(false);
            });
        }
        return () => {
            setLoading(false);
        };
    }, [url, page]);

    const handlePageChange = (newPage: number) => {
        let params = {...router.query};
        if (newPage > 1) {
            params.page = newPage.toString();
        } else {
            delete params.page;
        }

        router.push(
            {pathname: router.pathname, query: params},
            undefined,
            {scroll: false}
        );

        setShowMore(false);
        setPage(newPage);
    };


    const handleShowMore = () => {
        setShowMore(true);
        const nextPage = page === null ? 2 : page + 1;
        setPage(nextPage);
        router.push({ // Modify the URL's query string
            pathname: router.pathname,
            query: {...router.query, page: nextPage},
        }, undefined, {scroll: false});
    };

    return (
        <div>
            <ProductsList variants={variants} preloader={!showMore && loading}/>
            {totalPages > 1 && <Pagination page={realPage} setPage={handlePageChange} totalPages={totalPages}/>}
            {realPage < totalPages &&
                <Button mt={4} center onClick={() => handleShowMore()}>
                    {showMore && loading ? 'Загружаем' : 'Показать еще'}
                </Button>}
        </div>
    );
};
