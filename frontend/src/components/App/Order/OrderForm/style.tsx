import styled from '@emotion/styled'
import {css} from '@emotion/react'
import {theme} from "@/styles/Theme";
import InputMask from 'react-input-mask';
import MaskedInput from 'react-text-mask'

// import InputMask types
import {Props as InputMaskState} from 'react-input-mask';

interface InputMaskProps extends InputMaskState {
    error?: boolean | undefined
}

interface PhoneInputProps {
    value: string,
    onChange: (e: any) => void
}

export const PhoneInput = ({ value, onChange }: PhoneInputProps) => {
  return (
    <MaskedInput
      mask={['+', '3', '8', ' ', '(', '0', /\d/, /\d/, ')', ' ', /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/,]}
      className="form-control"
      placeholder="+38 (0__) __-__-__"
      guide={false}
      value={value}
      onChange={onChange}
    />
  );
};



export const StyledInputMask = styled(InputMask)<InputMaskProps>`
  display: block;
  width: calc(100% - 32px);
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${props => props.error ? props.theme.color.error : props.theme.color.primary};

  &:focus {
    outline: none;
    border: 1px solid ${props => props.theme.color.primary};
  }

  ::placeholder {
    color: ${props => props.theme.color.primary};
    font-family: 'Lora', serif;
  }
`;




export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-family: 'Lora', serif;
  font-weight: 400;
  line-height: 1.75;
`



