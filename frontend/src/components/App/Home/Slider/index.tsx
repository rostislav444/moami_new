import {useEffect, useState} from 'react';

import 'keen-slider/keen-slider.min.css'
import {useKeenSlider} from 'keen-slider/react'
import {useLocale} from "@/context/localeFetchWrapper";
import {ImageSlideComponent} from "@/components/App/Home/Slider/Slides/ImageSlide";
import {MiniPostSlideComponent} from "@/components/App/Home/Slider/Slides/MiniPostSlide";

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


    return slides.length > 0 && (
        <div ref={sliderRef} className="keen-slider">
            {slides.map((slide, key) => (
                <div key={key} className="keen-slider__slide">
                    {slide.image_2 ? (
                        <MiniPostSlideComponent slide={slide}/>
                    ) : (
                        <ImageSlideComponent slide={slide}/>
                    )}
                </div>
            ))}
        </div>
    );

    //
    // return slides.length > 0 && <div ref={sliderRef} className="keen-slider">
    //     {slides.map((slide, key) =>
    //         <SlideWrapper key={key} className="keen-slider__slide">
    //             <MiniPostSlide>
    //                 <div className={'title-description'}>
    //                     <H1 style={{marginTop: '10%', marginLeft: '5%', maxWidth: '70%'}} mb={4}>{slide.title}</H1>
    //                     <P style={{marginLeft: '5%'}} mb={2}>{slide.description}</P>
    //                     <Link href={'/'}>
    //                         <P color={'primary'} style={{marginLeft: '5%'}} mt={4}>Shop now</P>
    //                     </Link>
    //                 </div>
    //                 <div className={slide.image_2 ? 'image' : 'two-images'}>
    //                     <img src={slide.image} alt={slide.title}/>
    //                     {slide.image_2 && <img src={slide.image_2} alt={slide.title}/>}
    //                 </div>
    //             </MiniPostSlide>
    //         </SlideWrapper>)
    //     }
    // </div>
}