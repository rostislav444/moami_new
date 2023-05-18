import styled from '@emotion/styled';


export const BreadcrumbsWrapper = styled.ul`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 0;
  list-style: none;
  overflow-x: auto;
  // no scrollbar
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
    &::-webkit-scrollbar { /* WebKit */
        width: 0;
        height: 0;
    }
    &::-moz-scrollbar { /* Firefox */
        width: 0;
        height: 0;
    }
    &::-ms-scrollbar { /* IE 10+ */
        width: 0;
        height: 0;
    }

  > li {
    white-space: nowrap;
    
  }
`


export const BreadcrumbsSeparator = styled.span`
    margin: 0 10px;
    font-size: 14px;
    color: ${({theme}) => theme.color.grey};
`