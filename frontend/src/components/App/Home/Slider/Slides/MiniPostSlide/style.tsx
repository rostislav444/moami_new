import styled from "@emotion/styled";

export const MiniPostWrapper = styled.div`
    position: relative;
    display: block;
    padding-bottom: 56.25%; // 16:9 aspect ratio
    height: 0;
    overflow: hidden;
`;

export const MiniPostSlideStyled = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;

  .title-description {
    margin: 10% 0 0 5%;
  }

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
`;