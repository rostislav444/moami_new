import styled from '@emotion/styled';


export const ProductContainer = styled.div`
  display: flex;
  padding-bottom: 48px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;


export const DescriptionColumn = styled.div`
  display: block;
  position: relative;
  width: 420px;
  height: 320px;
  padding-left: 24px;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    padding-left: 0;
    position: relative;
    margin-top: 24px;
  }
`;


export const SizeList = styled.ul`
  display: block;
  margin: 0;
  padding: 0;
  list-style: none;

  :after {
    content: '';
    display: block;
    clear: both;
  }
`;

export const SizeItem = styled.li<{ selected?: boolean, active: boolean }>`
  display: inline-block;
  float: left;
  margin: 0 8px 8px 0;
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? props.theme.color.primary : props.theme.color.grey};
  background-color: ${props => props.active ?
          props.selected ? props.theme.color.primary : 'white' :
          props.theme.color.grey
  };
  color: ${props => props.selected ? 'white' : 'black'};
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.active ? 'pointer' : 'default'};


  :hover {
    background-color: ${props => props.active ? props.theme.color.primary : props.theme.color.grey};
    color: ${props => props.active && 'white'};
  }

`

export const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 24px;
`;


export const AddToWishlistWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${props => props.theme.color.primary};

    img {
      filter: invert(1);
    }
  }
`

export const BuyButton = styled.button`
  display: block;
  width: 100%;
  height: 48px;
  background: ${props => props.theme.color.primaryDark};
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${props => props.theme.color.primary};
  }
`;

export const ProductPreview = styled.ul`
  display: grid;
  margin: 12px 0 12px 0;
  padding: 0;
  list-style: none;
  grid-gap: 4px;
`
