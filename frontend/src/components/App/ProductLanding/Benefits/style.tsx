import styled from "@emotion/styled";

export const BenefitsList = styled.ul`
  display: grid;
  grid-gap: 24px;
  grid-template-columns: 1fr;
  list-style: none;
  padding: 16px;
  margin: 0;
`

export const BenefitItem = styled.li`
  display: grid;
  grid-template-columns: 128px 1fr;
  grid-gap: 24px;
`

export const BenefitNumber = styled.span`
  font-family: 'Lora', serif;
  font-size: 24px;
  color: ${({theme}) => theme.color.primary};
`

export const BenefitImageWrapper = styled.div`
    width: 100%;
    height: auto;
    padding-top: 100%;
    position: relative;
    background-color: ${({theme}) => theme.color.primaryLight};
    border-radius: 50%;
    margin-bottom: 16px;
  
    img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        top: 0;
    }
`