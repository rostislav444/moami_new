import {useForm} from "react-hook-form";
import {PersonalInfo} from "@/components/App/Order/OrderForm/PersonalInfo";
import {FromWrapper} from "@/components/App/ProductLanding/Form/styles";
import {H1} from "@/components/Shared/Typograpy";



export const Form = () => {
    const {
        register,
        handleSubmit,
        formState: {errors},
        watch,
        setValue,
        unregister
    } = useForm();

    const onSubmit = (data: any) => {
        console.log(data)
    }

    return <form onSubmit={handleSubmit(onSubmit)}>

        <FromWrapper>
             <H1 center mt={2} mb={4}>Оформить заказ</H1>
            <PersonalInfo register={register} errors={errors}/>
        </FromWrapper>

    </form>
}