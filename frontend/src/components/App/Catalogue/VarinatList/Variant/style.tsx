import styled from "@emotion/styled";
import {Span} from "@/components/Shared/Typograpy";


export const Wrapper = styled.div`
  position: relative;
  display: block;
`

export const SlidesWrapper = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
`;


export const ImageWrapper = styled.div<{ pointer?: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  top: 0;
  left: 0;
  padding-top: 150%;
  cursor: ${props => props.pointer ? 'pointer' : 'unset'};
`;


export const VariantTitle = styled(Span)`
  position: relative;
  display: block;
  font-size: 16px;
  margin-top: 4px;
  line-height: 1.5;
  font-weight: 400;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`

export const VariantPriceWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 8px;
  line-height: 1.25;
`

export const VariantPrice = styled(Span)`
  color: ${({theme}) => theme.color.primary};
  font-size: 16px;
  font-weight: 600;
  font-weight: 600;
  margin-right: 12px;
`

export const VariantOldPrice = styled(Span)`
  text-decoration: line-through;
  font-size: 15px;
  color: ${({theme}) => theme.color.grey};
`

export const Slide = styled.div`
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

