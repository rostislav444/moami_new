import Link                                  from 'next/link'
import Image                                 from "next/image";
import {VariantLink, VariantsLinksContainer} from "./style";
import {VariantWithImage}                    from "@/interfaces/variant";

interface VariantsLinksProps {
    variants: VariantWithImage[],
    selected: number
}

export const VariantsLinks = ({variants, selected}: VariantsLinksProps) => {
    if (variants.length === 1) {
        return null;
    }
    return (
        <VariantsLinksContainer>
            {variants.map(variant =>
                <Link href={`/product/${variant.slug}`} passHref key={variant.id}>
                    <VariantLink selected={variant.id === selected}>
                        <Image fill style={{objectFit: "cover"}} src={variant.image ? variant.image : '/images/no_image.png'} alt={variant.color} key={variant.id} unoptimized />
                    </VariantLink>
                </Link>
            )}
        </VariantsLinksContainer>
    )
}