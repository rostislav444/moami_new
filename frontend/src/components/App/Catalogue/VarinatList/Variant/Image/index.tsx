import {variantImageState} from "@/interfaces/catalogue";
import Image from "next/image";
import * as s from "@/components/App/Catalogue/VarinatList/Variant/style";


interface CatalogueImageProps {
    image: variantImageState
    alt: string
}

export const CatalogueImage = ({image, alt} : CatalogueImageProps)  => {
    return (
        <s.ImageWrapper>
            <div>
                <Image style={{objectFit: 'cover'}} fill alt={alt} src={
                   image.image ? image.image : '/images/no_image.png'
                }/>
            </div>
        </s.ImageWrapper>
    );
};