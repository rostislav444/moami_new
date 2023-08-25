import {Areas} from "@/components/App/Order/OrderForm/Delivery/NewPost/Areas";
import {Cities} from "@/components/App/Order/OrderForm/Delivery/NewPost/Cities";
import {Department} from "@/components/App/Order/OrderForm/Delivery/NewPost/Department/intex";
import {H3} from "@/components/Shared/Typograpy";
import {Grid} from "@/components/Shared/Blocks";
import {useEffect, useState} from "react";
import fetchWithLocale from "@/utils/fetchWrapper";

interface NewPostFormProps {
    formData: any
    setValue: any
    register: any
    errors: any
}

export interface AreaState {
    ref: string;
    description: string;
    description_ru: string;
}


export const NewPostForm = ({formData, setValue, register, errors}: NewPostFormProps) => {
    const api = fetchWithLocale()
    const [areas, setAreas] = useState<AreaState[]>([])
    const fields = ['area', 'city', 'department']


    useEffect(() => {
        api.get('newpost/areas').then((data: any) => {
            setAreas([...data.data]);
        })
    }, [])



    return <div>
        <H3 mt={3} mb={3}>Выберите город и отделение Новой Почты</H3>
        <Grid gap={16}>
            <Areas {...{formData, areas, setValue, register, errors}}/>
            {formData?.delivery?.area && <Cities {...{formData, setValue, register, errors}}
                                                 selectedArea={formData?.delivery?.area}
                                                 selectedCity={formData?.delivery?.city}
            />}
            {formData?.delivery?.city && <Department {...{formData, setValue, register, errors}}
                                                     selectedCity={formData?.delivery?.city}
                                                     selectDepartment={formData?.delivery?.department}
            />}
        </Grid>
    </div>
}