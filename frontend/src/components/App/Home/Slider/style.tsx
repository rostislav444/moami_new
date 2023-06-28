import styled from "@emotion/styled";

export const Wrapper = styled.div`
  margin-top: 32px
`


export const SlideWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: 0;
  padding-top: 56.25%;
  
  @media(max-width: 768px) {
      padding-top: 150%;
  }

  > div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

export const ImageStyled = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  object-fit: cover;
`