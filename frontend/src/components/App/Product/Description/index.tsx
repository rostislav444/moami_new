import {DescriptionContainer, DescriptionText} from "@/components/App/Product/Description/style";


interface DescriptionProps {
    description: string
}


export const ProductDescription = ({description}: DescriptionProps) => {

    return (
        <DescriptionContainer>
            <DescriptionText>
                {description}
            </DescriptionText>
        </DescriptionContainer>
    )
};