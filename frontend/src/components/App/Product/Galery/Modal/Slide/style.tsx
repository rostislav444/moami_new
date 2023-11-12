import styled from "@emotion/styled";


export const ImageWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-height: calc(100vh - 48px);
`

export const ImageStyled = styled.img<{ scale: number, position: {x: number, y: number} }>`
  position: absolute;
  display: block;
  transform: ${props => `translate(${props.position.x}px, ${props.position.y}px) scale(${props.scale})`};
  transform-origin: center;
  -webkit-user-drag: none;
`