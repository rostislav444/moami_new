import * as s from "./style";
import React, {useState} from "react";
import {BurgerIcon, HeaderWrapper} from "./style";
import {MobileMenuPopup} from "@/components/Shared/Header/MobileHeader/NavMenu";
import {Logo} from "@/components/Shared/Header/components/Logo";
import {CartIcon} from "@/components/Shared/Header/DesktopHeader/CartIcon";
import Link from "next/link";


interface MobileHeaderProps {
    data: any
}

export const MobileHeader = ({data}: MobileHeaderProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = (e: React.SyntheticEvent) => {
        setIsOpen(!isOpen);
        // if (e.target === e.currentTarget) {
        //      setIsOpen(!isOpen);
        // }
    };

    return <>
        <HeaderWrapper>
            <BurgerIcon isOpen={isOpen} onClick={toggleMenu}>
                <div/>
                <div/>
                <div/>
            </BurgerIcon>
            <Logo mobile/>
            <div></div>
            <Link href={`/cart`}>
                <CartIcon/>
            </Link>
        </HeaderWrapper>
        {isOpen && <MobileMenuPopup toggleMenu={toggleMenu} data={data} />}
    </>
}