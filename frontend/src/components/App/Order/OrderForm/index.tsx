import {Error, H3} from "@/components/Shared/Typograpy";
import {Form, Input, InputWrapper, StyledInputMask, Textarea} from "@/components/App/Order/OrderForm/style";
import {useState} from "react";

import {useForm} from "react-hook-form";

import {selectCart} from "@/state/reducers/cart";
import {useAppSelector} from "@/state/hooks";

import {NewPostForm} from "@/components/App/Order/OrderForm/NewPost"
import {useLocale} from "@/context/localeFetchWrapper";


export const OrderForm = () => {
    const [selectedArea, setSelectedArea] = useState<string | null>(null)
    const [selectedCity, setSelectedCity] = useState<string | null>(null)
    const [selectDepartment, setSelectDepartment] = useState<string | null>(null)

    const {register, handleSubmit, formState: {errors}} = useForm();
    const apiFetch = useLocale()
    const {items} = useAppSelector(selectCart)


    const onSubmit = (data: any) => {
        const requestBody = {
            first_name: data.first_name,
            last_name: data.last_name,
            father_name: data.father_name,
            phone: data.phone,
            email: data?.email,
            delivery: {
                delivery_type: 'newpost',
                comment: data?.delivery?.comment,
                newpost: selectedArea ? {
                    area: selectedArea,
                    city: selectedCity,
                    department: selectDepartment,
                } : undefined
            },
            items: items.map(item => ({
                size: item.id,
                quantity: item.quantity
            }))
        }


        apiFetch.post('order/', requestBody).then((data: any) => {
            console.log(data)
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
                <StyledInputMask
                    mask='+38 (099) 999-99-99'
                    placeholder={'Телефон *'}
                    {...register('phone', {
                        required: true,
                        pattern: /^\+38 \(\d{3}\) \d{3}-\d{2}-\d{2}$/
                    })}
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

            <NewPostForm {...{
                selectedArea,
                setSelectedArea,
                selectedCity,
                setSelectedCity,
                selectDepartment,
                setSelectDepartment,
                register
            }} />
        </Form>
    </div>
}