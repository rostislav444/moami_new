import {FirstImageWrapper, ImagesWrapper, MiniPostWrapper, SecondImageWrapper} from "@/components/App/Home/Slider/Slides/MiniPostSlide/style";
import {TitleDescriptionComponent}                                             from "@/components/App/Home/Slider/Slides/style";
import {ImageStyled}                                                           from "@/components/App/Home/Slider/style";
import {HomeSlideState}                                                        from "@/interfaces/home/silder";


interface MiniPostSlideComponentProps {
    slide: HomeSlideState;
}

export const MiniPostSlideComponent = ({slide}: MiniPostSlideComponentProps) => (
    <MiniPostWrapper>
        <TitleDescriptionComponent absolute title={slide.title} description={slide.description} link={slide?.link}
                                   link_type={slide?.link_type}/>
        <ImagesWrapper>
            <FirstImageWrapper>
                <ImageStyled src={slide.image} alt={slide.title}/>
            </FirstImageWrapper>
            {slide.image_2 &&
                <SecondImageWrapper>
                    <ImageStyled src={slide.image_2} alt={slide.title}/>
                </SecondImageWrapper>
            }
        </ImagesWrapper>
    </MiniPostWrapper>
);
