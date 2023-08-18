import styled from '@emotion/styled';




export const PaginationButton = styled.span<{active?: boolean}>`
  position: relative;
  display: block;
  text-align: center;
  border: none;
  background-color: transparent;
  color: ${props => props.active ? '#red' : '#000'};
  font-size: 1.2rem;
  margin: 0 5px;
  padding: 2px 7px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease-in-out;
  width: auto;
  cursor: pointer;

  &:hover {
    color: red;
  }


`;

export const PaginationWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
`;

