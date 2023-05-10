import styled from '@emotion/styled';


export const BreadcrumbsWrapper = styled.ul`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 20px 0;
    list-style: none;
`


export const BreadcrumbsSeparator = styled.span`
    margin: 0 10px;
    font-size: 14px;
    color: ${({theme}) => theme.color.grey};
`