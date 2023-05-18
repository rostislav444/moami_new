import Link from "next/link";
import React from "react";
import {LogoSpan, LogoWrapper} from "@/components/Shared/Header/components/Logo/style";


export const Logo = ({mobile = false}: {mobile?: boolean}) => {
    return <LogoWrapper mobile={mobile}>
        <Link href={`/`}>
            <LogoSpan mobile={mobile}>Moami</LogoSpan>
        </Link>
    </LogoWrapper>
}