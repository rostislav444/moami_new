import {Error} from "@/components/Shared/Typograpy";
import {Input, InputWrapper, Textarea} from "@/components/Shared/Form";


interface PersonalInfoProps {
    register: any
    errors: any
}

export const PersonalInfo = ({register, errors}: PersonalInfoProps) => {
    return <>
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
    </>
}