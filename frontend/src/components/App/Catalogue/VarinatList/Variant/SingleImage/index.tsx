import {ImageWrapper} from "@/components/App/Catalogue/VarinatList/Variant/style";
import Link from "next/link";
import Image from "next/image";

interface SingleImageProps {
    link: string;
    image: string;
    thumbnail: string;
    alt: string
}


export const SingleImage = ({link, image, thumbnail, alt}: SingleImageProps) => {
    return <ImageWrapper>
        <Link href={link}>
            <Image
                fill
                loading='eager'
                placeholder='blur'
                blurDataURL={image}
                quality={90}
                style={{objectFit: 'cover'}}
                src={image}
                alt='alt'
            />
        </Link>
    </ImageWrapper>
}
