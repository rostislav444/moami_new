import Image from "next/image";
import {useEffect, useState} from "react";


interface ImageLoadProps {
    src: string,
    index?: number
}

export const ImageLoad = ({src, index=0}: ImageLoadProps) => {
    const [imageSrc, setImageSrc] = useState(src);

    useEffect(() => {
        fetch(src)
            .then(res => !res.ok && setImageSrc('/images/no_image_catalogue.png'))

    }, [src]);

    return <Image
        fill
        loading={index > 0 ? "lazy" : undefined}
        priority={index === 0}
        placeholder='empty'
        style={{objectFit: 'cover'}}
        src={imageSrc}
        quality={100}
        alt={'alt-' + index}
        unoptimized
    />

}