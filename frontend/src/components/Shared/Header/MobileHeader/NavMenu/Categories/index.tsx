import * as s      from "./style";
import Link        from "next/link";
import {P}         from "@/components/Shared/Typograpy";
import {useRouter} from "next/router";


interface Props {
    toggleMenu: (e: React.SyntheticEvent) => void;
    data: any
}

export const MobileMenuPopupCategories = ({toggleMenu, data}: Props) => {
    const router = useRouter();
    const {locale} = router;
    const {categories, collections} = data

    return <s.BurgerMenuUl>
        {categories.map((category: any) => (
            <s.BurgerMenuItem key={category.id} onClick={toggleMenu}>
                <Link href={`/${category.slug}`}>
                    <P mb={1}>{category.name}</P>
                </Link>
                <s.BurgerSubMenu>
                    {category.children.length > 0 && (
                        <s.BurgerSubMenu>
                            {category.children.map((subcategory: any) => (
                                <Link key={subcategory.id} href={`/${category.slug}/${subcategory.slug}`}
                                      locale={locale} onClick={toggleMenu}>
                                    <s.BurgerSubMenuItem>
                                        <P>{subcategory.name}</P>
                                    </s.BurgerSubMenuItem>
                                </Link>
                            ))}
                        </s.BurgerSubMenu>
                    )}
                </s.BurgerSubMenu>
            </s.BurgerMenuItem>
        ))}
        <s.BurgerMenuItem onClick={toggleMenu}>
            <Link href={`/collections`}>
                <P mb={1}>Коллекции</P>
            </Link>
            <s.BurgerSubMenu>
                {collections.map((collection: any) => (
                    <Link key={collection.id} href={`/collections/${collection.slug}`} locale={locale} onClick={toggleMenu}>
                        <s.BurgerSubMenuItem>
                            <P>{collection.name}</P>
                        </s.BurgerSubMenuItem>
                    </Link>
                ))}
            </s.BurgerSubMenu>
        </s.BurgerMenuItem>
    </s.BurgerMenuUl>
}