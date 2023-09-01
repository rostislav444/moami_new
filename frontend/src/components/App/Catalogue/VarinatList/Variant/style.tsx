import styled from "@emotion/styled";


export const Wrapper = styled.div`
  position: relative;
  display: block;
`

export const SlidesWrapper = styled.div<{loaded: boolean}>`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: ${props => props.loaded ? 'auto' : '0'};
`;


export const ImageWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  top: 0;
  left: 0;
  padding-top: 150%;
`;

export const Slide = styled.div`
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

export const BlankImage = styled.div`
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: #fff;
    z-index: 1;
`;
