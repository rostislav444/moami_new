import {Areas} from "@/components/App/Order/OrderForm/NewPost/Areas";
import {Cities} from "@/components/App/Order/OrderForm/NewPost/Cities";
import {Department} from "@/components/App/Order/OrderForm/NewPost/Department/intex";
import {Button} from "@/components/Shared/Buttons";
import {H3} from "@/components/Shared/Typograpy";
import {Grid} from "@/components/Shared/Blocks";
import {Input, InputWrapper, Textarea} from "@/components/App/Order/OrderForm/style";
import {useEffect, useState} from "react";
import {useLocale} from "@/context/localeFetchWrapper";

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
                                selectedArea, setSelectedArea, selectedCity, setSelectedCity, selectDepartment,
                                setSelectDepartment, register
                            }: NewPostFormProps) => {
    const [areas, setAreas] = useState<AreaState[]>([])
    const apiFetch = useLocale()

    useEffect(() => {
        apiFetch.get('newpost/areas').then((data: any) => {
            setAreas([...data.data]);
        })
    }, [])


    return <div>
        <H3 mt={3} mb={3}>Выберите город и отделение Новой Почты</H3>
        <Grid gap={16}>
            {areas.length > 0 && <Areas {...{selectedArea, setSelectedArea, areas}} />}
            {selectedArea && <Cities {...{selectedArea, selectedCity, setSelectedCity}} />}
            {selectedCity && <Department {...{selectedCity, selectDepartment, setSelectDepartment}} />}
            {areas.length === 0 && <InputWrapper>
                <Input placeholder='Адрес / отделение доставки' type="text"
                       {...register('delivery.adress',
                           {required: false, pattern: /^\S+@\S+$/i}
                       )}
                />
            </InputWrapper>}
            <Textarea
                placeholder={'Комментарии к доставке'}
                {...register('delivery.comment')}
            />
            <Button>Подтвердить заказ</Button>
        </Grid>

    </div>


}