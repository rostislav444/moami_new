import {ImageWrapper}              from "@/components/App/Home/Slider/Slides/ImageSlide/style";
import Image                       from "next/image";
import {TitleDescriptionComponent} from "@/components/App/Home/Slider/Slides/style";
import {HomeSlideState}            from "@/interfaces/home/silder";



interface ImageSlideComponentProps {
    slide: HomeSlideState;
}

export const ImageSlideComponent = ({slide}: ImageSlideComponentProps) => (
    <ImageWrapper>
        <Image fill src={slide.image} alt=""/>
        <TitleDescriptionComponent absolute title={slide.title} description={slide.description} link={slide?.link}
                                   link_type={slide?.link_type}/>
    </ImageWrapper>
);