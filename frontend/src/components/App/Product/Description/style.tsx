import styled from '@emotion/styled';


export const DescriptionContainer = styled.div`
  display: block;
  position: relative;
  width: 100%;
  height: auto;
  margin-bottom: 24px;
`;

export const DescriptionText = styled.div<{ showMore: boolean }>`
  display: block;
  font-size: 14px;
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  line-height: 1.75;
  max-height: ${props => props.showMore ? 'none' : '144px'};
`;

export const ShowMoreButton = styled.button`
  display: block;
  position: relative;
  width: 100%;
  height: 40px;
  background-color: transparent;
  color: ${props => props.theme.color.primary};
  font-size: 14px;
  font-weight: 500;
  border: none;
  margin-top: 8px;
  
  :hover {
    background-color: ${props => props.theme.color.primary}20;
    cursor: pointer;
  }
`