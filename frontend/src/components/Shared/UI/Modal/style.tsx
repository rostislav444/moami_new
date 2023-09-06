import styled from '@emotion/styled'
import {P} from "@/components/Shared/Typograpy";


export const ModalOuter = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.color.primaryLight}50;
  z-index: 10;
`

export const ModalWrapper = styled.div`
  display: block;
  width: auto;
  min-width: 420px;
  background-color: white;
  
  @media (max-width: 768px) {
    min-width: calc(100% - 24px);
  }
`

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 32px;
  height: 32px;
  grid-gap: 16px;
  padding: 16px;
`

const CloseWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  :hover {
    background-color: ${props => props.theme.color.primaryLight};
  }

  > img {
    width: 24px;
    height: 24px;
  }
`


export const ModalContent = styled.div`
  position: relative;
  display: block;
  padding: 0 16px 16px 16px;
`


export const ModalHeader = ({title, onClose}: { title?: string, onClose: any }) => {
    return <Header>
        <div>
            <P>{title}</P>
        </div>
        <CloseWrapper onClick={() => onClose()}>
            <img src={"/icons/close.svg"} alt='x'/>
        </CloseWrapper>
    </Header>
}