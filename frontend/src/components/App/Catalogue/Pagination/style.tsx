import styled from '@emotion/styled';

export const PaginationButton = styled.span<{active?: boolean}>`
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: none;
  background-color: ${props => props.active ? props.theme.color.primary : props.theme.color.light};
  color: ${props => props.active ? 'white' : props.theme.color.primary};
  font-size: 1.2rem;
  margin: 0 5px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.color.primary};
    color: white;
  }
`;

export const PaginationEllipsis = styled.span<{active?: boolean}>`
  position: relative;
  width: 32px;
  height: 32px;
    display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`

export const PaginationWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 48px;
`;

