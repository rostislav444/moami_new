import styled from '@emotion/styled'
import dynamic from "next/dynamic";

interface IconWrapperProps {
    ml?: number;
    mr?: number;
}

interface IconProps extends IconWrapperProps {
    src: string;
    count?: number;
    grey?: boolean;
}


const IconWrapper = styled.div<IconWrapperProps>`
  position: relative;
  display: block;
  margin-right: ${props => props.mr && `${8 * props.mr}px`};
  margin-left: ${props => props.ml && `${8 * props.ml}px`};
`

const IconCounterStyle = styled.span`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
  background-color: ${props => props.theme.color.primary};
  bottom: 0;
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


export const Icon = ({src, count, ml, mr, grey}: IconProps) => {
    return (
        <IconWrapper ml={ml} mr={mr}>
            <IconImg src={src} grey={grey}/>
            {!!count && <DynamicIconCounter>{count}</DynamicIconCounter>}
        </IconWrapper>
    )
}

