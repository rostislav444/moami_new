import {VariantImage} from "@/interfaces/variant";

import {Image, ImageColumn, ImageWrapper, ThumbnailImageWrapper, ThumbnailVideoWrapper, ThumbnailWrapper, Wrapper} from "./style";
import {useEffect, useState} from "react";
import {useKeenSlider} from "keen-slider/react";
import {Video} from "@/components/Shared/Video";

interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
    hasWindow: boolean;
}


export const MobileProductGallery = ({hasWindow, product_video, video, images}: ProductImageGalleryProps) => {
    const [currentSlide, setCurrentSlide] = useState(0)


    const [sliderRef, instanceRef] = useKeenSlider({
        initial: 0,
        slides: {perView: 1, spacing: 15,},
        breakpoints: {
            "(min-width: 1200px)": {slides: {perView: 2, spacing: 15}},
            "(min-width: 1800px)": {slides: {perView: 3, spacing: 15,}}
        },
        slideChanged(slider) {
            setCurrentSlide(slider.track.details.rel)
        },
    })
    const [thumbnailRef, thumbnailInstanceRef] = useKeenSlider(
        {
            initial: 0,
            slides: {perView: 4, spacing: 10},
            breakpoints: {
                "(min-width: 560px)": {slides: {perView: 6, spacing: 15}},
            },
        },
        []
    )


    useEffect(() => {
        if (thumbnailInstanceRef.current) {
            thumbnailInstanceRef.current.moveToIdx(currentSlide);
        }
    }, [currentSlide]);

    const goToSlide = (index: number) => {
        console.log(index, images.length + 1)
        if (instanceRef.current) {
            instanceRef.current.moveToIdx(index);
        }
    };


    return (
        <Wrapper>
            <ImageColumn ref={sliderRef} className="keen-slider">
                {hasWindow && product_video &&
                    <div className="keen-slider__slide">
                        <ImageWrapper>
                            <Video url={product_video}/>
                        </ImageWrapper>
                    </div>
                }
                {hasWindow && video &&
                    <div className="keen-slider__slide">
                        <ImageWrapper>
                            <Video url={video}/>
                        </ImageWrapper>
                    </div>
                }
                {images.map((image, key) =>
                    <div key={key} className="keen-slider__slide">
                        <ImageWrapper>
                            <Image src={image.thumbnails[0].image} alt={'alt' + key}/>
                        </ImageWrapper>
                    </div>
                )}
            </ImageColumn>
            <ThumbnailWrapper ref={thumbnailRef} className="keen-slider">
                {product_video && (
                    <div onClick={() => goToSlide(0)}>
                        <ThumbnailVideoWrapper active={currentSlide === 0} className="keen-slider__slide">
                            <img src="/icons/video.png" alt="Video Thumbnail"/>
                        </ThumbnailVideoWrapper>
                    </div>
                )}
                {video && (
                    <div onClick={() => goToSlide(!product_video ? 0 : 1)}>
                        <ThumbnailVideoWrapper active={product_video ? currentSlide === 1 : currentSlide === 0} className="keen-slider__slide">
                            <img src="/icons/video.png" alt="Video Thumbnail"/>
                        </ThumbnailVideoWrapper>
                    </div>
                )}
                {images.map((image, key) => {
                    const slideIndex = (product_video && video ? key + 2 : product_video ? key + 1 : video ? key + 1 : key);
                    const isActive = currentSlide === slideIndex;

                    return (
                        <div key={key}>
                            <ThumbnailImageWrapper
                                active={isActive}
                                onClick={() => goToSlide(slideIndex)}
                                className="keen-slider__slide"
                            >
                                <img src={image.thumbnails[0].image} alt={`Thumbnail ${key}`}/>
                            </ThumbnailImageWrapper>
                        </div>
                    );
                })}
            </ThumbnailWrapper>
        </Wrapper>

    )
}
