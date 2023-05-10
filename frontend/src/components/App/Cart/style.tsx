import styled from "@emotion/styled";


export const Wrapper = styled.div`
  position: relative;
  display: block;
  max-width: 1200px;
  margin: 0 auto;
`


export const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  margin-top: 24px;

  > * {
    margin: 0 0 0 12px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    > * {
      margin: 12px 0 0 0;
      width: 100%;
    }
  }
`