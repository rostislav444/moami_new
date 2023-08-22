import * as s             from "./style"
import Link               from "next/link";
import {Span}             from "@/components/Shared/Typograpy";
import React              from "react";
import {CategoryState}    from "@/interfaces/categories";
import {CollectionsState} from "@/interfaces/collections";
import {useRouter}        from "next/router";


interface Props {
    categories: CategoryState[];
    collections: CollectionsState[];
}

export const DesktopNavMenu = ({categories, collections}: Props) => {
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
                                <Link locale={locale} key={subcategory.id} href={`/${category.slug}/${subcategory.slug}`}>
                                    <s.SubMenuItem>
                                        <Span>{subcategory.name}</Span>
                                    </s.SubMenuItem>
                                </Link>
                            )}
                        </s.SubMenu>
                    </s.SubMenuWrapper>
                </s.NavMenuItem>
            )}
            <s.NavMenuItem>
                <Link locale={locale} href={`/collections`}><span>Коллекции</span></Link>
                <s.SubMenuWrapper className={'sub-menu'}>
                    <s.SubMenu>
                        {collections.map((collection) =>
                            <Link key={collection.id} href={`/collections/${collection.slug}`}>
                                <s.SubMenuItem>
                                    <Span>{collection.name}</Span>
                                </s.SubMenuItem>
                            </Link>
                        )}
                    </s.SubMenu>
                </s.SubMenuWrapper>
            </s.NavMenuItem>
        </s.NavUl>
    </s.NavWrapper>

}