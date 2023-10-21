import styled from '@emotion/styled'


export const FeedbackOuterWrapper = styled.div`
  display: block;
  padding-bottom: 24px;
`

export const FeedbackWrapper = styled.div`
    display: grid;
    grid-gap: 24px;
    grid-template-columns: 1fr;
    list-style: none;
    padding: 16px;
    margin: 0;
`

export const FeedbackItem = styled.li`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 8px;
  padding: 16px;
  background-color: white;
`

export const FeedbackItemInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`

