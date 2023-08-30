import styled from "@emotion/styled";

export const Wrapper = styled.div`
  position: relative;
  background-color: #ffffff;
  display: block;
  width: calc(100% - 48px);
  height: auto;
  padding: 24px;
`

export const OrderItemsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 8px;
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${props => props.theme.color.grey};
`

export const OrderItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 12px;
  width: 100%;
  height: auto;
`

export const OrderItemDescription = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
`

export const OrderItemDescriptionRight = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    justify-items: end;
`

export const OrderTotalWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    justify-items: end;
`
