import styled from '@emotion/styled'
import dynamic from "next/dynamic";
import {Span} from "@/components/Shared/Typograpy";

interface IconWrapperProps {
    ml?: number;
    mr?: number;
    count?: number;
}

interface IconProps extends IconWrapperProps {
    src: string;
    title?: string;
    grey?: boolean;
    onClick?: any;
}


const IconWrapper = styled.div<IconWrapperProps>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: ${props => props.mr && `${8 * props.mr}px`};
  margin-left: ${props => props.ml && `${8 * props.ml}px`};
  cursor: pointer;
`

const IconCounterStyle = styled.span`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
  background-color: ${props => props.theme.color.primary};
  bottom: -4px;
  right: -8px;
  color: white;
  font-size: 12px;
  text-align: center;
  border-radius: 50%;
  line-height: 18px;
`


const IconImg = styled.img<{grey?: boolean}>`
  width: 24px;
  height: 24px;
  ${props => props.grey && 'filter: invert(0.5);'}
`


const IconCounter = ({children}: { children: number }) => {
    return <IconCounterStyle>{children}</IconCounterStyle>
}


const DynamicIconCounter = dynamic(() => Promise.resolve(IconCounter), {
    ssr: false,
})


export const Icon = ({src, onClick, count, title, ml, mr, grey}: IconProps) => {
    return (
        <IconWrapper ml={ml} mr={mr} onClick={onClick}>
            <IconImg src={src} grey={grey}/>
            {!!title && <Span capitalize ml={2}>{title}</Span>}
            {!!count && <DynamicIconCounter>{count}</DynamicIconCounter>}
        </IconWrapper>
    )
}

