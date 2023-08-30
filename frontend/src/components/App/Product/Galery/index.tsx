import {VariantImage} from "@/interfaces/variant";

import {Image, ImageColumn, ImageWrapper, Video} from "@/components/App/Product/Galery/style";

interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
}


export const ProductImageGallery = ({product_video, video, images}: ProductImageGalleryProps) => {
    return (
        <ImageColumn>
            {product_video &&
                <ImageWrapper>
                    <Video controls>
                        <source src={product_video} type="video/mp4"/>
                    </Video>
                </ImageWrapper>
            }
            {video &&
                <ImageWrapper>
                    <Video controls>
                        <source src={video} type="video/mp4"/>
                    </Video>
                </ImageWrapper>
            }
            {images.map((image, key) =>
                <ImageWrapper key={key}>
                    <Image src={image.thumbnails[0].image} alt={'alt' + key}/>
                </ImageWrapper>
            )}
        </ImageColumn>
    )
}
