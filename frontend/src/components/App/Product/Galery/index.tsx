import {VariantImage} from "@/interfaces/variant";

import {Image, ImageColumn, ImageWrapper} from "@/components/App/Product/Galery/style";
import {useEffect, useState} from "react";
import {Video} from "@/components/Shared/Video";

interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
}


export const ProductImageGallery = ({product_video, video, images}: ProductImageGalleryProps) => {
    const [hasWindow, setHasWindow] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasWindow(true);
        }
    }, []);


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
                    <Image src={image.thumbnails[0].image} alt={'alt' + key}/>
                </ImageWrapper>
            )}
        </ImageColumn>
    )
}
