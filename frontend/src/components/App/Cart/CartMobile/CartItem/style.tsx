import styled from '@emotion/styled'
import {P}    from "@/components/Shared/Typograpy";


export const Wrapper = styled.div`
  position: relative;
  display: block;
  background-color: #fff;
  border: 1px solid ${props => props.theme.color.primary};
  padding: 16px;
  margin-bottom: 16px;
`

export const ItemImage = styled.div`
  position: relative;
  display: block;
  width: 100px;
  height: 150px;

  img {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 1px solid ${props => props.theme.color.light};
  }
`

export const ItemInfo = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

export const CounterWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: auto;
`

export const PriceWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: auto;
  margin-top: 4px;
`

export const OldPrice = styled(P)`
  text-decoration: line-through;
  color: ${props => props.theme.color.primary};
  margin-left: 16px;
`

export const ItemData = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  grid-gap: 16px;
  align-items: flex-start;
  justify-content: flex-start;
  margin-bottom: 16px;
`


export const ItemActions = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 100px 1fr 24px;
  grid-gap: 16px;
  align-items: center;
  width: 100%;
`