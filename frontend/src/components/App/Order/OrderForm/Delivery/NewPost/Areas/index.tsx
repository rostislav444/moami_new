import {AreaState}      from "@/components/App/Order/OrderForm/Delivery/NewPost";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";


interface Props {
    areas: AreaState[];
    formData: any;
    setValue: any;
    register: any;
    errors: any;
}

export const Areas = ({formData, areas, register, errors, setValue}: Props) => {
    return <DropdownSelect
        pd={8}
        name={'delivery.area'}
        placeholder={'Выберите область'}
        value={formData?.delivery?.area}
        options={areas.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
        search={true}
        setValue={setValue}
        register={register}
        errors={errors}
        required={'Выберите область доставки'}
    />
}