import {useState, useEffect} from 'react';

import 'keen-slider/keen-slider.min.css'
import {useKeenSlider} from 'keen-slider/react'

import {useApi} from '@/context/api';
import * as s from "@/components/App/Home/Slider/style";
import {H1, P} from "@/components/Shared/Typograpy";
import {SlideWrapper} from "@/components/App/Home/Slider/style";

import Link from 'next/link'
import fetchWithLocale from "@/utils/fetchWrapper";
import {useLocale} from "@/context/localeFetchWrapper";

interface HomeSliderState {
    type: 'category' | 'collection' | 'product';
    title: string;
    description: string;
    image: string;
    image_2: string;
    link: string;
}

interface HomeSliderProps {
    slides: HomeSliderState[];
}

interface response {
    ok: boolean;
    data: HomeSliderState[];
}

export const HomeSlider = () => {
    const [slides, setSlides] = useState<HomeSliderState[]>([])
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

    // const apiFetch = fetchWithLocale();
    const apiFetch = useLocale();

    console.log('apiFetch', apiFetch)

    useEffect(() => {
        apiFetch.get('/pages/home-slider').then(({data}: response) => {
            setSlides(data);
        })
    }, [])


    return <div ref={sliderRef} className="keen-slider">
        {slides.map((slide, key) =>
            <SlideWrapper key={key} className="keen-slider__slide">
                <s.MiniPostSlide>
                    <div className={'title-description'}>
                        <H1 style={{
                            marginTop: '10%',
                            marginLeft: '5%',
                            maxWidth: '70%'
                        }} mb={4} >{slide.title}</H1>
                        <P style={{marginLeft: '5%'}} mb={2}>{slide.description}</P>
                        <Link href={'/'}>
                            <P color={'primary'} style={{marginLeft: '5%'}} mt={4}>Shop now</P>
                        </Link>
                    </div>
                    <div className={slide.image_2 ? 'image' : 'two-images'}>
                        <img src={slide.image} alt={slide.title}/>
                        {slide.image_2 && <img src={slide.image_2} alt={slide.title}/>}
                    </div>
                </s.MiniPostSlide>
            </SlideWrapper>)
        }
    </div>
}