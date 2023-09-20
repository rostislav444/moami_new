import styled from "@emotion/styled";

export const ImageColumn = styled.div`
  position: relative;
  flex: 1;
  display: block;
  height: auto;
  margin-right: 10px;

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
  }
`;


export const ImageWrapper = styled.div`
  position: relative;
  display: inline-block;
  float: left;
  width: calc(50% - 10px);
  margin: 0 10px 10px 0;
  height: auto;
  padding-top: calc(150% / 2);
  
  @media (min-width: 1800px) {
    width: calc(33.33% - 10px);
    padding-top: calc(150% / 3);
  }

  @media (max-width: 1154px) {
    width: 100%;
    margin: 0 0 10px 0;
    padding-top: 150%;
  }
`;


export const Image = styled.img<{blur?: boolean}>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    
    filter: ${props => props.blur ? 'blur(5px)' : 'none'};
    transition: filter 0.5s ease;
`;

export const Video = styled.video`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
`;