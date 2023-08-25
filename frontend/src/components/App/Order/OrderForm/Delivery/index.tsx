import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";
import {AreaState, NewPostForm} from "@/components/App/Order/OrderForm/Delivery/NewPost";
import {AddressInfo} from "@/components/App/Order/OrderForm/Delivery/AddressInfo";
import {useEffect, useState} from "react";
import fetchWithLocale from "@/utils/fetchWrapper";
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
    return <div>
        <div>
            <H3 mt={3} mb={3}>Доставка</H3>
            <Grid gap={16}>
                <DropdownSelect
                    pd={8}
                    name='delivery.delivery_type'
                    value={formData?.delivery?.delivery_type}
                    setValue={setValue}
                    options={[
                        {
                            label: 'Новая Почта',
                            value: 'newpost'
                        },
                        {
                            label: 'Курьерская доставка (Киев)',
                            value: 'pickup'
                        },
                    ]}
                    defaultValue={0}
                />
            </Grid>
        </div>
        {formData?.delivery?.delivery_type === 'newpost' && <NewPostForm {...{formData, setValue, register, errors}} />}
        {formData?.delivery?.delivery_type === 'pickup' && <AddressInfo register={register} errors={errors}/>}
    </div>
}