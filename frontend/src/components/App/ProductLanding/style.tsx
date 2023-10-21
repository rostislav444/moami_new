import styled from '@emotion/styled'


export const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
`

export const TitleWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: ${({theme}) => theme.color.primaryLight};
  color: white;
`