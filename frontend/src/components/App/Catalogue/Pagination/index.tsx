import React from 'react';
import * as s from './style';

interface paginationProps {
    page: number;
    setPage: (page: number) => void;
    totalPages: number;

}


export const Pagination = ({page, setPage, totalPages}: paginationProps) => {
    const handlePageChange = (page: number) => {
        setPage(page);
    }

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    }

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    }

    return (
        <s.Pagination>
            <s.PaginationButton onClick={handlePrevPage}>Prev</s.PaginationButton>
            {page > 3 && <s.PaginationButton onClick={() => handlePageChange(1)}>1</s.PaginationButton>}
            {page > 4 && <s.PaginationButton>...</s.PaginationButton>}
            {page > 2 && <s.PaginationButton onClick={() => handlePageChange(page - 2)}>{page - 2}</s.PaginationButton>}
            {page > 1 && <s.PaginationButton onClick={() => handlePageChange(page - 1)}>{page - 1}</s.PaginationButton>}
            <s.PaginationButton className="active">{page}</s.PaginationButton>
            {page < totalPages &&
                <s.PaginationButton onClick={() => handlePageChange(page + 1)}>{page + 1}</s.PaginationButton>}
            {page < totalPages - 1 &&
                <s.PaginationButton onClick={() => handlePageChange(page + 2)}>{page + 2}</s.PaginationButton>}
            {page < totalPages - 3 && <s.PaginationButton>...</s.PaginationButton>}
            {page < totalPages - 2 &&  <s.PaginationButton onClick={() => handlePageChange(totalPages)}>{totalPages}</s.PaginationButton>}
            <s.PaginationButton onClick={handleNextPage}>Next</s.PaginationButton>
        </s.Pagination>
    )
}