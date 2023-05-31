import * as s from './style'
import {IconsWrapper} from './style'
import {Content} from '@/styles/Blocks/Content'
import {Icon} from "@/components/Shared/Icons";
import Link from 'next/link'
import React from "react";
import {CartIcon} from "./CartIcon";
import {useRouter} from 'next/router';
import {DropdownSelect} from "@/components/Shared/choices";

import {useAppSelector} from "@/state/hooks";
import {selectCategories} from "@/state/reducers/categories";
import {selectCollections} from "@/state/reducers/collections";
import {DesktopNavMenu} from "@/components/Shared/Header/DesktopHeader/NavMenu";
import {Logo} from "@/components/Shared/Header/components/Logo";

export const DesktopHeader = () => {
    const router = useRouter();
    const {locale, asPath} = router;
    const {categories} = useAppSelector(selectCategories)
    const {collections} = useAppSelector(selectCollections)

    const localeOptions = [
        {value: 'uk', label: 'Укр'},
        {value: 'ru', label: 'Рус'},
        {value: 'en', label: 'Eng'},
    ]

    const handleLanguageChange = (value: string) => {
        router.push(asPath, asPath, {locale: value})
    }

    return <s.HeaderWrapper>
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
                    <Icon src='/icons/user.svg' ml={0}/>
                    <Icon src='/icons/heart.svg' ml={3} count={0}/>
                    <Link href={`/cart`}>
                        <CartIcon/>
                    </Link>
                </IconsWrapper>
            </s.HeaderfirstLine>
            <DesktopNavMenu categories={categories} collections={collections}/>
        </Content>
    </s.HeaderWrapper>
}