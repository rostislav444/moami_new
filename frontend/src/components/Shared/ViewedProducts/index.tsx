import {useSelector} from "react-redux";
import {selectUserViewedProductsData} from "@/state/reducers/user";
import {ViewedProductsList} from "@/components/Shared/ViewedProducts/style";
import {H2} from "@/components/Shared/Typograpy";
import {Variant} from "@/components/App/Catalogue/VarinatList/Variant";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {useKeenSlider} from "keen-slider/react";


export const ViewedProducts = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [screenWidth, setScreenWidth] = useState<number | null>(null);

    const viewedData = useSelector(selectUserViewedProductsData);
    const router = useRouter();
    const {asPath} = router;

    useEffect(() => {
        if (window !== undefined) {
            setScreenWidth(window.innerWidth);

            const handleResize = () => {
                setScreenWidth(window.innerWidth);
            }

            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            }
        }

    }, []);


        const [sliderRef, instanceRef] = useKeenSlider({
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
        slideChanged(slider) {
            setCurrentSlide(slider.track.details.rel);
        },
        created() {
            setLoaded(true);
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
