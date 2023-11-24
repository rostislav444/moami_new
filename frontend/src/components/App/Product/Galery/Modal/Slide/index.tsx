import {useEffect, useRef, useState} from "react";
import {ImageSlide} from "@/components/App/Product/Galery/Modal/Slide/style";
import {ReactZoomPanPinchRef, TransformWrapper} from "react-zoom-pan-pinch";
import {ZoomComponent} from "@/components/App/Product/Galery/Modal/Slide/ZoomComponent";

export const Slide = ({image, index, mobile}: { image: string, index: number, mobile: boolean }) => {
    const [initialScale, setInitialScale] = useState<number>(0);
    const initialPosition = useRef({x: 0, y: 0})
    const previousScale = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null);
    const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [step, setStep] = useState(0)


    const handleImageOnLoad = (image: HTMLImageElement, rect: any) => {
        const scaleValue = mobile ? 390 / image.naturalWidth :  rect.height / image.naturalHeight
        setStep(scaleValue)

        const pos = mobile ?
            {x: 0, y: (window.innerHeight - 120) / 2 - image.naturalHeight * scaleValue / 2} :
            {x: (window.innerWidth - 120) / 2 - image.naturalWidth * scaleValue / 2, y: 0}
        initialPosition.current = pos
        setInitialScale(scaleValue);
    };

    useEffect(() => {
        if (containerRef.current) {
            console.log(window)
            const rect = containerRef.current.getBoundingClientRect();
            const img = new Image();
            img.onload = () => handleImageOnLoad(img, rect);
            img.src = image;
        }
    }, [containerRef.current]);

    const onZoomStop = (ref: ReactZoomPanPinchRef, event: any) => {
        if (transformComponentRef.current && initialScale) {
            const {instance: {transformState: {scale}}} = transformComponentRef.current
            previousScale.current = scale
        }
    }

    const setTransform = (x: number, y: number, scale: number) => {
        if (previousScale.current && transformComponentRef.current) {
            const previous = Math.ceil(previousScale.current / initialScale * 10)
            if (previous == 60) {
                setStep(-initialScale * 6)
            }
            if (previous <= 12) {
                setStep(initialScale)
            }
        }
        return `translate(${x}px, ${y}px) scale(${scale})`
    }


    return (
        <ImageSlide ref={containerRef} className="keen-slider__slide">
            {initialScale !== 0 ? <TransformWrapper
                initialScale={initialScale}
                initialPositionX={initialPosition.current.x}
                initialPositionY={initialPosition.current.y}
                ref={transformComponentRef}
                doubleClick={{
                    step: step * 2
                }}
                maxScale={initialScale * 6}
                minScale={initialScale}
                zoomAnimation={{
                    disabled: true
                }}
                onZoomStop={onZoomStop}
                customTransform={setTransform}
            >
                <ZoomComponent image={image} position={position} scale={initialScale} mobile={mobile}/>
            </TransformWrapper> : null}

        </ImageSlide>
    );
};
