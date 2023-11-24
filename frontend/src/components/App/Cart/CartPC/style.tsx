import styled      from "@emotion/styled";
import {InfoTitle} from "@/components/Shared/Typograpy";

export const CartGrid = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr 100px 100px 100px;
  gap: 32px;
  padding: 32px;
  background-color: white;
  border: 1px solid ${props => props.theme.color.primary};
  background-color: ${props => props.theme.color.light};
`;

const GridItem = styled.div`
`;

export const CartHeaderItem = styled(GridItem)`
  text-transform: uppercase;
  color: ${props => props.theme.color.primary};
`;

export const CartHeaderPhoto = styled(CartHeaderItem)``;
export const CartHeaderDetails = styled(CartHeaderItem)``;
export const CartHeaderPrice = styled(CartHeaderItem)``;
export const CartHeaderQty = styled(CartHeaderItem)``;
export const CartHeaderTotal = styled(CartHeaderItem)``;

export const ProductPhoto = styled.div`
  position: relative;
  display: block;
  width: 100px;
  height: 150px;

  img {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid ${props => props.theme.color.light};
  }
`;


export const ProductDetails = styled(GridItem)``;
export const ProductPrice = styled(GridItem)`
  display: flex;
  flex-direction: column;
`;
export const ProductQty = styled(GridItem)``;
export const ProductTotal = styled(GridItem)``;


export const OldPrice = styled(InfoTitle)`
  text-decoration: line-through;
  color: ${props => props.theme.color.primary};
`


export const CartActionsButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;


  button {
    margin: 0 0 0 24px;
    width: 200px;
  }
`

export const CartActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
`