import {ArrowWrapper} from "@/components/App/Catalogue/VarinatList/Variant/Image/Arrows/style";

const arrows = {
    left: "M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z",
    right: "M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z"
}

interface ArrowProps {
    left?: boolean;
    disabled?: boolean;
    onClick?: (e: any) => void;
}

export const Arrow = ({left, disabled, onClick}: ArrowProps) => {
    return <ArrowWrapper left={left} disabled={disabled} onClick={onClick}>
        <svg
             xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d={left ? arrows['left'] : arrows['right']}/>
        </svg>
    </ArrowWrapper>
}
