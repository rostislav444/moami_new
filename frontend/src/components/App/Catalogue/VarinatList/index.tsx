import {variantListProps, variantState} from '@/interfaces/catalogue';
import {Variant} from '@/components/App/Catalogue/VarinatList/Variant';
import * as s from './style'
import {PreLoader} from "./style";
import {useEffect} from "react";

export const ProductsList = ({variants, preloader}: variantListProps) => {
    useEffect(() => {
        if (!preloader) {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

    }, [preloader]);

    return (
        <s.VariantsList>
            {variants.map((variant: variantState) =>
                <Variant variant={variant} key={variant.id}/>
            )}
            {preloader && <PreLoader/>}
        </s.VariantsList>
    );
};
