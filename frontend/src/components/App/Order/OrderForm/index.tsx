import {Error, H3} from "@/components/Shared/Typograpy";
import {Form, Input, InputWrapper, StyledInputMask, Textarea} from "@/components/App/Order/OrderForm/style";
import {useEffect, useState} from "react";

import {useForm} from "react-hook-form";

import {selectCart} from "@/state/reducers/cart";
import {useAppSelector} from "@/state/hooks";

import {AreaState, NewPostForm} from "@/components/App/Order/OrderForm/NewPost"
import {useLocale} from "@/context/localeFetchWrapper";
import {useRouter} from "next/navigation";
import {Button} from "@/components/Shared/Buttons";
import {Grid} from "@/components/Shared/Blocks";


export const OrderForm = () => {
    const [selectedArea, setSelectedArea] = useState<string | null>(null)
    const [selectedCity, setSelectedCity] = useState<string | null>(null)
    const [selectDepartment, setSelectDepartment] = useState<string | null>(null)

    const {register, handleSubmit, formState: {errors}, watch} = useForm();
    const apiFetch = useLocale()
    const {items} = useAppSelector(selectCart)

    const {push} = useRouter();


    const [areas, setAreas] = useState<AreaState[]>([])


    useEffect(() => {
        apiFetch.get('newpost/areas').then((data: any) => {
            setAreas([...data.data]);
        })
    }, [])


    const formData = watch();


    const onSubmit = (data: any) => {
        const requestBody = {
            first_name: data.first_name,
            last_name: data.last_name,
            father_name: data.father_name,
            phone: data.phone,
            email: data?.email,
            delivery: {
                delivery_type: 'other',
                address: data?.delivery?.address,
                comment: data?.delivery?.comment,
            },
            items: items.map(item => ({
                size: item.id,
                quantity: item.quantity
            }))


        }

        // if (data.delivery.type === 'newpost') {
        //     //  delivery: {
        //     //     delivery_type: 'newpost',
        //     //     comment: data?.delivery?.comment,
        //     //     newpost: selectedArea ? {
        //     //         area: selectedArea,
        //     //         city: selectedCity,
        //     //         department: selectDepartment,
        //     //     } : undefined
        //     // },
        // }

        console.log(requestBody)


        apiFetch.post('order/', requestBody).then((data: any) => {
            push('/order/success')
        })
    }


    return <div className={'order-form'}>
        <H3 mb={3}>Заполните форму</H3>
        <Form onSubmit={handleSubmit(onSubmit)}>
            <InputWrapper>
                <Input
                    error={!!errors.first_name}
                    placeholder='Имя *'
                    type="text"
                    {...register('first_name', {required: true})}
                />
                {errors.first_name && <Error>Введите имя</Error>}
            </InputWrapper>
            <InputWrapper>
                <Input
                    error={!!errors.last_name}
                    placeholder='Фамилия *'
                    type="text" {...register('last_name', {required: true})}
                />
                {errors.last_name && <Error>Введите фамилию</Error>}
            </InputWrapper>
            <InputWrapper>
                <Input
                    error={!!errors.father_name}
                    placeholder='Отчество'
                    type="text" {...register('father_name', {required: true})}
                />
                {errors.father_name && <Error>Введите отчество</Error>}
            </InputWrapper>
            <InputWrapper>
                <Input
                    error={!!errors.phone}
                    placeholder='Номер телефона'
                    type="text" {...register('phone', {required: true})}
                />

                {errors.phone && <Error>Введите номер телефона</Error>}
            </InputWrapper>
            <InputWrapper>
                <Input placeholder='E-mail' type="email"
                       {...register('email',
                           {required: false, pattern: /^\S+@\S+$/i}
                       )}
                />
            </InputWrapper>

            <InputWrapper>
                <Textarea placeholder='Комментарий к заказу' {...register('comment', {required: false})} />
            </InputWrapper>

            <H3 mt={3} mb={3}>Выберите город и отделение Новой Почты</H3>
            <Grid gap={16}>
                <InputWrapper>
                    <Input
                        error={!!errors.adress}
                        placeholder='adress'
                        type="text" {...register('delivery.address', {required: true})}
                    />
                    {errors.father_name && <Error>Введите отчество</Error>}
                </InputWrapper>
                <Textarea
                    placeholder={'Комментарии к доставке'}
                    {...register('delivery.comment', {required: false})}
                />
            </Grid>
            <Button type={'submit'}>Подтвердить заказ</Button>
        </Form>
    </div>
}