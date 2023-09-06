import styled from "@emotion/styled";

export const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: auto;
`;

export const DropdownValueWrapper = styled.div<{ transparent: boolean, pd: number }>`
  display: grid;
  grid-template-columns: 1fr 32px;
  align-items: center;
  width: ${({ pd }) => pd ? `calc(100% - ${pd * 2 * 2}px)` : 'calc(100% - 8px)'};
  min-height: 16px;
  padding: ${({ pd }) => pd ? `${pd * 2}px` : '0'};
  border: ${({ transparent, theme }) => transparent ? 'none' : `1px solid ${theme.color.primary}`};
  background: ${({ transparent }) => transparent ? 'none' : '#FFFFFF'};
  cursor: pointer;

  &:hover {
    border-color: black;
  }
`;

export const DropdownValue = styled.span`
  font-size: 14px;
  color: #000000;
  cursor: pointer;
`;

export const DropdownIcon = styled.img<{ isOpen: boolean, width?: number, height?: number }>`
  width: ${({ width = 16 }) => width}px;
  height: ${({ height = 16 }) => height}px;
  margin-left: 8px;
  transform: ${({ isOpen }) => isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

export const DropdownPlaceholder = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey};
`;
