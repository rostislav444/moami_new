import {variantImageState} from "@/interfaces/catalogue";
import Image from "next/image";
import * as s from "@/components/App/Catalogue/VarinatList/Variant/style";
import {VariantImage} from "@/interfaces/variant";


interface CatalogueImageProps {
    image: VariantImage
    alt: string
}

export const CatalogueImage = ({image, alt}: CatalogueImageProps) => {
    const thumbnail = image.thumbnails[1]?.image

    return (
        <s.ImageWrapper>
            <div>
                <Image
                    fill
                    style={{objectFit: 'cover'}}
                    alt={alt} src={thumbnail ? thumbnail : '/images/no_image.png'}
                    unoptimized
                />
            </div>
        </s.ImageWrapper>
    );
};