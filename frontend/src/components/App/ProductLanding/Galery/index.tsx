import {GalleryImageWrapper, GalleryWrapper} from "@/components/App/ProductLanding/Galery/style";
import {H1} from "@/components/Shared/Typograpy";


export const Gallery = ({images}: { images: string[] }) => {
    return <div>
        <GalleryWrapper>
            {images.map((image, index) => (
                <GalleryImageWrapper key={index}>
                    <img key={index} src={image} alt=""/>
                </GalleryImageWrapper>
            ))}
        </GalleryWrapper>
    </div>


}