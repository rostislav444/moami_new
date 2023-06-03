import {useEffect, useState} from "react";
import {DropdownSelect} from "@/components/Shared/choices";
import {useLocale} from "@/context/localeFetchWrapper";


interface CityState {
    ref: string;
    description: string;
    description_ru: string;
}


interface Props {
    selectedArea: string | null;
    selectedCity: string | null;
    setSelectedCity: (value: string) => void;
}


export const Cities = ({selectedArea, selectedCity, setSelectedCity}: Props) => {
    const [cities, setCities] = useState<CityState[]>([])
    const apiFetch = useLocale()

    useEffect(() => {
        if (selectedArea) {
            apiFetch.get(`newpost/cities?area=${selectedArea}`).then((data: any) => {
                setCities([...data]);
            })
        }
    }, [selectedArea])

    return <DropdownSelect
        pd={8}
        placeholder={'Выберите город'}
        value={selectedCity}
        onChange={value => setSelectedCity(value)}
        options={cities.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
    />
}