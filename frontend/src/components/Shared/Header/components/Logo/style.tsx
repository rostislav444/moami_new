import styled from '@emotion/styled'

export const LogoWrapper = styled.div<{mobile: boolean}>`
  display: flex;
  justify-content: ${props => props.mobile ? 'flex-start' : 'center'};
  align-items: center;
`

export const LogoSpan = styled.span<{mobile: boolean}>`
  font-family: 'Lora', serif;
  font-size: ${props => props.mobile ? '32px' : '40px'};
  font-weight: 400;
  color: black;
  text-align: center;
`