import styled from '@emotion/styled'
import {theme} from "@/styles/Theme";

export const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 12px;
  width: 100%;
  height: auto;
`

interface InputWrapperProps {
    ml?: number;
    mr?: number;
    mt?: number;
    mb?: number;
}

export const InputWrapper = styled.div<InputWrapperProps>`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 12px;
  margin-left: ${props => props.ml ? props.ml * 4 : 0}px;
  margin-right: ${props => props.mr ? props.mr * 4 : 0}px;
  margin-top: ${props => props.mt ? props.mt * 4 : 0}px;
  margin-bottom: ${props => props.mb ? props.mb * 4 : 0}px;
`

const inputStyles = {
    display: 'block',
    width: 'calc(100% - 32px - 2px)',
    borderRadius: 0,

    border: `1px solid ${theme.color.primary}`,
    '&:focus': {
        outline: 'none',
        border: `1px solid ${theme.color.primary}`,
        backgroundColor: theme.colors.background,
    },
    '::placeholder': {
        color: `${theme.color.primary}`,
        fontFamily: `'Lora', serif`,
    },
}


export const Input = styled.input<{ error?: boolean | undefined }>`
  ${inputStyles};
  border-color: ${props => props.error ? props.theme.color.error : props.theme.color.primary};
  height: 48px;
  padding: 0 16px;
`

export const Textarea = styled.textarea<{ error?: boolean | undefined }>`
  ${inputStyles};
  font-family: 'Open Sans', sans-serif;
  border-color: ${props => props.error ? props.theme.color.error : props.theme.color.primary};
  height: 96px;
  padding: 16px;
`