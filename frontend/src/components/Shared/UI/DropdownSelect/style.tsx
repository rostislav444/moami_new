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
  padding: ${({ pd }) => pd ? `${pd * 2}px` : '0 8px 0 0'};
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

export const DropdownSearch = styled.input`
  width: calc(100% - 32px);
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  color: #000000;
  border: none;
  background: ${({ theme }) => `${theme.color.primaryLight}10`};
  outline: none;

  :focus {
    background: ${({ theme }) => `${theme.color.primaryLight}20`};
  }
`;

export const DropdownOptionsWrapper = styled.div<{ isOpen: boolean, isMobile: boolean }>`
  position: ${({isMobile}) => isMobile ? 'fixed' : 'absolute'};
  top: ${({isMobile}) => isMobile ? '0' : 'unset'};
  left: ${({isMobile}) => isMobile ? '0' : 'unset'};
  width: calc(100vw - 3px);
  height: ${({isMobile}) => isMobile ? 'calc(100vh - 2px)' : 'auto'};
  background: #FFFFFF;
  z-index: 1000;
  border: 1px solid ${({theme}) => theme.color.primary};
  display: ${({isOpen}) => isOpen ? 'block' : 'none'};
`;

export const DropdownOptions = styled.div<{ isMobile: boolean }>`
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: ${({isMobile}) => isMobile ? 'calc(100vh - 40px)' : '300px'};
`;

export const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  color: #000000;

  &:hover {
    background: ${({ theme }) => `${theme.color.primary}10`};
  }
`;

export const DropdownPlaceholder = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey};
`;
