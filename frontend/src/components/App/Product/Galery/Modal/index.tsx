import {VariantImage} from "@/interfaces/variant";
import {
    CloseButton,
    Gallery,
    Outer,
    Thumbnail,
    ThumbnailsList,
    ThumbnailsWrapper,
    Wrapper
} from "@/components/App/Product/Galery/Modal/style";
import {useState} from "react";
import {useKeenSlider} from "keen-slider/react";
import {Slide} from "@/components/App/Product/Galery/Modal/Slide";


interface GalleryModalProps {
    images: VariantImage[],
    initialSlide: number,
    onClose: any
}


export const GalleryModal = ({images, initialSlide = 0, onClose}: GalleryModalProps) => {
    const [selected, setSelected] = useState(initialSlide)

    const [sliderRef, instanceRef] = useKeenSlider({
        initial: initialSlide,
        drag: false,
        slides: {perView: 1, spacing: 15,},
        slideChanged(slider) {
            setSelected(slider.track.details.rel)
        },
    })

    const thumbnails = images.map(image => image.thumbnails[3].image)

    const handleSlideChange = (index: number) => {
        if (instanceRef.current) {
            instanceRef.current.moveToIdx(index);
            setSelected(index)
        }
    }

    return <Outer>
        <Wrapper>
            <ThumbnailsWrapper>
                <ThumbnailsList>
                    {thumbnails.map((thumbnail, i) =>
                        <Thumbnail key={i} selected={selected == i} onClick={() => handleSlideChange(i)}>
                            <img src={thumbnail}/>
                        </Thumbnail>
                    )}
                </ThumbnailsList>
            </ThumbnailsWrapper>
            <Gallery ref={sliderRef} className="keen-slider">{
                images.map((image, i) =>
                    <Slide key={i} image={image.image} index={i}/>
                )
            }</Gallery>
        </Wrapper>
        <CloseButton onClick={() => onClose(false)}>
            <img src='/icons/close.svg' />
        </CloseButton>

    </Outer>
}