import {useEffect, useState} from "react";
import fetchWithLocale       from "@/utils/fetchWrapper";
import {DropdownSelect}      from "@/components/Shared/UI/DropdownSelect";


interface DepartmentState {
    ref: string;
    description: string;
    description_ru: string;
}

interface Props {
    selectedCity: string | null;
    selectDepartment: string | null;
    name: string;
    register: any;
    errors: any;
    setValue: any;
}

export const Department = ({name, selectedCity, selectDepartment, setValue, register, errors}: Props) => {
    const [departments, setDepartments] = useState<DepartmentState[]>([])
    const api = fetchWithLocale()

    useEffect(() => {
        if (selectedCity) {
            api.get(`newpost/departments?city=${selectedCity}`).then(({data}: any) => {
                setDepartments(data);
            })
        }
    }, [selectedCity])

    return <DropdownSelect
        pd={8}
        name={name}
        placeholder={'Выберите отделение Новой Почты'}
        value={selectDepartment}
        setValue={setValue}
        options={departments.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
        search={true}
        register={register}
        errors={errors}
        required={'Выберите отделение Новой Почты'}
    />;

}