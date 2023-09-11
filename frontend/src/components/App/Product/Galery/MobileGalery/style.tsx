import styled from "@emotion/styled";


export const Wrapper = styled.div`
  position: relative;
  display: inline-block;
  float: left;
  height: auto;
  margin-right: 24px;
  width: 100%;
`

export const ImageColumn = styled.div`
  position: relative;
  width: 100%;
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
  display: block;
  width: 100%;
  margin: 0;
  height: auto;
  padding-top: 150%;

  @media (max-width: 1154px) {
    width: 100%;
    margin: 0;
    padding-top: 150%;
  }
`;


export const Image = styled.img<{ blur?: boolean }>`
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

export const ThumbnailWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 20px;
`;

export const ThumbnailImageWrapper = styled.div<{active: boolean}>`
  position: relative;
  width: 100%;
  height: auto;
  padding-top: 150%;
  cursor: pointer;
  opacity: ${props => props.active ? '1' : '0.5'};
  border: 1px solid ${props => props.active ? props.theme.color.primary : 'transparent'};
  transition: opacity 0.5s ease;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

  }
`

export const ThumbnailVideoWrapper = styled.div<{active: boolean}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  padding-top: 150%;
  cursor: pointer;
  opacity: ${props => props.active ? '1' : '0.5'};
  transition: opacity 0.5s ease;
  background-color: ${props => props.theme.color.light};

  img {
    position: absolute;
    top: calc(50% - 24px);
    width: 48px;
    height: 48px;
  }
`