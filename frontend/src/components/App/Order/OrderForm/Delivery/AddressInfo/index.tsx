import {Input, InputWrapper} from "@/components/App/Order/OrderForm/style";
import {Error, H3} from "@/components/Shared/Typograpy";
import {Grid} from "@/components/Shared/Blocks";


interface AddressInfoProps {
    register: any
    errors: any
}

export const AddressInfo = ({register, errors}: AddressInfoProps) => {
    return (
        <div>
            <H3 mt={3} mb={3}>Введите адрес доставки</H3>
            <Grid gap={16}>
                <InputWrapper>
                    <Input
                        error={!!errors.adress}
                        placeholder='Адрес доставки'
                        type="text" {...register('delivery.address.address', {required: true})}
                    />
                    {errors.father_name && <Error>Введите отчество</Error>}
                </InputWrapper>
            </Grid>
        </div>
    )
}