import styled from "@emotion/styled";

export const DropdownOptionsWrapper = styled.div<{ isOpen: boolean, isMobile: boolean }>`
  position: ${({isMobile}) => isMobile ? 'fixed' : 'absolute'};
  top: ${({isMobile}) => isMobile ? '0' : 'unset'};
  left: ${({isMobile}) => isMobile ? '0' : 'unset'};
  width: ${({isMobile}) => isMobile ? 'calc(100vw - 3px)' : '100%'};
  height: ${({isMobile}) => isMobile ? 'calc(100vh - 2px)' : 'auto'};
  background: #FFFFFF;
  z-index: 1000;
  border: 1px solid ${({theme}) => theme.color.primary};
  display: ${({isOpen}) => isOpen ? 'block' : 'none'};
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