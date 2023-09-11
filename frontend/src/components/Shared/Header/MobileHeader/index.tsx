import {BurgerIcon, HeaderWrapper, ProfileIconWrapper} from "./style";
import React, {useState} from "react";
import {MobileMenuPopup} from "@/components/Shared/Header/MobileHeader/NavMenu";
import {Logo} from "@/components/Shared/Header/components/Logo";
import {CartIcon} from "@/components/Shared/Header/DesktopHeader/CartIcon";
import Link from "next/link";
import {Icon} from "@/components/Shared/Icons";
import {useSession} from "next-auth/react";
import {AuthenticationForm} from "@/components/Shared/Authentication/Form";
import {Modal} from "@/components/Shared/UI/Modal";


interface MobileHeaderProps {
    data: any
}

export const MobileHeader = ({data}: MobileHeaderProps) => {
    const {data: session} = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false)

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
            <ProfileIconWrapper>
                <div onClick={() => setAuthModalOpen(true)}>
                    <Icon title={session?.user?.name || 'Ростислав'} src='/icons/user.svg' ml={0}/>
                </div>
            </ProfileIconWrapper>
            <Link href={`/cart`}>
                <CartIcon/>
            </Link>
        </HeaderWrapper>
        {isOpen && <MobileMenuPopup toggleMenu={toggleMenu} data={data}/>}
        <Modal title={'Вход в личный кабинет'} isOpen={authModalOpen} onClose={setAuthModalOpen}>
            <AuthenticationForm onAuthenticated={() => setAuthModalOpen(false)}/>
        </Modal>
    </>
}