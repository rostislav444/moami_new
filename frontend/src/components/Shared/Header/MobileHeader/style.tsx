import styled from "@emotion/styled";


export const HeaderWrapper = styled.div`
  position: fixed;
  display: grid;
  grid-template-columns: 24px auto 1fr auto;
  grid-gap: 24px;
  width: calc(100% - 48px);
  height: 54px;
  color: white;
  align-items: center;
  justify-items: center;
  padding: 0 24px;
  border-bottom: 2px solid #333;
    background-color: ${props => props.theme.colors.background};
    z-index: 1000;
`;


export const BurgerIcon = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 24px;
  cursor: pointer;

  div:nth-of-type(1) {
    transform: ${props => props.isOpen ? 'rotate(45deg)' : 'rotate(0)'};
    transform-origin: top left;
  }

  div:nth-of-type(2) {
    opacity: ${props => props.isOpen ? '0' : '1'};
    transform: ${props => props.isOpen ? 'translateX(20px)' : 'translateX(0)'};
  }

  div:nth-of-type(3) {
    transform: ${props => props.isOpen ? 'rotate(-45deg)' : 'rotate(0)'};
    transform-origin: bottom left;
  }

  div {
    width: 100%;
    height: 2px;
    background-color: #333;
  }


`;