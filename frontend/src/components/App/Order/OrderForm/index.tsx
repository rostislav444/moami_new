import {H3} from "@/components/Shared/Typograpy";
import {Form, Textarea} from "@/components/Shared/Form";
import {useForm} from "react-hook-form";
import {selectCart} from "@/state/reducers/cart";
import {useAppSelector} from "@/state/hooks";
import {useRouter} from "next/navigation";
import {Button} from "@/components/Shared/Buttons";
import {Grid} from "@/components/Shared/Blocks";
import fetchWithLocale from "@/utils/fetchWrapper";
import {PersonalInfo} from "@/components/App/Order/OrderForm/PersonalInfo";
import {Delivery} from "@/components/App/Order/OrderForm/Delivery";


export const OrderForm = () => {
    const {register, handleSubmit, formState: {errors}, watch, setValue, unregister} = useForm();
    const api = fetchWithLocale()
    const {items} = useAppSelector(selectCart)
    const {push} = useRouter();
    const formData = watch();

    const deliveryTypesFields = {
        'newpost': ['newpost'],
        'address': ['address'],
    };

    const filterDeliveryData = (data: any, type: string) => {
        // @ts-ignore
        const keysToKeep = ['delivery_type', 'comment', ...deliveryTypesFields[type]];
        return Object.keys(data)
                     .filter(key => keysToKeep.includes(key))
                     .reduce((acc: any, key: string) => {
                         acc[key] = data[key];
                         return acc;
                     }, {});
    }

    const onSubmit = (data: any) => {
        const delivery = filterDeliveryData(data.delivery, data.delivery.delivery_type);

        const requestBody = {
            ...data,
            delivery,
            items: items.map(item => ({
                size: item.id,
                quantity: item.quantity
            }))
        };

        api.post('order/', requestBody)
           .then((response: any) => {
               if (response.status === 201) {
                   push('/order/success');
               }
           });
    }


    return <div className={'order-form'}>
        <H3 mb={3}>Заполните форму</H3>
        <Form onSubmit={handleSubmit(onSubmit)}>
            <PersonalInfo register={register} errors={errors}/>
            <Grid gap={16}>
                <Delivery {...{formData, setValue, register, errors, unregister}}/>
                <Textarea
                    placeholder={'Комментарии к доставке'}
                    {...register('delivery.comment', {required: false})}
                />
            </Grid>
            <Button type={'submit'}>Подтвердить заказ</Button>
        </Form>
    </div>
}