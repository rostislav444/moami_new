import {useStore} from "react-redux";
import {selectCategories} from "@/state/reducers/categories";

import {H1, H2, PL} from "@/components/Shared/Typograpy";
import {CategoriesWrapper, CategoryImage, ChildCategory, ChildCategoryList, ParentCategory} from "./style";
import Link from "next/link";
import {useRouter} from "next/router";


export const HomeCategories = () => {
    const store = useStore();
    const router = useRouter();
    const {locale} = router;
    const categories = selectCategories(store.getState())

    return <CategoriesWrapper>
        {categories.map((category: any) => {
            return <ParentCategory key={category.id}>
                <Link locale={locale} key={category.id} href={`/${category.slug}`}>
                    <H1 mb={8}>{category.name}</H1>
                </Link>
                <ChildCategoryList>
                    {category.children.map((child: any) => {
                        return <Link key={child.id} locale={locale} href={`/${category.slug}/${child.slug}`}>
                            <ChildCategory>
                                <div>
                                    <H2 white>{child.name}</H2>
                                    <CategoryImage
                                        fill
                                        style={{objectFit: 'cover'}}
                                        alt={''} src={child.image ? child.image : '/images/no_image.png'}
                                        unoptimized
                                    />
                                    <div className={'overlay'}></div>
                                </div>
                            </ChildCategory>
                        </Link>
                    })}
                </ChildCategoryList>
            </ParentCategory>
        })}
    </CategoriesWrapper>
}