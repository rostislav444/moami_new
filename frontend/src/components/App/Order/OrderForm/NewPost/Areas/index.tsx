import {useEffect, useState} from "react";
import {useApi} from "@/context/api";
import {DropdownSelect} from "@/components/Shared/choices";
import {AreaState} from "@/components/App/Order/OrderForm/NewPost";



interface Props {
    selectedArea: string | null;
    setSelectedArea: (value: string) => void;
    areas: AreaState[];
}

export const Areas = ({selectedArea, setSelectedArea, areas}: Props) => {
    return <DropdownSelect
        pd={8}
        placeholder={'Выберите область'}
        value={selectedArea}
        onChange={value => setSelectedArea(value)}
        options={areas.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
    />
}