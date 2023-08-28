import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";
import {NewPostForm} from "@/components/App/Order/OrderForm/Delivery/NewPost";
import {AddressInfo} from "@/components/App/Order/OrderForm/Delivery/AddressInfo";
import {H3} from "@/components/Shared/Typograpy";
import {Grid} from "@/components/Shared/Blocks";

interface DeliveryProps {
    formData: any;
    setValue: any;
    register: any;
    errors: any;
    unregister: any;
}


export const Delivery = ({formData, setValue, register, errors, unregister}: DeliveryProps) => {
    const deliveryOptions = [
        {
            label: 'Новая Почта',
            value: 'newpost'
        },
        {
            label: 'Курьерская доставка (Киев)',
            value: 'address'
        },
    ]

    return <div>
        <div>
            <H3 mt={3} mb={3}>Доставка</H3>
            <Grid gap={16}>
                <DropdownSelect
                    pd={8}
                    name='delivery.delivery_type'
                    value={formData?.delivery?.delivery_type}
                    setValue={setValue}
                    options={deliveryOptions}
                    defaultValue={0}
                />
            </Grid>
        </div>
        {formData?.delivery?.delivery_type === deliveryOptions[0].value && <NewPostForm {...{formData, setValue, register, errors}} />}
        {formData?.delivery?.delivery_type === deliveryOptions[1].value && <AddressInfo register={register} errors={errors}/>}
    </div>
}