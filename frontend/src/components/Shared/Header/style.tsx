import styled from '@emotion/styled'



export const HeaderWrapper = styled.header`
  display: grid;
  width: 100%;
  border-bottom: 2px solid black;
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

export const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

export const Logo = styled.span`
  font-family: 'Lora', serif;
  font-size: 40px;
  font-weight: 400;
`

export const IconsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`



