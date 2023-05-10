import {Areas} from "@/components/App/Order/OrderForm/NewPost/Areas";
import {Cities} from "@/components/App/Order/OrderForm/NewPost/Cities";
import {Department} from "@/components/App/Order/OrderForm/NewPost/Department/intex";
import {Button} from "@/components/Shared/Buttons";
import {H3} from "@/components/Shared/Typograpy";
import {Block, Grid} from "@/components/Shared/Blocks";
import {Textarea} from "@/components/App/Order/OrderForm/style";
import {useEffect, useState} from "react";
import {useApi} from "@/context/api";

interface NewPostFormProps {
    selectedArea: string | null
    setSelectedArea: (value: string | null) => void
    selectedCity: string | null
    setSelectedCity: (value: string | null) => void
    selectDepartment: string | null
    setSelectDepartment: (value: string | null) => void
    register: any
}

export interface AreaState {
    ref: string;
    description: string;
    description_ru: string;
}


export const NewPostForm = ({
                                selectedArea,
                                setSelectedArea,
                                selectedCity,
                                setSelectedCity,
                                selectDepartment,
                                setSelectDepartment,
                                register
                            }: NewPostFormProps) => {
    const [areas, setAreas] = useState<AreaState[]>([])
    const {apiFetch} = useApi();

    useEffect(() => {
        apiFetch.get('newpost/areas').then((data: any) => {
            setAreas([...data]);
        })
    }, [])


    return <div>
        <H3 mt={3} mb={3}>Выберите город и отделение Новой Почты</H3>
        <Grid gap={16}>
            <Areas {...{selectedArea, setSelectedArea, areas}} />
            {selectedArea && <Cities {...{selectedArea, selectedCity, setSelectedCity}} />}
            {selectedCity && <Department {...{selectedCity, selectDepartment, setSelectDepartment}} />}
            <Textarea
                placeholder={'Комментарии к доставке'}
                {...register('delivery.comment')}
            />
            <Button>Подтвердить заказ</Button>
        </Grid>

    </div>


}