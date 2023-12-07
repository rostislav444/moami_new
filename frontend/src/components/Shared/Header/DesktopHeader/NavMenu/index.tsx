import * as s from "./style"
import Link from "next/link";
import {Span} from "@/components/Shared/Typograpy";
import React from "react";
import {CategoryState} from "@/interfaces/categories";
import {useRouter} from "next/router";
import {useTranslation} from "next-i18next";


interface Props {
    categories: CategoryState[];
}

export const DesktopNavMenu = ({categories}: Props) => {
    const router = useRouter();
    const {locale} = router;

    return <s.NavWrapper>
        <s.NavUl>
            {categories.map((category) =>
                <s.NavMenuItem key={category.id}>
                    <Link locale={locale} href={`/${category.slug}`}>
                        <Span>{category.name}</Span>
                    </Link>
                    <s.SubMenuWrapper className={'sub-menu'}>
                        <s.SubMenu>
                            {category.children.map((subcategory) =>
                                <Link locale={locale} key={subcategory.id}
                                      href={`/${category.slug}/${subcategory.slug}`}>
                                    <s.SubMenuItem>
                                        <Span>{subcategory.name}</Span>
                                    </s.SubMenuItem>
                                </Link>
                            )}
                        </s.SubMenu>
                    </s.SubMenuWrapper>
                </s.NavMenuItem>
            )}
        </s.NavUl>
    </s.NavWrapper>

}