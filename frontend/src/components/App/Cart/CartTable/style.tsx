import styled from "@emotion/styled"
import {Span} from "@/components/Shared/Typograpy";


export const CartTable = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  grid-gap: 0;

  @media (max-width: 768px) {
    margin: 32px auto 0 auto;
  }

  .cart-row {
    position: relative;
    display: grid;
    grid-template-columns: 124px 1fr 1fr 1fr 1fr 1fr;
    grid-auto-rows: auto;
    grid-gap: 0;
  }

  .cart-header {
    font-family: Lora;

    > p {
      color: ${props => props.theme.color.grey};
    }

    @media (max-width: 768px) {
      display: none;
    }
  }

  .cart-cell {
    padding: 16px 0;
    border-bottom: 2px solid ${props => props.theme.color.primary};
    text-align: left;
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
      padding: 0;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      border-bottom: none;
    }
  }

  .cart-cell:last-child {
    text-align: right;
  }

  .item-row {
    grid-template-areas: "item-image item-name item-price item-quantity item-total item-remove";
    @media (max-width: 768px) {
      position: relative;
      display: grid;
      align-items: center;
      grid-template-columns: 1fr 80px 80px;
      grid-auto-rows: auto;
      grid-gap: 16px;
      grid-template-areas:
          "item-image item-image item-remove"
          "item-name  item-name  item-name"
          "item-quantity item-price item-total";
      margin-bottom: 32px;
      padding-bottom: 30px;
      border-bottom: 2px solid ${props => props.theme.color.primary};
    }
  }

  .cart-image {
    grid-area: item-image;
    position: relative;
    display: block;

    img {
      position: relative;
      display: block;
      width: 100px;
      height: 150px;

      @media (max-width: 768px) {
        width: 200px;
        height: 300px;
      }
    }

  }

  .cart-name {
    grid-area: item-name;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;

    > * {
      margin: 0 0 8px 0;
      padding: 0;
    }
  }

  .cart-price {
    grid-area: item-price;
    text-align: right;
  }

  .cart-quantity {
    grid-area: item-quantity;
    text-align: center;
  }

  .cart-remove {
    grid-area: item-remove;
    text-align: center;
  }

  .cart-total {
    grid-area: item-total;
    text-align: right;
    font-weight: bold;
  }
`;


export const CartImage = styled.div`
  position: relative;
  display: block;
  width: 100px;
  height: 150px;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    padding-top: 133%;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const RemoveButton = styled(Span)`
  cursor: pointer;

  :hover {
    text-decoration: underline;
  }
`