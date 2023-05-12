import {CategoryState} from "@/interfaces/categories";
import {CollectionsState} from "@/interfaces/collections";
import {useState} from "react";
import Link from "next/link";
import {P} from "@/components/Shared/Typograpy";
import * as s from "./style";

interface Props {
    categories: CategoryState[];
    collections: CollectionsState[];
}

export const MobileMenu = ({categories, collections}: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = (e: React.SyntheticEvent) => {


        if (e.target === e.currentTarget) {
             setIsOpen(!isOpen);
        }
    };

    return (
        <>
            <s.BurgerIcon onClick={toggleMenu}  >
                <div/>
                <div/>
                <div/>
            </s.BurgerIcon>
            {isOpen && (
                <s.BurgerMenuWrapper >
                    <s.BurgerMenuUl>
                        {categories.map((category) => (
                            <s.BurgerMenuItem
                                key={category.id}
                                onTouchEnd={toggleMenu}
                                onMouseUp={toggleMenu}
                            >
                                <Link href={`/${category.slug}`}>
                                    <P>{category.name}</P>
                                </Link>
                                {category.children.length > 0 && (
                                    <s.BurgerSubMenu>
                                        {category.children.map((subcategory) => (
                                            <Link key={subcategory.id} href={`/${category.slug}/${subcategory.slug}`}
                                                  onClick={toggleMenu}>
                                                <s.BurgerSubMenuItem>
                                                    <P>{subcategory.name}</P>
                                                </s.BurgerSubMenuItem>
                                            </Link>
                                        ))}
                                    </s.BurgerSubMenu>
                                )}
                            </s.BurgerMenuItem>
                        ))}
                        <s.BurgerMenuItem onClick={toggleMenu}>
                            <Link href={`/collections`}><span>Коллекции</span></Link>
                            <s.BurgerSubMenu>
                                {collections.map((collection) => (
                                    <Link key={collection.id} href={`/collections/${collection.slug}`}
                                          onClick={toggleMenu}>
                                        <s.BurgerSubMenuItem>
                                            <P>{collection.name}</P>
                                        </s.BurgerSubMenuItem>
                                    </Link>
                                ))}
                            </s.BurgerSubMenu>
                        </s.BurgerMenuItem>
                    </s.BurgerMenuUl>
                </s.BurgerMenuWrapper>
            )}
        </>
    );
};