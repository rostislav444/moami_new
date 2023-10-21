import styled from '@emotion/styled'


export const VariantsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 48px;
  padding: 16px;
  margin: 16px;
`

export const VariantItem = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 16px;
  list-style: none;
  padding: 0;
  margin: 0;
`

export const VariantImageWrapper = styled.li<{selected: boolean}>`
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  padding-top: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid ${props => props.selected ? props.theme.color.primary : 'white'};

  img {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%
    object-fit: contain;
  }
`



