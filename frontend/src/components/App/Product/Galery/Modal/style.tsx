import styled from "@emotion/styled";


export const Wrapper = styled.div<{ mobile: boolean }>`
  position: fixed;

  display: flex;
  flex-direction: ${props => props.mobile ? 'column-reverse' : 'row'};
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: ${props => props.theme.color.lightGray};
  z-index: 1000;
`

export const ThumbnailsWrapper = styled.div<{ mobile?: boolean }>`
  position: relative;
  display: ${props => props.mobile ? 'flex' : 'block'};
  width: ${props => props.mobile ? '100%' : '120px'};
  //background-color: green;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

export const ThumbnailsList = styled.ul<{ mobile?: boolean }>`
  position: relative;
  display: block;
  width: 200px;
  height: ${props => props.mobile ? '120px' : '100vh'};
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 1001;
`

export const Thumbnail = styled.li<{ selected: boolean, mobile?: boolean }>`
  display: block;
  width: ${props => props.mobile ? '80px' : '120px'};
  height: ${props => props.mobile ? '120px' : '180px'};
  opacity: ${props => props.selected ? 1 : 0.5};
  box-sizing: border-box;
  cursor: pointer;


  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const GalleryWrapper = styled.div<{ mobile?: boolean }>`
  position: absolute;
  display: block;
  top: 0;
  right: 0;
  width: ${props => props.mobile ? '100%' : 'calc(100% - 120px)'};
  height: 100%;
`

export const Gallery = styled.div`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;

`


export const CloseButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  right: 0;
  width: 48px;
  height: 48px;
  background-color: transparent;
  border: 1px solid ${props => props.theme.color.primary};
  outline: none;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.1s ease-in-out;

  img {
    width: 24px;
    height: 24px;
  }

  :hover {
    background-color: ${props => props.theme.color.primary};

    img {
      filter: invert(100%);
    }
  }
`