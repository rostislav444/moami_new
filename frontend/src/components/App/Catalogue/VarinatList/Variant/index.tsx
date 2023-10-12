import {variantState} from "@/interfaces/catalogue";
import {P, SpanBig} from "@/components/Shared/Typograpy";
import Link from "next/link";
import {OldPrice} from "@/components/App/Catalogue/VarinatList/style";
import {CataloguesImages} from "@/components/App/Catalogue/VarinatList/Variant/Images";
import {SingleImage} from "@/components/App/Catalogue/VarinatList/Variant/SingleImage";
import Image from "next/image";

interface VariantProps {
    variant: variantState;
    slider?: boolean
}

export const Variant = ({variant, slider = false}: VariantProps) => {
    const imagesProps = {
        link: `/product/${variant.slug}`,
        images: variant.images,
        alt: 'alt'
    }
    return (
        <div>
            {slider ?
                <CataloguesImages link={`/p-${variant.slug}`} images={variant.images} alt={'alt'}/> :
                <SingleImage link={`/p-${variant.slug}`} image={variant.images[0].thumbnails[1].image} alt={'alt'}/>
            }
            <P bold mt={2}>
                <Link href={`/p-${variant.slug}`}>{variant.product.name}</Link>
            </P>
            <P>
                <SpanBig mr={2}>{variant.product.price} ₴</SpanBig>
                {variant.product.old_price && <OldPrice>{variant.product.old_price} ₴</OldPrice>}
            </P>
        </div>
    );
};
