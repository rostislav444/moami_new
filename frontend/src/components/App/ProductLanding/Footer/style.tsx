import styled from '@emotion/styled'



export const FooterWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: calc(100% - 32px);
  margin-top: 48px;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: ${({theme}) => theme.color.primary};
  color: white;
`