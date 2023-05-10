import styled from '@emotion/styled';

export const PaginationContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
`;

export const PaginationButton = styled.button`
    border: none;
    background-color: transparent;
    color: ${({theme}) => theme.color.primary};
    font-size: 1.2rem;
    margin: 0 5px;
    cursor: pointer;
    outline: none;
    transition: all 0.3s ease-in-out;
    
    &:hover {
        color: #f1f1f1;
    }
    
    &.active {
        color: black;
    }
`;

export const Pagination = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
`;

