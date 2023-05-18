import styled from '@emotion/styled'


export const Main = styled.main`
    display: block;
    width: 100%;
    height: auto;
    margin: 0 auto;
    padding-bottom: 32px;
  
    @media (max-width: 768px) {
      padding-top: 54px;
    }
`

export const Content = styled.div`
  display: block;
  width: calc(100% - 64px);
  height: auto;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    width: calc(100% - 48px);
  }
`