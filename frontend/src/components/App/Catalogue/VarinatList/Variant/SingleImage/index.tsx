import {ImageWrapper, Wrapper} from "@/components/App/Catalogue/VarinatList/Variant/style";
import Link from "next/link";
import {ImageLoad} from "@/components/App/Catalogue/VarinatList/Variant/Images/ImageLoad";
import {VariantImage} from "@/interfaces/variant";

interface SingleImageProps {
    link: string;
    image: VariantImage;
    alt: string
}


export const SingleImage = ({link, image, alt}: SingleImageProps) => {
    return <ImageWrapper>
        <Link href={link}>
            <ImageLoad src={image.thumbnails[2].image} />
        </Link>

    </ImageWrapper>
}
