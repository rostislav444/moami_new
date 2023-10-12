import {ImageWrapper, Wrapper} from "@/components/App/Catalogue/VarinatList/Variant/style";
import Link from "next/link";
import {ImageLoad} from "@/components/App/Catalogue/VarinatList/Variant/Images/ImageLoad";
import {VariantImage} from "@/interfaces/variant";
import Image from "next/image";

interface SingleImageProps {
    link: string;
    image: string;
    alt: string
}


export const SingleImage = ({link, image, alt}: SingleImageProps) => {
    return <ImageWrapper>
        <Link href={link}>
            <Image
                fill
                loading='eager'
                placeholder='blur'
                quality={90}
                style={{objectFit: 'cover'}}
                src={image}
                alt='alt'
            />
        </Link>
    </ImageWrapper>
}
