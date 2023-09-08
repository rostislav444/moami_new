import styled from "@emotion/styled";


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


export const ImageWrapper = styled.div<{pointer?: boolean}>`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  top: 0;
  left: 0;
  padding-top: 150%;
  cursor: ${props => props.pointer ? 'pointer' : 'unset'};
`;

export const Slide = styled.div`
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

