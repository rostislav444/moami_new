import {
    DropdownOption,
    DropdownOptions,
    DropdownOptionsWrapper,
    DropdownSearch
} from "@/components/Shared/UI/DropdownSelect/style";
import {useIsMobile} from "@/components/Shared/Header/hooks";



interface OptionState {
    label: string;
    extraLabel?: string;
    value: string;
}

interface ValueListProps {
    isOpen: boolean;
    search: boolean;
    options: OptionState[];
    handleOptionClick: (option: OptionState) => void;
    searchTerm: string | null;
    setSearchTerm: (value: string) => void;
    handleBlur: (e: any) => void;
    name?: string;
    isMobile?: boolean;
}

export const ValueList = ({
    isOpen,
    search,
    name,
    options,
    handleOptionClick,
    searchTerm,
    setSearchTerm,
    handleBlur
}: ValueListProps) => {
    const isMobile = useIsMobile();

    if (!isOpen) {
        return null;
    }

    const filterOptions = () => options.filter(option =>
        option.label.toLowerCase().includes(searchTerm?.toLowerCase() || "") ||
        option.extraLabel?.toLowerCase().includes(searchTerm?.toLowerCase() || "")
    );
    return <DropdownOptionsWrapper isOpen={isOpen} isMobile={isMobile}>
        {search && <DropdownSearch
            name={name && name + '__search'}
            placeholder="Поиск"
            onFocus={handleBlur}
            onBlur={handleBlur}
            onChange={(e) => setSearchTerm(e.target.value)}
        />}
        <DropdownOptions isMobile={isMobile}>
            {filterOptions().map(option => (
                <DropdownOption key={option.value} onClick={() => handleOptionClick(option)}>
                    {option.label}
                </DropdownOption>
            ))}
        </DropdownOptions>
    </DropdownOptionsWrapper>
}