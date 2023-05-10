import styled from "@emotion/styled";


export const Button = styled.button<{ primary?: boolean, light?: boolean, dark?: boolean, center?: boolean, mt?: number, mb?:number, mr?:number, ml?: number}>`
  position: relative;
  display: block;
  width: auto;
  height: 40px;
  padding: 8px 24px;
  border: none;
  background-color: ${props => {
    if (props.primary) return props.theme.color.primary;
    if (props.light) return props.theme.color.primaryLight;
    if (props.dark) return props.theme.color.primaryDark;
    return props.theme.color.primary;
  }};
  color: white;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  margin-left: ${props => props.center ? 'auto' : props.ml ? props.ml + 'px' : '0'};
  margin-right: ${props => props.center ? 'auto' : props.mr ? props.mr + 'px' : '0'};
  margin-top: ${props => props.mt ? props.mt * 8 + 'px' : '0'};
  margin-bottom: ${props => props.mb ? props.mb * 8 + 'px' : '0'};

  :hover {
    background-color: white;
    color: ${props => props.theme.color.primaryDark};
  }
`