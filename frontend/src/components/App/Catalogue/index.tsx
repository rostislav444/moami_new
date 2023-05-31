import {ProductsList} from "@/components/App/Catalogue/VarinatList";
import {CatalogueProps} from "@/interfaces/catalogue";

import {useEffect, useState} from "react";
import {Pagination} from "@/components/App/Catalogue/Pagination";
import {Button} from "@/components/Shared/Buttons";
import {useRouter} from "next/router";
import fetchWithLocale from "@/utils/fetchWrapper";


export const Catalogue = ({initialVariants, count, url}: CatalogueProps) => {
    const perPage = 12
    const apiFetch = fetchWithLocale()
    const [variants, setVariants] = useState(initialVariants)
    const [page, setPage] = useState<number | null>(null)
    const [showMore, setShowMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const totalPages = Math.ceil(count / perPage)
    const realPage = page === null ? 1 : page


    useEffect(() => {
        if (page !== null) {
            setLoading(true)
            if (showMore) {
                const pageUrl = page === 1 ? url : `${url}&page=${page}`
                apiFetch.get(pageUrl).then(data => {
                    setVariants([...variants, ...data.data.results])
                    setLoading(false)
                })
            } else {
                const pageUrl = page === 1 ? url : `${url}&page=${page}`
                apiFetch.get(pageUrl).then(data => {
                    setVariants(data.data.results)
                    setLoading(false)
                })
            }
        }

        return () => {
            setLoading(false)
        }

    }, [url, page])

    const handlePageChange = (newPage: number) => {
        setShowMore(false)
        setPage(newPage)
    }

    const handleShowMore = () => {
        setShowMore(true)
        if (page === null) {
            setPage(2)
        } else {
            setPage(page + 1)
        }

    }


    return (
        <div>
            <ProductsList variants={variants} preloader={!showMore && loading}/>
            {totalPages > 1 && <Pagination page={realPage} setPage={handlePageChange} totalPages={totalPages}/>}
            {realPage < totalPages && <Button mt={4} center
                                              onClick={() => handleShowMore()}>{showMore && loading ? 'Загружаем' : 'Показать еще'}</Button>}
        </div>
    )
}