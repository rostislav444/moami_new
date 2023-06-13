import {MiniPostSlideStyled, MiniPostWrapper} from "@/components/App/Home/Slider/Slides/MiniPostSlide/style";
import {TitleDescriptionComponent} from "@/components/App/Home/Slider/Slides/style";
import {HomeSlideState} from "@/components/App/Home/Slider";


interface MiniPostSlideComponentProps {
    slide: HomeSlideState;
}

export const MiniPostSlideComponent = ({slide}: MiniPostSlideComponentProps) => (
    <MiniPostWrapper>
        <MiniPostSlideStyled>
            <TitleDescriptionComponent title={slide.title} description={slide.description} link={slide?.link}
                                       link_type={slide?.link_type}/>
            <div className="image">
                <img src={slide.image} alt={slide.title}/>
                {slide.image_2 && <img src={slide.image_2} alt={slide.title}/>}
            </div>
        </MiniPostSlideStyled>
    </MiniPostWrapper>
);
