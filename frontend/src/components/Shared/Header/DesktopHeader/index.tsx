import * as s from './style'
import {IconsWrapper} from './style'
import {Content} from '@/styles/Blocks/Content'
import {Icon} from "@/components/Shared/Icons";
import Link from 'next/link'
import React, {useState} from "react";
import {CartIcon} from "./CartIcon";
import {useRouter} from 'next/router';
import {Logo} from "@/components/Shared/Header/components/Logo";
import {DesktopNavMenu} from "@/components/Shared/Header/DesktopHeader/NavMenu";
import {DropdownSelect} from "@/components/Shared/UI/DropdownSelect";
import {Modal} from "@/components/Shared/UI/Modal";
import {useSession} from "next-auth/react";
import {AuthenticationForm} from "@/components/Shared/Authentication/Form";

interface DesktopHeaderProps {
    data: any
}


export const DesktopHeader = ({data}: DesktopHeaderProps) => {
    const {data: session} = useSession();
    const [authModalOpen, setAuthModalOpen] = useState(false)

    const router = useRouter();
    const {locale, asPath} = router;

    if (!data) return null

    const {categories, collections} = data


    const localeOptions = [
        {value: 'uk', label: 'Укр'},
        {value: 'ru', label: 'Рус'},
        {value: 'en', label: 'Eng'},
    ]

    const handleLanguageChange = (value: string) => {
        router.push(asPath, asPath, {locale: value})
    }


    return <>
        <s.HeaderWrapper>
            <Content>
                <s.HeaderfirstLine>
                    <div>
                        <Icon mr={1} src='/icons/phone.svg'/>
                        <a href="tel:+380985402447">+38 (098) 540 2447</a>
                    </div>
                    <Logo/>
                    <IconsWrapper>
                        <DropdownSelect
                            value={locale || 'uk'}
                            transparent={true}
                            pd={0}
                            onChange={handleLanguageChange}
                            options={localeOptions}
                        />
                        <div>
                            <Icon mr={2} ml={1} title={session?.user?.name || undefined} onClick={() => setAuthModalOpen(true)} src='/icons/user.svg'/>
                        </div>
                        {/*<Icon src='/icons/heart.svg' ml={3} count={0}/>*/}
                        <Link href={`/cart`}>
                            <CartIcon/>
                        </Link>
                    </IconsWrapper>
                </s.HeaderfirstLine>
                <DesktopNavMenu categories={categories} collections={collections}/>
            </Content>
        </s.HeaderWrapper>
        <Modal title={'Вход в личный кабинет'} isOpen={authModalOpen} onClose={setAuthModalOpen}>
            <AuthenticationForm onAuthenticated={() => setAuthModalOpen(false)}/>
        </Modal>
    </>
}