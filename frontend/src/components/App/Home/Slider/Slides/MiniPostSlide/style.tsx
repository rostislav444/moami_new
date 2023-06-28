import styled from "@emotion/styled";

export const MiniPostWrapper = styled.div`
  position: relative;
  display: block;
  height: 0;
  overflow: hidden;


`;

export const ImagesWrapper = styled.div`
  position: absolute;
  display: block;
  width: 56%;
  height: 100%;
  right: 0;
  top: 0;
  
  @media(max-width: 768px) {
      width: 100%;
  }
`




export const FirstImageWrapper = styled.div`
  position: absolute;
  width: calc(100% / 3 * 2);
  height: 100%;
  right: 0;
  
  @media(max-width: 768px) {
    width: 100%;
    height: 100%;
  }
  

`

export const SecondImageWrapper = styled.div`
  position: absolute;
  width: calc(65% / 3 * 2);
  height: 65%;
  left: 0;
  bottom: 5%;

  @media (max-width: 768px) {
    bottom: 0;
  }
`
