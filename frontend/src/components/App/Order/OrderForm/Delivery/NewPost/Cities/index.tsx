import {useEffect, useState} from "react";
import fetchWithLocale from "@/utils/fetchWrapper";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";


interface CityState {
    ref: string;
    description: string;
    description_ru: string;
}


interface Props {
    selectedArea: string;
    selectedCity: string;
    formData: any;
    name: string;
    setValue: any;
    register: any;
    errors: any;
}


export const Cities = ({name, selectedArea, selectedCity, setValue, register, errors}: Props) => {
    const [cities, setCities] = useState<CityState[]>([])
    const api = fetchWithLocale()

    useEffect(() => {
        if (selectedArea) {
            api.get(`newpost/cities?area=${selectedArea}`)
               .then(({data}: any) => setCities(data))
        }
    }, [selectedArea])

    return <DropdownSelect
        pd={8}
        name={name}
        placeholder={'Выберите город'}
        value={selectedCity}
        options={cities.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
        search={true}
        setValue={setValue}
        register={register}
        errors={errors}
        required={'Выберите город доставки'}
    />
}