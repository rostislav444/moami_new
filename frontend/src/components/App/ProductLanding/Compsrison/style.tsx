import styled from '@emotion/styled'

export const ComparisonList = styled.ul`
  display: grid;
   grid-template-columns: 1fr 1fr;
  grid-gap: 24px;
  padding: 24px;
`

export const ComparisonItem = styled.li`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 42px 1fr;
  justify-content: flex-start;
    align-items: flex-start;
  grid-gap: 24px;
  
  div {
    display: grid;
  }
`

export const ComparisonItemInfo = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 16px;
`