import {useEffect, useRef, useState} from "react";
import {DropdownWrapper} from "./style";
import {ValueList} from "@/components/Shared/UI/DropdownSelect/ValueList";
import {Value} from "@/components/Shared/UI/DropdownSelect/Value";
import {Error as UIError} from "@/components/Shared/Typograpy";
import {Div, MarginProps} from "@/components/Shared/Abstract";

interface OptionState {
    label: string;
    extraLabel?: string;
    value: string;
}

interface DropdownSelectProps extends MarginProps {
    register?: any;
    errors?: any;
    setValue?: any;
    value: null | string;
    name?: string;
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
    defaultValue = null,
    pt,
    pb,
    pl,
    pr,
    mt,
    mb,
    ml,
    mr,
}: DropdownSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const errorMessage = name && errors ? getErrorByName(name, errors) : null;

    if (!setValue && !onChange) {
        throw new Error('setValue or onChange must be provided');
    }

    const handleOptionClick = (option: OptionState) => {
        setValue && name && setValue(name, option.value, {shouldValidate: true});
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
            setValue && name && setValue(name, options[defaultValue].value, {shouldValidate: true});
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

    }


    return (
        <Div {...{pt, pb, pl, pr, mt, mb, ml, mr,}} style={{position: 'relative', display: 'grid'}}>
            <DropdownWrapper ref={dropdownRef}>
                {register && (
                    <select
                        style={{position: 'absolute', opacity: 0, height: 0, width: 0}}
                        {...register(name, {required: required})}
                        onFocus={handleBlur}
                        onBlur={handleBlur}
                        value={value}
                    >
                        <option value="" disabled>
                            Выберите область
                        </option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )}
                <Value
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    displayValue={displayValue}
                    placeholder={placeholder}
                    pd={pd}
                    transparent={transparent}
                />
                <ValueList
                    isOpen={isOpen}
                    name={name}
                    search={search}
                    options={options}
                    handleOptionClick={handleOptionClick}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleBlur={handleBlur}
                />
            </DropdownWrapper>
            {errorMessage && <UIError mt={2}>{errorMessage}</UIError>}
        </Div>
    );

}
