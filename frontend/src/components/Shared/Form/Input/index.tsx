import styled from '@emotion/styled'

export const Input = styled.input`
  width: calc(100% - 32px);
  height: 32px;
  padding: 8px 16px;
  border: none;
  border-radius: 0;
  font-size: 14px;
  font-weight: 400;
  color: ${props => props.theme.color.primary};
  transition: all 0.3s ease-in-out;
  outline: none;
  margin: 0;

  :focus {
    background-color: ${props => props.theme.color.light};
  }
`