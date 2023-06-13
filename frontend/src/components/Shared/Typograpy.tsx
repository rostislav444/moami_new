import styled from '@emotion/styled'
import {theme} from "@/styles/Theme";
import {h1, h2, span, p} from "@/components/Shared/Abstract";

export const H1 = styled(h1)`
  font-size: 38pt;
  font-family: 'Lora', serif;
  font-weight: 400;
`

export const H2 = styled(h2)`
  font-size: 24pt;
  font-family: 'Lora', serif;
  font-weight: 400;
`

export const H3 = styled(p)`
  font-size: 16pt;
  font-family: 'Lora', serif;
  font-weight: 400;
`

export const H4 = styled(p)`
  font-size: 12pt;
  font-family: 'Lora', serif;
  font-weight: 400;

`

export const P = styled(p)`
  font-size: 16px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.75;
  color: ${props => {
    if (props.color === 'primary') return theme.color.primary
    if (props.color === 'white') return 'white'
    return null
  }}
`

export const PL = styled(p)`
  font-size: 18px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.75;
`

export const Span = styled(span)`
  font-size: 14px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.75;
`

export const SpanBig = styled(span)`
  font-size: 16px;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.75;
`

export const BoldBody = styled(Span)`
  font-size: 14px;
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  line-height: 1.75;
`


export const Caption = styled(span)`
  font-size: 10pt;
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
  line-height: 1.75;
  color: grey;
`

export const Error = styled(span)`
  font-size: 10pt;
  font-family: 'Open Sans', sans-serif;
  font-weight: 400;
  color: ${props => props.theme.color.error};
`