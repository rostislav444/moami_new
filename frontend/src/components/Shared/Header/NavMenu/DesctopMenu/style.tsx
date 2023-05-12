import styled from "@emotion/styled";

interface NavMenuItemProps {
    selected?: boolean;
}

export const NavWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
`


export const NavUl = styled.ul`
  display: flex;
  justify-content: space-between;
  align-items: center;
  list-style: none;
  padding: 0px;
  margin: 0;
`

export const NavMenuItem = styled.li<NavMenuItemProps>`
  cursor: pointer;
  padding: 0 2px 12px 2px;
  margin: 0 14px;
  border-bottom: ${props => props.selected && '2px solid black'};

  :hover > .sub-menu {
    display: grid;
  }
`

export const SubMenuWrapper = styled.div`
  position: absolute;
  display: none;
  width: 100%;
  border-top: 2px solid black;
  top: 127px;
  left: 0;
  background-color: white;
  z-index: 10;
`

export const SubMenu = styled.ul`
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  width: 100%;
  max-width: 720px;
  height: auto;
  left: auto;
  right: auto;
  margin: 0 auto;
  z-index: 10;
  list-style: none;
`

export const SubMenuItem = styled.li`
  padding: 12px;
  border-bottom: 2px solid transparent;
  cursor: pointer;

  :hover {
    background-color: ${props => props.theme.color.primary};
    color: white;
  }
`
