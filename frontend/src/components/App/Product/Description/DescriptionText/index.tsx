import {
    DescriptionContainer,
    DescriptionText,
    ExtraDescription,
    ShowMoreButton
} from "@/components/App/Product/Description/DescriptionText/style";
import React, {useEffect, useRef, useState} from "react";



interface DescriptionProps {
    description: string,
    extra_description?: string
}


export const ProductDescription = ({description, extra_description}: DescriptionProps) => {
    const descriptionRef = useRef<HTMLDivElement>(null)
    const descriptionTextRef = useRef<HTMLDivElement>(null)
    const [showMore, setShowMore] = useState<boolean>(false)
    const [showButton, setShowButton] = useState<boolean>(true)

    const maxHeight = 120

    useEffect(() => {
        if (descriptionTextRef.current) {
            setShowButton(descriptionTextRef.current.scrollHeight > maxHeight)
        }
    }, [descriptionTextRef.current])


    const handleShowMore = () => {
        setShowMore(!showMore)
    }

    return <div>
        <DescriptionContainer ref={descriptionRef}>
            <DescriptionText ref={descriptionTextRef} showMore={showMore}>
                {description}
            </DescriptionText>
            {showButton && <ShowMoreButton onClick={handleShowMore}>
                {!showMore ? 'Читать полностью' : 'Скрыть'}
            </ShowMoreButton>}
        </DescriptionContainer>
        <ExtraDescription>
            {extra_description && <div dangerouslySetInnerHTML={{__html: extra_description}}/>}
        </ExtraDescription>
    </div>
};