import styled from "@emotion/styled";


export const ImageWrapper = styled.div`
    position: relative;
    display: block;
    padding-bottom: 56.25%; // 16:9 aspect ratio
    height: 0;
    overflow: hidden;
  
  > img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; // Scale the image to cover all the area
  }

`;

