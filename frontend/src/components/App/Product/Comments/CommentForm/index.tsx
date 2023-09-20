import {useForm} from "react-hook-form";
import {Form, InputWrapper, Textarea} from "@/components/Shared/Form";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";
import {Button} from "@/components/Shared/Buttons";
import {Error} from "@/components/Shared/Typograpy";
import fetchWrapper from "@/utils/fetchWrapper";
import {useSession} from "next-auth/react";
import {Comment} from "@/components/App/Product/Comments";


interface CommentFormProps {
    productId: number,
    comments: Comment[],
    setComments: any,
    setFormActive: any
}


export const CommentForm = ({productId, comments, setComments, setFormActive}: CommentFormProps) => {
    const {data: session} = useSession();
    const {
        register,
        handleSubmit,
        formState: {errors},
        watch,
        setValue,
    } = useForm();

    // Create list of numbers from 1 to 5 nand return  {label: n, value: n},
    const options = Array.from({length: 5}, (_, i) => ({label: `${i + 1}`, value: `${i + 1}`})).reverse();
    const formData = watch();

    const api = fetchWrapper('uk', session?.access_token);


    const onSubmit = (data: any) => {
        const formData = {
            ...data,
            product: productId
        }
        api.post('/product/comment/', formData).then((res) => {
            setComments([...comments, res.data])
            setFormActive(false)
        })
    }


    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <DropdownSelect
                pd={6}
                placeholder='Оцените товар'
                value={formData?.rate}
                defaultValue={0}
                name='rate'
                register={register}
                errors={errors} options={options}
                setValue={setValue}
            />
            <InputWrapper>
                <Textarea placeholder='Комментарий' {...register('comment', {required: true})} />
                {errors.text && <Error>Это поле обязательно</Error>}
            </InputWrapper>
            <Button type={'submit'}>Отправить комментарий</Button>
        </Form>
    )
}