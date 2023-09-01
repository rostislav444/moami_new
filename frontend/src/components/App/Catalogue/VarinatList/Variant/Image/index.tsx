import {ImageWrapper, Slide, SlidesWrapper, Wrapper} from "@/components/App/Catalogue/VarinatList/Variant/style";
import {VariantImage} from "@/interfaces/variant";
import 'keen-slider/keen-slider.min.css';
import {useKeenSlider} from "keen-slider/react";
import {Image} from "@/components/App/Product/Galery/style";
import Link from "next/link";
import {useState} from "react";
import {Arrow} from "./Arrows";
import {Pagination} from "@/components/App/Catalogue/VarinatList/Variant/Image/Pagination";

interface CatalogueImageProps {
    link: string;
    images: VariantImage[];
    alt: string;
}

export const CatalogueImage = ({link, images, alt}: CatalogueImageProps) => {
    const [imagesOptimized, setImagesOptimized] = useState(images.map((image, index) => ({
            l: image.thumbnails[1].image,
            s: image.thumbnails[3]?.image,
            activated: index === 0,  // Set the first image as activated
            alt: alt
        })
    ))
    const [currentSlide, setCurrentSlide] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const [sliderRef, instanceRef] = useKeenSlider({
        initial: 0,
        slideChanged(slider) {
            setCurrentSlide(slider.track.details.rel)

            // Set the 'activated' property for the current slide to true
            setImagesOptimized(prevImages => {
                return prevImages.map((image, index) => {
                    if (index === slider.track.details.rel) {
                        return {...image, activated: true};
                    }
                    return image;
                });
            });
        },
        created() {
            setLoaded(true)
        },
    })


    const slidesLength = instanceRef.current?.track.details.slides.length || 0

    return <>
        <Wrapper>
            <SlidesWrapper ref={sliderRef} className="keen-slider">
                {imagesOptimized.map((imageOptimized, key) =>
                    <ImageWrapper key={key} className="keen-slider__slide">
                        <Slide>
                            <Link href={link}>
                                <Image src={imageOptimized.activated ? imageOptimized.l : imageOptimized.s} alt={'alt-' + key}/>
                            </Link>
                        </Slide>
                    </ImageWrapper>
                )}

            </SlidesWrapper>
            {loaded && instanceRef.current && (
                <>
                    <Arrow left onClick={e => e.stopPropagation() || instanceRef.current?.prev()}
                           disabled={currentSlide === 0}
                    />
                    <Arrow onClick={e => e.stopPropagation() || instanceRef.current?.next()}
                           disabled={currentSlide === instanceRef.current.track.details.slides.length - 1}
                    />
                </>
            )}
            <Pagination slidesLength={slidesLength} activeSlide={currentSlide} setActiveSlide={setCurrentSlide}/>
        </Wrapper>

    </>
};


