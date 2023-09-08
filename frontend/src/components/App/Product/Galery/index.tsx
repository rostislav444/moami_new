import {VariantImage} from "@/interfaces/variant";
import {useEffect, useState} from "react";
import {useIsMobile} from "@/components/Shared/Header/hooks";
import {MobileProductGallery} from "@/components/App/Product/Galery/MobileGalery";
import {DesktopProductGallery} from "@/components/App/Product/Galery/DesktopGalery";


interface ProductImageGalleryProps {
    images: VariantImage[];
    product_video?: string;
    video?: string;
}


export const ProductImageGallery = ({product_video, video, images}: ProductImageGalleryProps) => {
    const [hasWindow, setHasWindow] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHasWindow(true);
        }
    }, []);


    return isMobile ? <MobileProductGallery hasWindow={hasWindow} product_video={product_video} video={video} images={images}/> :
        <DesktopProductGallery hasWindow={hasWindow} product_video={product_video} video={video} images={images}/>


}
