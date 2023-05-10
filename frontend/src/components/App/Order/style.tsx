import styled from '@emotion/styled';

export const Wrapper = styled.div`
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas: 
      "item1 item2";
  grid-gap: 24px;
  width: 100%;
  height: auto;

  .order-form {
    grid-area: item1;
  }

  .order-product-list {
    grid-area: item2;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas:
        "item2"
        "item1";
  }
`