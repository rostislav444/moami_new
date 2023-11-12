import {VariantImage} from "@/interfaces/variant";

import {ImageColumn, ImageWrapper} from "@/components/App/Product/Galery/style";
import {Video} from "@/components/Shared/Video";
import Image from "next/image";
import {useState} from "react";
import {GalleryModal} from "@/components/App/Product/Galery/Modal";

interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
    hasWindow: boolean;
}


export const DesktopProductGallery = ({hasWindow, product_video, video, images}: ProductImageGalleryProps) => {
    const [showModal, setShowModal] = useState(false)
    const [initialSlide, setInitialSlide] = useState(0)

    const handleImageClick = (index: number) => {
        setShowModal(true)
        setInitialSlide(index)
    }

    return <>
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
                        placeholder='empty'
                        quality={90}
                        style={{objectFit: 'cover', backgroundColor: '#E1CFC6'}}
                        src={image.image}
                        alt={'alt' + key}
                        onClick={() => handleImageClick(key)}
                    />
                </ImageWrapper>
            )}
        </ImageColumn>
        {showModal && <GalleryModal images={images} initialSlide={initialSlide} onClose={setShowModal}/>}
    </>
}
