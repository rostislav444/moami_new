import styled from '@emotion/styled'

export const BurgerIcon = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 24px;
    height: 24px;
    cursor: pointer;

    div {
        width: 100%;
        height: 2px;
        background-color: #333;
    }
`;

export const BurgerMenuWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.colors.background};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

export const BurgerMenuUl = styled.ul`
    list-style-type: none;
    padding: 0;
    margin: 0;
`;

export const BurgerMenuItem = styled.li`
    margin-bottom: 16px;
`;

export const BurgerSubMenu = styled.ul`
    list-style-type: none;
    padding: 0;
    margin: 0;
    margin-left: 16px;
`;

export const BurgerSubMenuItem = styled.li`
    margin-bottom: 8px;
`;