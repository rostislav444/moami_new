import {ProductContainer} from "@/components/App/Product/Galery/DesktopGalery/style";
import {useEffect, useRef} from "react";
import {VariantPageProps} from "@/interfaces/variant";

import {ProductImageGallery} from "@/components/App/Product/Galery";
import {useStore} from "react-redux";
import {addViewedProductData} from "@/state/reducers/user";
import {DescriptionBlock} from "@/components/App/Product/Description";
import {Comments} from "@/components/App/Product/Comments";


export const ProductPage = ({variant}: VariantPageProps) => {
    const ref = useRef(null)
    const store = useStore()
    const descriptionColumnRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (descriptionColumnRef.current) {
            descriptionColumnRef.current.style.height = `${descriptionColumnRef.current.scrollHeight + 8}px`
        }
        store.dispatch(addViewedProductData(variant))
    }, [descriptionColumnRef.current])


    return (<div>
            <ProductContainer ref={ref}>
                <ProductImageGallery key={variant.id} product_video={variant.product_video} video={variant.video} images={variant.images}/>
                <DescriptionBlock variant={variant}/>

            </ProductContainer>
            <Comments productId={variant.product.id}/>
        </div>

    )
}