import styled from '@emotion/styled';
import {useState, useEffect, useRef} from "react";


interface OptionState {
    label: string;
    extraLabel?: string;
    value: string;
}

interface DropdownSelectProps {
    value: null | string;
    onChange: (value: string) => void;
    options: OptionState[];
    placeholder?: string | null;
    transparent?: boolean;
    search?: boolean;
    pd?: number;
}


const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: auto;
`;

const DropdownValueWrapper = styled.div<{ transparent: boolean, pd: number }>`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 32px;
  align-items: center;
  width: ${props => props.pd ? 'calc(100% - ' + props.pd * 2 * 2 + 'px)' : 'calc(100% - 8px)'};
  height: 24px;
  padding: ${props => props.pd ? props.pd * 2 + 'px' : '0 8px 0 0'};
  border: ${props => props.transparent ? 'none' : `1px solid ${props.theme.color.primary}`};
  background: ${props => props.transparent ? 'none' : '#FFFFFF'};
  cursor: pointer;

  &:hover {
    border-color: black;
  }
`;

const DropdownValue = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  сursor: pointer;
`;

const DropdownIcon = styled.img<{ isOpen: boolean, width?: number, height?: number }>`
  width: ${props => props.width ? props.width : 16}px;
  height: ${props => props.height ? props.height : 16}px;
  margin-left: 8px;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownSearch = styled.input`
  width: calc(100% - 32px);
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 400;
  color: #000000;
  border: none;
  background: ${props => props.theme.color.primaryLight}10;
  outline: none;
  :focus {
    background: ${props => props.theme.color.primaryLight}20;
  }
`;


const DropdownOptionsWrapper = styled.div<{ isOpen: boolean }>`
  position: absolute;
  width: 100%;
  height: auto;
  cursor: pointer;
  background: #FFFFFF;
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  border: 1px solid ${props => props.theme.color.primary};
    z-index: 1000;
`;

const DropdownOptions = styled.div`
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 200px;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 400;
  color: #000000;

  &:hover {
    background: ${props => props.theme.color.primary}10;
  }
`;

const DropdownPlaceholder = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${props => props.theme.color.grey};
`;


export const DropdownSelect = ({
                                   value,
                                   onChange,
                                   options,
                                   placeholder = null,
                                   transparent = false,
                                   search = false,
                                   pd = 0
                               }: DropdownSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchOption, setSearchOption] = useState<string | null>(null);
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchOption ? searchOption.toLowerCase() : '') ||
        option.extraLabel?.toLowerCase().includes(searchOption ? searchOption.toLowerCase() : '')
    )
    const ref = useRef<HTMLDivElement>(null);

    const handleOptionClick = (option: OptionState) => {
        onChange(option.value);
        setIsOpen(false);
    }

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (ref.current && !ref.current.contains(target)) {
                setIsOpen(false)
            }
        };
        if (isOpen) {
            document.addEventListener('click', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [isOpen]);

    const selectedOption = options.find(option => option.value === value);


    return (
        <DropdownWrapper ref={ref}>
            <DropdownValueWrapper transparent={transparent} pd={pd} onClick={() => setIsOpen(!isOpen)}>
                <DropdownValue>{selectedOption ? selectedOption.label : placeholder ?
                    <DropdownPlaceholder>{placeholder}</DropdownPlaceholder> : ''}</DropdownValue>
                <DropdownIcon width={12} height={12} src="/icons/down.svg" alt="arrow-down" isOpen={isOpen}/>
            </DropdownValueWrapper>
            <DropdownOptionsWrapper isOpen={isOpen}>
                {search && <DropdownSearch placeholder="Поиск" onChange={(e) => setSearchOption(e.target.value)}/>}
                <DropdownOptions>
                    {filteredOptions.map((option: OptionState) =>
                        <DropdownOption key={option.value} onClick={() => handleOptionClick(option)}>
                            {option.label}
                        </DropdownOption>
                    )}
                </DropdownOptions>
            </DropdownOptionsWrapper>
        </DropdownWrapper>
    )
}