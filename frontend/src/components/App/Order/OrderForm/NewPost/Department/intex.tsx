import {useEffect, useState} from "react";
import {useApi} from "@/context/api";
import {DropdownSelect} from "@/components/Shared/choices";


interface DepartmentState {
    ref: string;
    description: string;
    description_ru: string;
}

interface Props {
    selectedCity: string | null;
    selectDepartment: string | null;
    setSelectDepartment: (value: string) => void;
}

export const Department = ({selectedCity, selectDepartment, setSelectDepartment}: Props) => {
    const [departments, setDepartments] = useState<DepartmentState[]>([])
    const {apiFetch} = useApi();

    useEffect(() => {
        if (selectedCity) {
            apiFetch.get(`newpost/departments?city=${selectedCity}`).then((data: any) => {
                setDepartments([...data]);
            })
        }
    }, [selectedCity])

    return <DropdownSelect
        pd={8}
        placeholder={'Выберите отделение Новой Почты'}
        value={selectDepartment}
        onChange={value => setSelectDepartment(value)}
        options={departments.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
    />;

}