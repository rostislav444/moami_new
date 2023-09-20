import styled from '@emotion/styled';

export const Wrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
`

export const CommentsList = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 24px;
  margin: 24px 0 0 0;
  padding: 0;
  list-style: none;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`


export const CommentWrapper = styled.li`
  position: relative;
  display: block;
`

export const CommentBlock = styled.span`
  position: relative;
  display: block;
  width: calc(100% - 48px - 4px);
  padding: 24px;
  border: 2px solid ${({theme}) => theme.color.primary};
  border-radius: 0px;
  background-color: white;
`

export const CommentHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px
`

export const StarsBlock = styled.div<{ rating?: number }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;

  > img {
    width: 24px;
    height: 24px;
    margin-right: 8px;

    /* Apply grayscale filter to all by default */
    filter: grayscale(100%);

    /* Conditional rendering to color stars based on rating prop */
    ${props => Array.from({length: 5}).map((_, idx) => {
      if (idx < (props.rating || 0)) {
        return `
          &:nth-child(${idx + 1}) {
            filter: none; /* Remove grayscale for active stars */
          }
        `;
      }
      return '';
    }).join('')}
  }
`;