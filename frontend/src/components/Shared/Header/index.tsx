import * as s from './style'
import {IconsWrapper, Logo} from './style'
import {Content} from '@/styles/Blocks/Content'
import {Icon} from "@/components/Shared/Icons";
import Link from 'next/link'
import React from "react";
import {CartIcon} from "./CartIcon";
import {NavMenu} from "@/components/Shared/Header/NavMenu";
import {languageOptions, selectLanguage} from "@/state/reducers/language";
import {useAppSelector} from "@/state/hooks";
import {DropdownSelect} from "@/components/Shared/choices";
import {updateLanguage} from "@/state/reducers/language";
import store from "@/state/store";
import {useLanguage} from "@/context/language";

export const Header = () => {
    const {language, setLanguage} = useLanguage();

    const handleLanguageChange = (value: string) => {
        setLanguage(value)
    }

    return <s.HeaderWrapper>
        <Content>
            <s.HeaderfirstLine>
                <div>
                    <Icon mr={1} src='/icons/phone.svg'/>
                    <a href="tel:+380985402447">+38 (098) 540 2447</a>
                </div>
                <s.LogoWrapper>
                    <Link href={`/`}>
                        <Logo>Moami</Logo>
                    </Link>
                </s.LogoWrapper>
                <IconsWrapper>
                    <DropdownSelect
                        value={language}
                        transparent={true}
                        pd={0}
                        onChange={handleLanguageChange}
                        options={languageOptions}
                    />
                    <Icon src='/icons/user.svg' ml={0}/>
                    <Icon src='/icons/heart.svg' ml={3} count={0}/>
                    <Link href={`/cart`}>
                        <CartIcon/>
                    </Link>
                </IconsWrapper>
            </s.HeaderfirstLine>
            <NavMenu/>
        </Content>
    </s.HeaderWrapper>
}