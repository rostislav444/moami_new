import {useEffect, useState} from 'react';

import 'keen-slider/keen-slider.min.css'
import {useKeenSlider} from 'keen-slider/react'
import {useLocale} from "@/context/localeFetchWrapper";
import {ImageSlideComponent} from "@/components/App/Home/Slider/Slides/ImageSlide";
import {MiniPostSlideComponent} from "@/components/App/Home/Slider/Slides/MiniPostSlide";
import {SlideWrapper, Wrapper} from "@/components/App/Home/Slider/style";

export interface HomeSlideState {
    link_type: 'category' | 'collection' | 'product';
    title: string;
    description: string;
    image: string;
    image_2: string;
    link: string;
}

interface HomeSliderProps {
    slides: HomeSlideState[];
}

interface response {
    ok: boolean;
    data: HomeSlideState[];
}

export const HomeSlider = () => {
    const apiFetch = useLocale();
    const [slides, setSlides] = useState<HomeSlideState[]>([])
    const [sliderRef, instanceRef] = useKeenSlider(
        {
            slideChanged() {
                console.log('slide changed')
            },
        },
        [
            // add plugins here
        ]
    )

    useEffect(() => {
        apiFetch.get('/pages/home-slider').then(({data}: response) => setSlides(data))
    }, [])


    return slides.length > 0 ? (
        <Wrapper ref={sliderRef} className="keen-slider">
            {slides.map((slide, key) => (
                <div key={key} className="keen-slider__slide">
                    <SlideWrapper>
                        {slide.image_2 ? (
                            <MiniPostSlideComponent slide={slide}/>
                        ) : (
                            <ImageSlideComponent slide={slide}/>
                        )}
                    </SlideWrapper>

                </div>
            ))}
        </Wrapper>
    ) : null;
}