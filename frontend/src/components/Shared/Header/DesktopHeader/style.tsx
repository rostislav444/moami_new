import styled from '@emotion/styled'



export const HeaderWrapper = styled.header`
  display: grid;
  width: 100%;
  border-bottom: 2px solid ${props => props.theme.color.primary};
`

export const HeaderfirstLine = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr 160px;
  align-items: center;
  grid-gap: 20px;
  width: 100%;
  height: auto;
  margin-top: 20px;
  margin-bottom: 20px;
  
  > div:first-of-type {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  
`

export const IconsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`



