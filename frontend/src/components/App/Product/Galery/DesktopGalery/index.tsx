import {VariantImage} from "@/interfaces/variant";

import {ImageColumn, ImageWrapper} from "@/components/App/Product/Galery/style";
import {Video} from "@/components/Shared/Video";
import Image from "next/image";

interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
    hasWindow: boolean;
}


export const DesktopProductGallery = ({hasWindow, product_video, video, images}: ProductImageGalleryProps) => {
    return (
        <ImageColumn>
            {hasWindow && product_video &&
                <ImageWrapper>
                    <Video url={product_video}/>
                </ImageWrapper>
            }
            {hasWindow && video &&
                <ImageWrapper>
                    <Video url={video}/>
                </ImageWrapper>
            }
            {images.map((image, key) =>
                <ImageWrapper key={key}>
                    <Image
                        fill
                        loading='eager'
                        placeholder='blur'
                        quality={90}
                        style={{objectFit: 'cover'}}
                        src={image.image}
                        blurDataURL={image.thumbnails[3].image}
                        alt={'alt' + key}
                    />
                </ImageWrapper>
            )}
        </ImageColumn>
    )
}
