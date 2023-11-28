import * as s from './style'
import {IconsWrapper, LanguageLink, LanguagesWrapper} from './style'
import {Content} from '@/styles/Blocks/Content'
import {Icon} from "@/components/Shared/Icons";
import Link from 'next/link'
import React, {useEffect, useRef, useState} from "react";
import {CartIcon} from "./CartIcon";
import {useRouter} from 'next/router';
import {Logo} from "@/components/Shared/Header/components/Logo";
import {DesktopNavMenu} from "@/components/Shared/Header/DesktopHeader/NavMenu";
import {Modal} from "@/components/Shared/UI/Modal";
import {useSession} from "next-auth/react";
import {AuthenticationForm} from "@/components/Shared/Authentication/Form";
import {useTranslation} from "next-i18next";

interface DesktopHeaderProps {
    data: any
}


export const DesktopHeader = ({data}: DesktopHeaderProps) => {
    const {t} = useTranslation('common', {useSuspense: false})
    const {data: session} = useSession();
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const localeRef = useRef<string>()
    const router = useRouter();
    const {locale, asPath, reload} = router;

    if (!data) return null

    const {categories, collections} = data

    const localeOptions = [
        {value: 'uk', link: '', label: 'Укр'},
        {value: 'ru', link: '/ru', label: 'Рус'},
        {value: 'en', link: '/en', label: 'Eng'},
    ]

    return <>
        <s.HeaderWrapper key={'header-' + locale}>
            <Content>
                <s.HeaderfirstLine>
                    <div>
                        <Icon mr={1} src='/icons/phone.svg'/>
                        <a href="tel:+380985402447">+38 (098) 540 2447</a>
                    </div>
                    <Logo/>
                    <IconsWrapper>
                        <LanguagesWrapper>
                            {localeOptions.map(({value, link, label}, index) =>
                                <LanguageLink
                                    key={index}
                                    locale={value}
                                    selected={value === locale}
                                    href={asPath}
                                >
                                    {label}
                                </LanguageLink>
                            )}
                        </LanguagesWrapper>
                        <div>
                            <Icon mr={2} ml={1} title={session?.user?.name || undefined}
                                  onClick={() => setAuthModalOpen(true)} src='/icons/user.svg'/>
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
        <Modal title={t('form.loginTitle')} isOpen={authModalOpen} onClose={setAuthModalOpen}>
            <AuthenticationForm onAuthenticated={() => setAuthModalOpen(false)}/>
        </Modal>
    </>
}