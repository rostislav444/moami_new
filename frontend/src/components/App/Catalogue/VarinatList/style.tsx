import styled from '@emotion/styled'
import {SpanBig} from "@/components/Shared/Typograpy";

export const VariantsList = styled.div<{ columns: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  grid-column-gap: 16px;
  grid-row-gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: ${({columns}) => columns ? 'repeat(auto-fill, minmax(330px, 1fr))' : 'repeat(2, 1fr)'};
    grid-column-gap: 16px;
    grid-row-gap: 28px;
  }


`

export const OldPrice = styled(SpanBig)`
    text-decoration: line-through;
    color: ${({theme}) => theme.color.grey};
`


export const PreLoader = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: ${({theme}) => theme.colors.background};
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
  transition: all 0.3s ease-in-out;
`
