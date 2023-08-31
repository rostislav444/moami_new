import {variantState} from "@/interfaces/catalogue";
import {P, SpanBig} from "@/components/Shared/Typograpy";
import Link from "next/link";
import {CatalogueImage} from "@/components/App/Catalogue/VarinatList/Variant/Image";
import {OldPrice} from "@/components/App/Catalogue/VarinatList/style";

interface VariantProps {
    variant: variantState;
}

export const Variant = ({variant}: VariantProps) => {
    return (
        <div>

            <CatalogueImage link={`/product/${variant.slug}`} images={variant.images} alt={'alt'}/>

            <P bold mt={2}>
                <Link href={`/product/${variant.slug}`}>{variant.product.name}</Link>
            </P>
            <P>
                <SpanBig mr={2}>{variant.product.price} ₴</SpanBig>
                {variant.product.old_price && <OldPrice>{variant.product.old_price} ₴</OldPrice>}
            </P>
        </div>
    );
};
