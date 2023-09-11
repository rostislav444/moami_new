import {Caption, Span} from "@/components/Shared/Typograpy";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";
import {Flex, FlexSpaceBetween} from "@/components/Shared/Blocks";
import {useStore} from "react-redux";
import {VariantState} from "@/interfaces/variant";
import {CategoryState} from "@/interfaces/categories";
import {setSelectSizeGrid} from "@/state/reducers/categories";


interface TopBlockProps {
    variant: VariantState;
    currentSizeGrid?: string;
    categoryIds: {
        parent: number;
        id: number;
    }
    category: CategoryState | null;
}


export const TopBlock = ({variant, currentSizeGrid, category, categoryIds}: TopBlockProps) => {
    const store = useStore()
    const sizeGrids = category ? category.size_group.grids.map(grid => grid.slug) : []

    const handleGridChange = (slug: string) => {
        if (category) {
            store.dispatch(setSelectSizeGrid({parenId: categoryIds.parent, id: categoryIds.id, sizeGrid: slug}))
        }
    }

    return (
        <FlexSpaceBetween mb={4}>
            <Caption>Код: {variant.code}</Caption>
            <Flex>
                <Span mr={2}>Размерная сетка:</Span>
                {currentSizeGrid && <DropdownSelect pt={0.5} transparent value={currentSizeGrid}
                                                    options={sizeGrids.map(grid => ({label: grid, value: grid}))}
                                                    onChange={handleGridChange}/>}
            </Flex>

        </FlexSpaceBetween>
    )
}