import styled from "@emotion/styled";


export const PriceWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`


export const Price = styled.span`
  font-size: 24px;
  font-weight: 500;
  color: #000;
  margin-right: 16px;
`;

export const OldPrice = styled.span`
  font-size: 18px;
  font-weight: 400;
  color: ${props => props.theme.color.grey};
  text-decoration: line-through;
`;
