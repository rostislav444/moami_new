import styled from '@emotion/styled'
import {H1, H2, H3, P, Span} from "@/components/Shared/Typograpy";

export const FooterWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
  background-color: ${props => props.theme.color.primary};
  color: white;
  padding: 24px 0;
  margin-top: 48px;
`

export const MainLine = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 40px;
  width: 100%;
  margin-top: 24px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`
export const SloganBlock = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
`

export const SocialPhrase = styled(Span)`
  display: block;

  > span {
    margin-right: 4px;
    padding-bottom: 2px;
  }

  > span:first-of-type {
    font-family: ${props => props.theme.fontFamily};
    font-size: 32px;
  }

  > span: last-of-type {
    font-size: 16px;
  }
`

export const PagesBlock = styled.div`
  display: grid;
  grid-template-columns: 160px 240px;
  justify-content: flex-start;
  grid-gap: 16px;
  align-items: flex-start;;
  width: 100%;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const PagesBlockList = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;

`
