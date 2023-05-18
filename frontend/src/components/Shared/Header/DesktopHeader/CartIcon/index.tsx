import React from "react";
import {Icon} from "@/components/Shared/Icons";
import {useAppSelector} from "@/state/hooks";
import {selectCart} from "@/state/reducers/cart";

export const CartIcon  = () => {
    const {quantity} = useAppSelector(selectCart);
    return <Icon src='/icons/cart.svg' ml={3} count={quantity}/>;
};
