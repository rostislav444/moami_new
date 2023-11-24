import styled from "@emotion/styled";


export const ImageSlide = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
`


export const ImageStyled = styled.img<{ scale: number, position: { x: number, y: number } }>`
  -webkit-user-drag: none;
`