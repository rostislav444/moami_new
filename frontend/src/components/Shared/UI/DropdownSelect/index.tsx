import {useEffect, useRef, useState} from "react";
import {DropdownWrapper} from "./style";
import {ValueList} from "@/components/Shared/UI/DropdownSelect/ValueList";
import {Value} from "@/components/Shared/UI/DropdownSelect/Value";
import {Error as UIError} from "@/components/Shared/Typograpy";
import {useIsMobile} from "@/components/Shared/Header/hooks";

interface OptionState {
    label: string;
    extraLabel?: string;
    value: string;
}

interface DropdownSelectProps {
    register?: any;
    errors?: any;
    setValue?: any;
    value: null | string;
    name: string;
    required?: boolean | string
    onChange?: (value: string) => void;
    options: OptionState[];
    placeholder?: string | null;
    transparent?: boolean;
    search?: boolean;
    pd?: number;
    defaultValue?: null | number;
}

const getErrorByName = (name: string, errors: any) => {
    const keys = name.split('.');
    let value = null
    for (const key of keys) {
        value = value ? value[key] : errors[key];
    }
    return value?.message;
}

export const DropdownSelect = ({
    register = null,
    errors = null,
    setValue = null,
    value,
    name,
    required = false,
    onChange,
    options,
    placeholder = null,
    transparent = false,
    search = false,
    pd = 0,
    defaultValue = null
}: DropdownSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const errorMessage = name && errors ? getErrorByName(name, errors) : null;

    if (!setValue && !onChange) {
        // FATaL ERROR
        throw new Error('setValue or onChange must be provided');
    }


    const handleOptionClick = (option: OptionState) => {
        setValue && setValue(name, option.value, {shouldValidate: true});
        onChange && onChange(option.value);
        setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        if (value === undefined && defaultValue !== null) {
            console.log('set default value', options[defaultValue])
            setValue && setValue(name, options[defaultValue].value, {shouldValidate: true});
        }
    }, [setValue, defaultValue]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(option => option.value === value);
    const displayValue = selectedOption ? selectedOption.label : placeholder;

    const handleBlur = (e: any) => {
        // if (e.target.name === name + '__search' && (e.type === 'blur')) {
        //     setIsOpen(false);
        // } else {
        //     setIsOpen(true);
        // }
    }


    return <div style={{position: 'relative', display: "grid"}}>
        <DropdownWrapper ref={dropdownRef}>
            {register && <select
                style={{position: 'absolute', opacity: 0, height: 0, width: 0}}
                {...register(name, {required: required})}
                onFocus={handleBlur}
                onBlur={handleBlur}
            >
                <option value="" disabled selected={!value}>Выберите область</option>
                {options.map(option => (
                    <option key={option.value} value={option.value}
                            selected={option.value === value}>{option.label}</option>
                ))}
            </select>}
            <Value isOpen={isOpen} setIsOpen={setIsOpen} displayValue={displayValue} placeholder={placeholder} pd={pd}
                   transparent={transparent}/>
            <ValueList isOpen={isOpen} name={name} search={search} options={options}
                       handleOptionClick={handleOptionClick}
                       searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleBlur={handleBlur}/>
        </DropdownWrapper>
        {errorMessage && <UIError mt={2}>{errorMessage}</UIError>}
    </div>;
}
