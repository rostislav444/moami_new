import React, {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import {signIn, signOut, useSession} from 'next-auth/react';
import {Form, Input, InputWrapper} from '@/components/Shared/Form';
import {Button} from '@/components/Shared/Buttons';
import {Error, P} from '@/components/Shared/Typograpy';
import {useTranslation} from "next-i18next";

interface AuthenticationFormProps {
    onAuthenticated?: any
}

interface FormDataState {
    email: string;
    password: string;
}

export const AuthenticationForm: React.FC<AuthenticationFormProps> = ({onAuthenticated}) => {
    const { t } = useTranslation('common', { useSuspense: false })
    const {data: session} = useSession();
    const {register, handleSubmit, formState: {errors}} = useForm<FormDataState>();
    const [error, setError] = useState(false)

    const handleCredentialsLogin: SubmitHandler<FormDataState> = ({email, password}) => {
        signIn("credentials", {redirect: false, username: email, password})
            .then(data => {
                if (data?.ok && onAuthenticated) {
                    onAuthenticated()
                } else {
                    setError(true)
                }
            })
    };

    const handleGoogleLogin = () => {
        signIn('google')
    }


    return session ? <div>
        <InputWrapper>
            <P capitalize mb={4}>{t('titles.hello')} {session?.user?.name} </P>
            <Button onClick={() => signOut()}>{t('form.logout')}</Button>
        </InputWrapper>
    </div> : <div>
        <Form onSubmit={handleSubmit(handleCredentialsLogin)}>
            {error && <Error>Ошибка входа</Error>}
            <InputWrapper>
                <Input
                    type="email"
                    placeholder='E-mail'
                    {...register('email', {
                        required: t('form.emailPlaceholder'),
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: t('form.emailError'),
                        }
                    })}
                />
                {errors.email && <Error>{errors.email.message}</Error>}
            </InputWrapper>
            <InputWrapper>
                <Input
                    type='password'
                    placeholder={t('form.password')}
                    {...register('password', {
                        required: t('form.passwordError')
                    })}
                />
                {errors.password && <Error>{errors.password.message}</Error>}
            </InputWrapper>
            <InputWrapper>
                <Button type='submit'>{t('form.login')}</Button>
            </InputWrapper>

        </Form>
        <InputWrapper mt={3}>
            <Button white onClick={handleGoogleLogin}>
                <img src={'/icons/google.jpg'}/>
                <span>{t('form.loginGoogle')}</span>
            </Button>
        </InputWrapper>
    </div>


};
