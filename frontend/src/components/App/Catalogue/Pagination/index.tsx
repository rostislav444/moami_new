import React                                 from 'react';
import {useRouter}                           from "next/router";
import Link                                  from 'next/link'
import {PaginationButton, PaginationWrapper} from "@/components/App/Catalogue/Pagination/style";


interface paginationProps {
    page: number;
    totalPages: number;
    url: string;
}

export const Pagination = ({page, totalPages, url}: paginationProps) => {
    const getPageLink = (pageNum: number) => {
        return `/${url}/page/${pageNum}`;
    };

    return (
        <PaginationWrapper>
            {page > 1 && <Link href={getPageLink(page - 1)}><PaginationButton>Prev</PaginationButton></Link>}
            {page > 3 && <Link href={getPageLink(1)}><PaginationButton>1</PaginationButton></Link>}
            {page > 4 && <PaginationButton>...</PaginationButton>}
            {page > 2 && <Link href={getPageLink(page - 2)}><PaginationButton>{page - 2}</PaginationButton></Link>}
            {page > 1 && <Link href={getPageLink(page - 1)}><PaginationButton>{page - 1}</PaginationButton></Link>}
            <PaginationButton active>{page}</PaginationButton>
            {page < totalPages &&
                <Link href={getPageLink(page + 1)}><PaginationButton>{page + 1}</PaginationButton></Link>}
            {page < totalPages - 1 &&
                <Link href={getPageLink(page + 2)}><PaginationButton>{page + 2}</PaginationButton></Link>}
            {page < totalPages - 3 && <PaginationButton>...</PaginationButton>}
            {page < totalPages - 2 &&
                <Link href={getPageLink(totalPages)}><PaginationButton>{totalPages}</PaginationButton></Link>}
            {page < totalPages - 1 &&
                <Link href={getPageLink(page + 1)}><PaginationButton>Next</PaginationButton></Link>}
        </PaginationWrapper>
    )
}