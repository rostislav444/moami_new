import styled from '@emotion/styled';
import {Div} from "@/components/Shared/Abstract";


export const FlexSpaceBetween = styled(Div)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const Block = styled.div`
    position: relative;
    display: block;
    width: 100%;
    height: auto;
`

export const Flex = styled.div`
    display: flex;
    width: auto;
    height: auto;
`

export const Grid = styled.div<{gap?: number}>`
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: ${props => props.gap ? props.gap : 0}px;
  width: 100%;
  height: auto;
`