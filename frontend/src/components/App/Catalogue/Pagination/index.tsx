import React                                                     from 'react';
import {useRouter}                                               from "next/router";
import Link                                                      from 'next/link'
import {PaginationButton, PaginationEllipsis, PaginationWrapper} from "@/components/App/Catalogue/Pagination/style";

type PaginationProps = {
    page: number;
    totalPages: number;
    url: string;
}

type PaginationItem = {
    type: 'page' | 'ellipsis';
    pageNum?: number;
    label?: string;
}



export const Pagination = ({page, totalPages, url}: PaginationProps) => {
    const router = useRouter();
    const locale = router.locale;

    const getPageLink = (pageNum: number) => `${url}/page/${pageNum}`;
    const groupLength = 3;

    const nearCurrentPage = (i: number): boolean => {
        const startGroup = page - Math.floor((groupLength - 1) / 2);
        const endGroup = page + Math.floor(groupLength / 2);
        return i >= startGroup && i <= endGroup;
    }

    const generatePaginationItems = (): PaginationItem[] => {
        const items: PaginationItem[] = [];

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || nearCurrentPage(i)) {
                items.push({type: 'page', pageNum: i});
            } else if (i - 1 === 1 || i === page - Math.floor((groupLength - 1) / 2) || i === page + Math.floor(groupLength / 2) + 1) {
                items.push({type: 'ellipsis'});
                continue;
            }
        }

        if (page > 1) items.unshift({type: 'page', pageNum: page - 1, label: '<'});
        if (page < totalPages) items.push({type: 'page', pageNum: page + 1, label: '>'});

        return items;
    }

    const paginationState: PaginationItem[] = generatePaginationItems()

    return (
        <PaginationWrapper>
            {paginationState.map((item, index) => {
                if (item.type === 'ellipsis') {
                    return <PaginationEllipsis key={index}>...</PaginationEllipsis>;
                }
                const isCurrent = page === item.pageNum;
                return (
                    <Link key={index} locale={locale} href={getPageLink(item.pageNum!)}>
                        <PaginationButton active={isCurrent}>
                            {item.label || item.pageNum}
                        </PaginationButton>
                    </Link>
                );
            })}
        </PaginationWrapper>
    );
}