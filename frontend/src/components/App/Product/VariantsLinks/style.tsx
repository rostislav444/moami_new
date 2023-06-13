import styled from '@emotion/styled';

export const VariantLink = styled.div<{ selected: boolean }>`
  position: relative;
  display: block;
  width: 48px;
  height: 64px;
  background-color: white;
  border: 1px solid ${props => props.selected ? props.theme.color.primary : 'white'};

`;

export const VariantsLinksContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 48px);
  grid-gap: 16px;
  margin: 24px 0;
`;