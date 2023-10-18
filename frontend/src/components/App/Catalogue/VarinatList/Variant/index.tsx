import {variantState} from "@/interfaces/catalogue";
import {P, Span, SpanBig} from "@/components/Shared/Typograpy";
import Link from "next/link";
import {OldPrice} from "@/components/App/Catalogue/VarinatList/style";
import {CataloguesImages} from "@/components/App/Catalogue/VarinatList/Variant/Images";
import {SingleImage} from "@/components/App/Catalogue/VarinatList/Variant/SingleImage";
import Image from "next/image";
import {
    VariantOldPrice,
    VariantPrice,
    VariantPriceWrapper,
    VariantTitle
} from "@/components/App/Catalogue/VarinatList/Variant/style";

interface VariantProps {
    variant: variantState;
    slider?: boolean
}

export const Variant = ({variant, slider = false}: VariantProps) => {
    const transformPrice = (price: number) => {
        return price.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
    }


    return (
        <div>
            {slider ?
                <CataloguesImages link={`/p-${variant.slug}`} images={variant.images} alt={'alt'}/> :
                <SingleImage
                    link={`/p-${variant.slug}`}
                    image={variant.images[0].thumbnails[1].image}
                    thumbnail={variant.images[0].thumbnails[3].image}
                    alt={'alt'}
                />
            }
            <VariantPriceWrapper>
                <VariantPrice>{transformPrice(variant.product.price)} ₴</VariantPrice>
                {variant.product.old_price && <VariantOldPrice>{transformPrice(variant.product.old_price)} ₴</VariantOldPrice>}
            </VariantPriceWrapper>
            <VariantTitle>
                <Link href={`/p-${variant.slug}`}>{variant.product.name}</Link>
            </VariantTitle>
        </div>
    );
};
