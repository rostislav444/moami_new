import {
    DropdownIcon,
    DropdownPlaceholder,
    DropdownValue,
    DropdownValueWrapper
} from "@/components/Shared/UI/DropdownSelect/style";

interface ValueProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    displayValue: string | null;
    placeholder: string | null;
    transparent?: boolean;
    pd?: number;
}


export const Value = ({isOpen, setIsOpen, displayValue, placeholder, transparent=false, pd=0}: ValueProps) => {
    return (
        <DropdownValueWrapper transparent={transparent} pd={pd} onClick={() => setIsOpen(!isOpen)}>
            <DropdownValue>
                {displayValue || <DropdownPlaceholder>{placeholder}</DropdownPlaceholder>}
            </DropdownValue>
            <DropdownIcon isOpen={isOpen} src="/icons/down.svg" alt="arrow-down"/>
        </DropdownValueWrapper>
    )
}