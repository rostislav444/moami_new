import styled from "@emotion/styled";


export const ArrowWrapper = styled.div<{left?: boolean, disabled?: boolean}>`
    position: absolute;
    display: block;
    width: 16px;
    height: 16px;
    padding: 12px;
    top: calc(50% - 8px);
    cursor: pointer;
    z-index: 1;
    left: ${props => props.left ? '4px' : 'auto'};
    right: ${props => props.left ? 'auto' : '4px'};
    background-color: ${props => props.theme.color.primary}20;
  
    svg {
      opacity: ${props => props.disabled ? 0.2 : 1};
      fill: ${props => props.theme.color.primary};
    }
`;