import styled from "@emotion/styled";


export const Wrapper = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 8px;
  bottom: 8px;
  left: auto;
  right: auto;
  margin: 0 auto;
  z-index: 1;
`

export const Dot = styled.div<{active?: boolean}>`
    position: relative;
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background-color: ${props => props.active ? props.theme.color.primary : props.theme.color.light};
    cursor: pointer;
`;