import {SizeItem, SizeList} from "@/components/App/Product/Galery/DesktopGalery/style";
import {VariantSize} from "@/interfaces/variant";


interface SizesProps {
    sizes: VariantSize[];
    selectedSize: number | null;
    setSelectedSize: (id: number) => void;
    setSizeNotSelectedError: (error: boolean) => void;
    currentSizeGrid?: string;
}


export const Sizes = ({sizes, selectedSize, setSelectedSize, setSizeNotSelectedError, currentSizeGrid}: SizesProps) => {
    const handleSelectSize = (id: number) => {
        setSelectedSize(id)
        setSizeNotSelectedError(false)
    }

    return <SizeList>
        {sizes.map((size, key) => {
                return <SizeItem active={size.stock !== 0} selected={size.id === selectedSize} key={key}
                                 onClick={() => size.stock !== 0 && handleSelectSize(size.id)}>
                    {currentSizeGrid && <span>{size.size[currentSizeGrid]}</span>}
                </SizeItem>
            }
        )}
    </SizeList>
}