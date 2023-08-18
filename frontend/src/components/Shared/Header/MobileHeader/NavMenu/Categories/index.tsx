import * as s from "./style";
import Link from "next/link";
import {P} from "@/components/Shared/Typograpy";


interface Props {
    toggleMenu: (e: React.SyntheticEvent) => void;
}

export const MobileMenuPopupCategories = ({toggleMenu}: Props) => {
    // const {categories} = useAppSelector(selectCategories)
    // const {collections} = useAppSelector(selectCollections)

    return <s.BurgerMenuUl>
        {/*{categories.map((category) => (*/}
        {/*    <s.BurgerMenuItem key={category.id} onClick={toggleMenu}>*/}
        {/*        <Link href={`/${category.slug}`}>*/}
        {/*            <P mb={1}>{category.name}</P>*/}
        {/*        </Link>*/}
        {/*        <s.BurgerSubMenu>*/}
        {/*            {category.children.length > 0 && (*/}
        {/*                <s.BurgerSubMenu>*/}
        {/*                    {category.children.map((subcategory) => (*/}
        {/*                        <Link key={subcategory.id} href={`/${category.slug}/${subcategory.slug}`}*/}
        {/*                              onClick={toggleMenu}>*/}
        {/*                            <s.BurgerSubMenuItem>*/}
        {/*                                <P>{subcategory.name}</P>*/}
        {/*                            </s.BurgerSubMenuItem>*/}
        {/*                        </Link>*/}
        {/*                    ))}*/}
        {/*                </s.BurgerSubMenu>*/}
        {/*            )}*/}
        {/*        </s.BurgerSubMenu>*/}

        {/*    </s.BurgerMenuItem>*/}
        {/*))}*/}
        <s.BurgerMenuItem onClick={toggleMenu}>

            <Link href={`/collections`}>
                <P>Коллекции</P>
            </Link>

            <s.BurgerSubMenu>
                {/*{collections.map((collection) => (*/}
                {/*    <Link key={collection.id} href={`/collections/${collection.slug}`} onClick={toggleMenu}>*/}
                {/*        <s.BurgerSubMenuItem>*/}
                {/*            <P>{collection.name}</P>*/}
                {/*        </s.BurgerSubMenuItem>*/}
                {/*    </Link>*/}
                {/*))}*/}
            </s.BurgerSubMenu>
        </s.BurgerMenuItem>
    </s.BurgerMenuUl>
}