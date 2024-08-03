import {Error, H2, Span} from "@/components/Shared/Typograpy";
import {
    Actions,
    AddToWishlistWrapper,
    BuyButton,
    DescriptionColumn,
    ProductPreview
} from "@/components/App/Product/Galery/DesktopGalery/style";
import {ProductDescription} from "@/components/App/Product/Description/DescriptionText";
import {VariantsLinks} from "@/components/App/Product/Description/VariantsLinks";
import {Icon} from "@/components/Shared/Icons";
import {useStore} from "react-redux";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {useAppSelector} from "@/state/hooks";
import {addViewedProductData} from "@/state/reducers/user";
import {CartItemState} from "@/interfaces/cart";
import {addItemToCart} from "@/state/reducers/cart";
import {event} from "@/lib/FacebookPixel";
import {VariantPageProps} from "@/interfaces/variant";
import {TopBlock} from "@/components/App/Product/Description/TopBlock";
import {selectCategories} from "@/state/reducers/categories";
import {CategoryState} from "@/interfaces/categories";
import {Sizes} from "@/components/App/Product/Description/Sizes";
import {PriceBlock} from "@/components/App/Product/Description/PriceBlock";
import {useTranslation} from "next-i18next";

const getCategory = (categories: CategoryState[], parentId: number, id: number) => {
    const parentCategory = categories.find(category => category.id === parentId)
    if (parentCategory) {
        const category = parentCategory.children.find(category => category.id === id)
        if (category) {
            return category
        }
    }
    return null
}

export const DescriptionBlock = ({variant}: VariantPageProps) => {
    const store = useStore()
    const {t} = useTranslation('common', {useSuspense: false})
    const categories = useAppSelector(selectCategories)
    const category = getCategory(categories, variant.product.category.parent, variant.product.category.id)
    const currentSizeGrid = category?.selected_size_grid || category?.preferred_size_grid
    const [selectedSize, setSelectedSize] = useState<number | null>(null)
    const [sizeNotSelectedError, setSizeNotSelectedError] = useState<boolean>(false)
    const {push} = useRouter();


    useEffect(() => {
        store.dispatch(addViewedProductData(variant))
    }, [variant])


    const handleAddToCart = () => {
        const size = variant.sizes.find(size => size.id === selectedSize)
        if (size) {
            const data: CartItemState = {
                id: size.id,
                image: variant.images[0].image,
                stock: size.stock,
                size: size.size,
                quantity: 1,
                name: variant.product.name,
                slug: variant.slug,
                price: variant.product.price,
                old_price: variant.product.old_price,
                selectedGrid: currentSizeGrid || '',
            }
            store.dispatch(addItemToCart(data))
            event('AddToCart', {
                content_name: variant.name,
                content_ids: [variant.id],
                content_type: 'product',
                value: variant.product.price,
                currency: 'UAH'
            })
            push('/cart')
        } else {
            setSizeNotSelectedError(true)
        }
    }


    return <DescriptionColumn>
        <TopBlock
            variant={variant}
            category={category}
            categoryIds={variant.product.category}
            currentSizeGrid={currentSizeGrid}
        />
        <H2 mb={2}>{variant.name}</H2>
        <PriceBlock variant={variant}/>
        <ProductPreview>
            <li>
                <Span bold mr={1}>{t('titles.composition')}:</Span>
                <Span>{variant.product.compositions.map(
                    composition => `${composition.composition} - ${composition.value}%`)
                    .join(', ')}</Span>
            </li>
            {variant.product.properties.map((property, key) =>
                <li key={key}>
                    <Span bold mr={1}>{property.key}:</Span>
                    <Span>{property.value}</Span>
                </li>
            )}
        </ProductPreview>
        <ProductDescription description={variant.product.description} extra_description={variant.product.extra_description}/>
        <VariantsLinks variants={variant.product.variants} selected={variant.id}/>
        <Sizes
            sizes={variant.sizes}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            setSizeNotSelectedError={setSizeNotSelectedError}
            currentSizeGrid={currentSizeGrid}
        />
        {sizeNotSelectedError && <Error mt={4}>{t('titles.chooseSize')}</Error>}
        <Actions>
            <BuyButton onClick={handleAddToCart}>{t('titles.buy')}</BuyButton>
            {/*<AddToWishlistWrapper>*/}
            {/*    <Icon src={'/icons/heart.svg'}/>*/}
            {/*</AddToWishlistWrapper>*/}
        </Actions>
    </DescriptionColumn>
}