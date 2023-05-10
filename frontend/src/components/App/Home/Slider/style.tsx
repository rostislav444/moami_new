import styled from "@emotion/styled";


export const SlideWrapper = styled.div`
    position: relative;
    display: block;
    width: 100%;
    height: auto;
    padding-bottom: 60%;
`


export const MiniPostSlide = styled.div`
  position: absolute;
  top: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;

  width: 100%;
  height: 600px;

  .image {
    position: relative;
    > img:nth-of-type(1) {
      position: absolute;
      top: 0;
      right: 8%;
      width: 70%;
      z-index: 1;
    }
    > img:nth-of-type(2) {
      position: absolute;
      top: 30%;
      left: 3%;
      width: 60%;
      z-index: 2;
    }

  }
`