import {DescriptionContainer, DescriptionText, ShowMoreButton} from "@/components/App/Product/Description/style";
import {useEffect, useRef, useState} from "react";



interface DescriptionProps {
    description: string
}


export const ProductDescription = ({description}: DescriptionProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const maxHeight = 144
    const [showMore, setShowMore] = useState<boolean>(false)
    const [showButton, setShowButton] = useState<boolean>(true)

    const handleShowMore = () => {
        setShowMore(!showMore)
    }

    useEffect(() => {
        if (ref.current) {
            setShowButton(ref.current.scrollHeight > maxHeight)
        }
    }, [ref.current])



    return (
        <DescriptionContainer>
            <DescriptionText ref={ref} showMore={showMore}>
                {description}
            </DescriptionText>
            {showButton && <ShowMoreButton onClick={handleShowMore}>
                {!showMore ? 'Читать полностью' : 'Скрыть'}
            </ShowMoreButton>}
        </DescriptionContainer>
    )
};