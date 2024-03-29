import {ImageWrapper, Slide, SlidesWrapper, Wrapper} from "@/components/App/Catalogue/VarinatList/Variant/style";
import {VariantImage} from "@/interfaces/variant";
import 'keen-slider/keen-slider.min.css';
import {useKeenSlider} from "keen-slider/react";
import Link from "next/link";
import {useState} from "react";
import {Arrow} from "./Arrows";
import {Pagination} from "@/components/App/Catalogue/VarinatList/Variant/Images/Pagination";
import {ImageLoad} from "@/components/App/Catalogue/VarinatList/Variant/Images/ImageLoad";

interface CatalogueImageProps {
    link: string;
    images: VariantImage[];
    alt: string;
}

export const CataloguesImages = ({link, images, alt}: CatalogueImageProps) => {
    const [imagesOptimized, setImagesOptimized] = useState(images.map((image, index) => ({
            l: image.thumbnails[1]?.image,
            s: image.thumbnails[3]?.image,
            activated: index === 0,
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
                                <ImageLoad index={key} src={imageOptimized.l} />
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


