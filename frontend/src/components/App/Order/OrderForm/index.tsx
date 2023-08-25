import {H3} from "@/components/Shared/Typograpy";
import {Form, Textarea} from "@/components/App/Order/OrderForm/style";
import {useEffect, useState} from "react";

import {useForm} from "react-hook-form";

import {selectCart} from "@/state/reducers/cart";
import {useAppSelector} from "@/state/hooks";

import {AreaState, NewPostForm} from "@/components/App/Order/OrderForm/Delivery/NewPost"

import {useRouter} from "next/navigation";
import {Button} from "@/components/Shared/Buttons";
import {Grid} from "@/components/Shared/Blocks";
import fetchWithLocale from "@/utils/fetchWrapper";
import {PersonalInfo} from "@/components/App/Order/OrderForm/PersonalInfo";
import {AddressInfo} from "@/components/App/Order/OrderForm/Delivery/AddressInfo";
import {Delivery} from "@/components/App/Order/OrderForm/Delivery";


export const OrderForm = () => {


    const {register, handleSubmit, formState: {errors}, watch, setValue, unregister} = useForm();
    const api = fetchWithLocale()
    const {items} = useAppSelector(selectCart)

    const {push} = useRouter();


    const formData = watch();

    // console.log(formData)


    const onSubmit = (data: any) => {
        const requestBody = {
            ...data,
            items: items.map(item => ({
                size: item.id,
                quantity: item.quantity
            }))
        }

        api.post('order/', requestBody).then((data: any) => {
            if (data.status === 201) {
                push('/order/success')
            }
        })
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