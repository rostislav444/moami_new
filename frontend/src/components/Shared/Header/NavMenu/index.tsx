import * as s from "@/components/Shared/Header/style";
import {NavUl, NavWrapper} from "@/components/Shared/Header/style";
import Link from "next/link";
import React from "react";
import {useAppSelector} from "@/state/hooks";
import {selectCategories} from "@/state/reducers/categories";
import {CategoryState} from "@/interfaces/categories";
import {Span} from "@/components/Shared/Typograpy";
import {selectCollections} from "@/state/reducers/collections";


export const NavMenu = () => {
    const {categories} = useAppSelector(selectCategories)
    const {collections} = useAppSelector(selectCollections)
    const [activeCategory, setActiveCategory] = React.useState<CategoryState | null>(null)
    const handleMouseDown = (category: CategoryState) => {
        setActiveCategory(category)
    }

    console.log(collections)

    return (
        <NavWrapper>
            <NavUl>
                {categories.map((category) =>
                    <s.NavMenuItem key={category.id} onMouseOver={() => handleMouseDown(category)}>
                        <Link href={`/${category.slug}`}>
                            <Span>{category.name}</Span>
                        </Link>
                        <s.SubMenuWrapper className={'sub-menu'}>
                            <s.SubMenu>
                                {category.children.map((subcategory) =>
                                    <Link key={subcategory.id} href={`/${category.slug}/${subcategory.slug}`}>
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
                    <Link href={`/collections`}><span>Коллекции</span></Link>
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
            </NavUl>
        </NavWrapper>
    )
}