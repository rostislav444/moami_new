import {DescriptionContainer, DescriptionText, ShowMoreButton} from "@/components/App/Product/Description/style";
import React, {useEffect, useRef, useState}                    from "react";


interface DescriptionProps {
    description: string,
    parent: React.MutableRefObject<HTMLDivElement>
}


export const ProductDescription = ({description, parent}: DescriptionProps) => {
    const parentInitialHeight = useRef<number>(0)
    const descriptionRef = useRef<HTMLDivElement>(null)
    const descriptionTextRef = useRef<HTMLDivElement>(null)
    const maxHeight = 144
    const [showMore, setShowMore] = useState<boolean>(false)
    const [showButton, setShowButton] = useState<boolean>(true)

    useEffect(() => {
        if (parent.current) {
            parent.current.style.height = parent.current.offsetHeight + 'px'
            parentInitialHeight.current = parent.current.offsetHeight
        }
    }, [parent])

    useEffect(() => {
        if (descriptionTextRef.current) {
            if (descriptionTextRef.current.scrollHeight <= maxHeight) {
                setShowButton(false)
            }
        }
    }, [descriptionTextRef.current])

    const handleShowMore = () => {
        setShowMore(!showMore)
        if (descriptionTextRef.current && descriptionRef.current) {
            console.log(parentInitialHeight.current)
            if (!showMore) {
                parent.current.style.height = parentInitialHeight.current +
                    descriptionTextRef.current.scrollHeight - descriptionTextRef.current.offsetHeight + 'px'
            } else {
                parent.current.style.height = parentInitialHeight.current + 'px'
            }
        }
    }


    return (
        <DescriptionContainer ref={descriptionRef}>
            <DescriptionText ref={descriptionTextRef} showMore={showMore}>
                {description}
            </DescriptionText>
            {showButton && <ShowMoreButton onClick={handleShowMore}>
                {!showMore ? 'Читать полностью' : 'Скрыть'}
            </ShowMoreButton>}
        </DescriptionContainer>
    )
};