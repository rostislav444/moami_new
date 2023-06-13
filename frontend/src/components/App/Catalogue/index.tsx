import {ProductsList} from "@/components/App/Catalogue/VarinatList";
import {CatalogueProps} from "@/interfaces/catalogue";

import {useEffect, useState} from "react";
import {Pagination} from "@/components/App/Catalogue/Pagination";
import {Button} from "@/components/Shared/Buttons";
import {useRouter} from "next/router";
import fetchWithLocale from "@/utils/fetchWrapper";


export const Catalogue = ({initialVariants, count, url}: CatalogueProps) => {
    const perPage = 24;
    const apiFetch = fetchWithLocale();
    const [variants, setVariants] = useState(initialVariants);
    const [page, setPage] = useState<number | null>(null);
    const [showMore, setShowMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const totalPages = Math.ceil(count / perPage);
    const realPage = page === null ? 1 : page;

    const router = useRouter(); // Get the router instance

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
        setShowMore(false);
        setPage(newPage);
        router.push({ // Modify the URL's query string
            pathname: router.pathname,
            query: { ...router.query, page: newPage },
        }, undefined, { scroll: false });
    };

    const handleShowMore = () => {
        setShowMore(true);
        const nextPage = page === null ? 2 : page + 1;
        setPage(nextPage);
        router.push({ // Modify the URL's query string
            pathname: router.pathname,
            query: { ...router.query, page: nextPage },
        }, undefined, { scroll: false });
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
