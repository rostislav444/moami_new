import styled from "@emotion/styled";


export const Outer = styled.div`
  position: fixed;
  display: block;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: white;
  z-index: 1000;
`

export const Wrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 120px 1fr;
  grid-gap: 24px;
  margin: 24px;
  width: calc(100% - 48px);
  height: calc(100% - 48px);
`

export const ThumbnailsWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const ThumbnailsList = styled.ul`
  position: relative;
  display: block;
  width: 120px;
  height: auto;
  max-height: calc(100vh - 48px);
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;

  ::-webkit-scrollbar {
    display: none;
  }
`

export const Thumbnail = styled.li<{ selected: boolean }>`
  display: block;
  width: 120px;
  height: 180px;
  border: 2px solid ${props => props.selected ? props.theme.color.primary : props.theme.color.lightGray};
  box-sizing: border-box;
  margin-bottom: 8px;
  cursor: pointer;

  :last-child {
    margin-bottom: 0;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const Gallery = styled.div`
  background-color: ${props => props.theme.color.lightGray};
  display: block;
  width: 100%;
  max-height: calc(100vh - 48px);
`


export const CloseButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  background-color: white;
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