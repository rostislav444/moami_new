import styled from "@emotion/styled";
import Image from "next/image";

export const CategoriesWrapper = styled.ul`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  list-style: none;
  padding: 0;
  margin: 24px 0 0 0;
`

export const ParentCategory = styled.li`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 24px;
`

export const ChildCategoryList = styled.ul`
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-gap: 24px;
  list-style: none;
  padding: 0;
  margin: 0;
`

export const ChildCategory = styled.li<{bg?: string}>`
  position: relative;
  display: block;
  padding-top: 100%;
  background-color: ${props => props.theme.color.light};
  
  :hover {
    * {
      color: black !important;
    }
    .overlay {
        opacity: 0;
    }
    img {
        opacity: 1;
    }
  }
  
  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: ${props => props.theme.color.primary};
    opacity: 0.2;
    z-index: 0;
    
  }

  > div {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    > h2 {
      position: absolute;
      margin: 16px;
      z-index: 1;
      top: 0;
      left: 0;
    }
  }
`


export const CategoryImage = styled(Image)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  cursor: pointer;
  opacity: 0.65;
  
  :hover {
    opacity: 1;
  }
`

