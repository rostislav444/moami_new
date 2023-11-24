import {useKeenSlider} from "keen-slider/react";
import {useState} from "react";


function getWindowDimensions() {
    const {innerWidth: width, innerHeight: height} = window;
    return {
        width,
        height
    };
}


interface GalleryModalHook {
    initialSlide: number;
    setSelected: any;
    mobile: boolean
}

export const GalleryModalHook = ({initialSlide, setSelected, mobile}: GalleryModalHook) => {
    const [{width, height}, setWindowDimensions] = useState(getWindowDimensions());
    const [sliderRef, instanceRef] = useKeenSlider({
        initial: initialSlide,
        loop: true,
        drag: false,
        slides: {perView: 1, spacing: 0,},
        slideChanged(slider) {
            setSelected(slider.track.details.rel)
        },
    })

    const [thumbnailRef, thumbnailInstanceRef] = useKeenSlider(
        {
            initial: 0,
            loop: true,
            slides: {
                origin: 'center',
                perView: mobile ? Math.ceil(width / 84) : Math.ceil(height / 220),
                spacing: 4
            },
            vertical: !mobile,
        },
        []
    )

    const handleSlideChange = (index: number) => {
        if (instanceRef.current && thumbnailInstanceRef.current) {
            thumbnailInstanceRef.current.moveToIdx(index);
            instanceRef.current.moveToIdx(index);
            setSelected(index)
        }
    }

    return {sliderRef,thumbnailRef, handleSlideChange}
}