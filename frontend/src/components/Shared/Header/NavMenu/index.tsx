import React, {useEffect, useState} from "react";
import {useAppSelector} from "@/state/hooks";
import {selectCategories} from "@/state/reducers/categories";
import {selectCollections} from "@/state/reducers/collections";
import {DesktopMenu} from "@/components/Shared/Header/NavMenu/DesctopMenu";
import {MobileMenu} from "@/components/Shared/Header/NavMenu/MobileMenu";
import {useIsMobile} from "@/components/Shared/Header/hooks";


export const NavMenu = () => {
    const {categories} = useAppSelector(selectCategories)
    const {collections} = useAppSelector(selectCollections)
    const isMobile = useIsMobile();

    return isMobile ?
        <MobileMenu categories={categories} collections={collections}/> :
        <DesktopMenu categories={categories} collections={collections}/>
}