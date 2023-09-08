
import {VariantState} from "@/interfaces/variant";
import {PriceWrapper, Price, OldPrice} from "@/components/App/Product/Description/PriceBlock/style";


interface PriceBlockProps {
    variant: VariantState
}

export const PriceBlock = ({variant}: PriceBlockProps) => {
    return <PriceWrapper>
        <Price>{variant.product.price} ₴</Price>
        {variant.product.old_price > variant.product.price &&
            <OldPrice>{variant.product.old_price} ₴</OldPrice>}
    </PriceWrapper>
}