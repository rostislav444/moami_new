import {AreaState}      from "@/components/App/Order/OrderForm/Delivery/NewPost";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";


interface Props {
    areas: AreaState[];
    name: string;
    formData: any;
    setValue: any;
    register: any;
    errors: any;
}

export const Areas = ({formData, name, areas, register, errors, setValue}: Props) => {
    const value = name.split('.').reduce((acc, item) => acc === undefined ? undefined : acc[item], formData)

    return <DropdownSelect
        pd={8}
        name={name}
        placeholder={'Выберите область'}
        value={value}
        options={areas.map(item => ({value: item.ref, label: item.description, extraLabel: item.description_ru}))}
        search={true}
        setValue={setValue}
        register={register}
        errors={errors}
        required={'Выберите область доставки'}
    />
}