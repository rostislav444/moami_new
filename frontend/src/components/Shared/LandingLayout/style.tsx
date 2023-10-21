import styled from '@emotion/styled'


export const Main = styled.div`
  position: relative;
  display: block;
  width: 100%;
  min-height: 100vh;
  background-color: white;
`


export const Container = styled.div`
  position: relative;
  display: block;
  width: 480px;
  min-height: 100vh;
  margin: 0 auto;
  background-color: ${({theme}) => theme.colors.background};
`

export const TitleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: ${({theme}) => theme.color.primary};
  color: white;
`




