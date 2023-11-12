import { useEffect, useRef, useState } from "react";
import { ImageStyled, ImageWrapper } from "@/components/App/Product/Galery/Modal/Slide/style";

export const Slide = ({ image, index }: { image: string, index: number }) => {
    const initialScale = useRef(0)
    const [scale, setScale] = useState<number>(1);
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleImageOnLoad = (image: HTMLImageElement, rect: any) => {
        const scaleValue = rect.height / image.naturalHeight
        initialScale.current = scaleValue
        setScale(scaleValue);
    };

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const img = new Image();
            img.onload = () => handleImageOnLoad(img, rect);
            img.src = image;
        }
    }, [image]);

   const handleMouseDown = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        setIsDragging(false); // Сбросить флаг перетаскивания при начале перетаскивания
        setDragStart({
            x: event.clientX - position.x,
            y: event.clientY - position.y
        });
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (dragStart.x !== 0 || dragStart.y !== 0) {
            setIsDragging(true); // Установить флаг перетаскивания
            const newX = event.clientX - dragStart.x;
            const newY = event.clientY - dragStart.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setDragStart({ x: 0, y: 0 });
    };

    const handleImageClick = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
        if (!isDragging) { // Увеличить только если не происходит перетаскивание
            setScale(prevScale => {
                if (prevScale >= initialScale.current * 4) {
                    setPosition({ x: 0, y: 0 })
                    return initialScale.current
                } else {
                    return prevScale + initialScale.current
                }
            })
        }
        setIsDragging(false); // Сбросить флаг перетаскивания после клика
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragStart]);

    return (
        <ImageWrapper ref={containerRef} className="keen-slider__slide">
            <ImageStyled
                src={image}
                scale={scale}
                position={position}
                onClick={handleImageClick}
                onMouseDown={handleMouseDown}
            />
        </ImageWrapper>
    );
};
