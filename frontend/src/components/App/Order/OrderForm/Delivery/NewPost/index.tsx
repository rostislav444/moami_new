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

    useEffect(() => {
        api.get('newpost/areas')
           .then((data: any) => {
               setAreas([...data.data]);
           })
    }, [])


    return <div>
        <H3 mt={3} mb={3}>Выберите город и отделение Новой Почты</H3>
        <Grid gap={16}>
            <Areas name={'delivery.newpost.area'} {...{formData, areas, setValue, register, errors}}/>
            {formData?.delivery?.newpost?.area &&
                <Cities name={'delivery.newpost.city'}
                        selectedArea={formData?.delivery?.newpost?.area}
                        selectedCity={formData?.delivery?.newpost?.city}
                        {...{formData, setValue, register, errors}}
                />
            }
            {formData?.delivery?.newpost?.city &&
                <Department
                    name={'delivery.newpost.department'}
                    selectedCity={formData?.delivery?.newpost?.city}
                    selectDepartment={formData?.delivery?.newpost?.department}
                    {...{formData, setValue, register, errors}}
                />
            }
        </Grid>
    </div>
}