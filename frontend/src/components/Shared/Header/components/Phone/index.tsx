import {Icon} from "@/components/Shared/Icons";
import React from "react";
import {Wrapper} from "@/components/Shared/Header/components/Phone/style";


export const Phone = () => {
    return <Wrapper>
        <Icon mr={1} src='/icons/phone.svg'/>
        <a href="tel:+380985402447">+38 (098) 540 2447</a>
    </Wrapper>
}