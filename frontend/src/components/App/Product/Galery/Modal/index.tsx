import {VariantImage} from "@/interfaces/variant";
import {
    CloseButton,
    Gallery, GalleryWrapper,
    Thumbnail,
    ThumbnailsList,
    ThumbnailsWrapper,
    Wrapper
} from "@/components/App/Product/Galery/Modal/style";
import {useState} from "react";
import {Slide} from "@/components/App/Product/Galery/Modal/Slide";
import {GalleryModalHook} from "@/components/App/Product/Galery/Modal/hook";


interface GalleryModalProps {
    images: VariantImage[],
    initialSlide: number,
    onClose: any,
    mobile?: boolean
}


export const GalleryModal = ({images, initialSlide = 0, onClose, mobile = false}: GalleryModalProps) => {
    const [selected, setSelected] = useState(initialSlide)
    const {sliderRef, thumbnailRef, handleSlideChange} = GalleryModalHook({initialSlide, setSelected, mobile})
    const thumbnails = images.map(image => image.thumbnails[3].image)

    return <Wrapper mobile={mobile}>
        <ThumbnailsWrapper mobile={mobile}>
            <ThumbnailsList ref={thumbnailRef} mobile={mobile} className="keen-slider">
                {thumbnails.map((thumbnail, i) =>
                    <Thumbnail
                        className="keen-slider__slide"
                        mobile={mobile}
                        key={i}
                        selected={selected == i} onClick={() => handleSlideChange(i)}
                    >
                        <img src={thumbnail}/>
                    </Thumbnail>
                )}
            </ThumbnailsList>
        </ThumbnailsWrapper>
        <GalleryWrapper mobile={mobile}>
            <Gallery ref={sliderRef} className="keen-slider">{
                images.map((image, i) =>
                    <Slide key={i} image={image.image} index={i} mobile={mobile}/>
                )
            }</Gallery>
        </GalleryWrapper>
        <CloseButton onClick={() => onClose(false)}>
            <img src='/icons/close.svg'/>
        </CloseButton>
    </Wrapper>


}