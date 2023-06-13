import {VariantImage} from "@/interfaces/variant";

import {Image, ImageColumn, ImageWrapper} from "@/components/App/Product/Galery/style";

interface ProductImageGalleryProps {
    images: VariantImage[];
}


export const ProductImageGallery = ({images}: ProductImageGalleryProps) => {
    return (
        <ImageColumn>
            {images.map((image, key) =>
                <ImageWrapper key={key}>
                    <Image src={image.thumbnails[0].image} alt={'alt' + key} />
                </ImageWrapper>
            )}
        </ImageColumn>
    )
}
