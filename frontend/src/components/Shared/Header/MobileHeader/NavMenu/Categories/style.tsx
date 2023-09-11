import styled from "@emotion/styled";



export const BurgerMenuUl = styled.ul`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    list-style: none;
    padding: 0;
  margin-top: 24px;
  margin-bottom: 48px;
        
    @media (min-width: 768px) {
        display: none;
    }
`

export const BurgerMenuItem = styled.li`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 0;
    margin: 0 0 24px 0;
    width: 100%;
    height: auto;
`

export const BurgerSubMenu = styled.ul`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    list-style: none;
    padding: 0;
    margin: 2px 0 0 0;
    width: 100%;
    height: auto;
`

export const BurgerSubMenuItem = styled.li`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 0;
    margin: 0 0 8px 24px;
    width: 100%;
    height: auto;
`
