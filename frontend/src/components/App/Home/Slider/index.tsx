import 'keen-slider/keen-slider.min.css'
import {useKeenSlider}          from 'keen-slider/react'
import {ImageSlideComponent}    from "@/components/App/Home/Slider/Slides/ImageSlide";
import {MiniPostSlideComponent} from "@/components/App/Home/Slider/Slides/MiniPostSlide";
import {SlideWrapper, Wrapper}  from "@/components/App/Home/Slider/style";
import {HomeSliderProps}        from "@/interfaces/home/silder";


export const HomeSlider = ({slides}: HomeSliderProps) => {
    const [sliderRef, instanceRef] = useKeenSlider({
            slideChanged() {

            },
        },
        [
            // add plugins here
        ]
    )

    if (slides.length === 0) {
        return null;
    }

    return <Wrapper ref={sliderRef} className="keen-slider">
        {slides.map((slide, key) => (
            <div key={key} className="keen-slider__slide">
                <SlideWrapper>
                    {slide.image_2 ? (<MiniPostSlideComponent slide={slide}/>) : (<ImageSlideComponent slide={slide}/>)}
                </SlideWrapper>
            </div>
        ))}
    </Wrapper>

}