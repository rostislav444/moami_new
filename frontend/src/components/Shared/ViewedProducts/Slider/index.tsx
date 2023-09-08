import {useRouter} from "next/router";
import {useKeenSlider} from "keen-slider/react";
import {H2} from "@/components/Shared/Typograpy";
import {ViewedProductsList} from "@/components/Shared/ViewedProducts/style";
import {Variant} from "@/components/App/Catalogue/VarinatList/Variant";
import {variantState} from "@/interfaces/catalogue";


interface SliderProps {
    viewedData: variantState[];
}


export const Slider = ({viewedData}: SliderProps) => {
    const router = useRouter();
    const {asPath} = router;


    const [sliderRef] = useKeenSlider({
        initial: 0,
        slides: {
            perView: 2,
            spacing: 15,
        },
        breakpoints: {
            "(min-width: 560px)": {slides: {perView: 3, spacing: 15}},
            "(min-width: 960px)": {slides: {perView: 4, spacing: 15}},
            "(min-width: 1200px)": {slides: {perView: 6, spacing: 15}},
            "(min-width: 1800px)": {slides: {perView: 8, spacing: 15,}}
        },
    });


    if (viewedData.length === 0 || asPath.startsWith('/cart') || asPath.startsWith('/order')) return null;

    return (
        <div>
            <H2 mt={12} mb={8}>Вы смотрели ({viewedData.length})</H2>
            <ViewedProductsList ref={sliderRef} className="keen-slider">
                {viewedData.map(variant =>
                    <div key={variant.id} className="keen-slider__slide">
                        <Variant slider={false} variant={variant}/>
                    </div>
                )}
            </ViewedProductsList>
        </div>
    );
}