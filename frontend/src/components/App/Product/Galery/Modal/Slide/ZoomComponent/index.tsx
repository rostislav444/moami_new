import {ImageStyled} from "@/components/App/Product/Galery/Modal/Slide/style";
import {TransformComponent} from "react-zoom-pan-pinch";


interface ZoomComponentInterface {
    image: string,
    scale: number,
    position: {
        x: number,
        y: number
    },
    mobile: boolean

}


export const ZoomComponent = ({image, scale, position, mobile}: ZoomComponentInterface) => {
    const style = mobile ? {
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 120px)',
        marginBottom: 120,
    } : {
        display: 'block',
        width: "100%",
        height: "100vh",
        // marginLeft: 120,
    }

    return <TransformComponent
        wrapperStyle={style}
    >
        <ImageStyled
            src={image}
            scale={scale}
            position={position}
        />
    </TransformComponent>
}