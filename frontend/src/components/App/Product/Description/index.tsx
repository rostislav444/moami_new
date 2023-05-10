import {DescriptionContainer, DescriptionText, ShowMoreButton} from "@/components/App/Product/Description/style";
import {useState} from "react";


interface DescriptionProps {
    description: string
}


export const ProductDescription = ({description}: DescriptionProps) => {
    const [showMore, setShowMore] = useState(false)

    return (
        <DescriptionContainer>
            <DescriptionText showMore={showMore}>
                {description}
            </DescriptionText>
            <ShowMoreButton onClick={() => setShowMore(!showMore)}>
                {showMore ? 'Скрыть' : 'Показать еще'}
            </ShowMoreButton>
        </DescriptionContainer>
    )
};