import {
    Actions,
    AddToWishlistWrapper,
    BuyButton,
    DescriptionColumn,
    ImageColumn,
    ImageWrapper,
    OldPrice,
    Price,
    PriceBlock,
    ProductContainer, ProductPreview,
    SizeItem,
    SizeList
} from "@/components/App/Product/style";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {VariantPageProps} from "@/interfaces/variant";
import {Caption, H2, Span} from "@/components/Shared/Typograpy";
import {FlexSpaceBetween} from "@/components/Shared/Blocks";
import {Icon} from "@/components/Shared/Icons";
import {useAppSelector} from "@/state/hooks";
import {selectGrid, selectSizes} from "@/state/reducers/sizes";
import {DropdownSelect} from "@/components/Shared/choices";
import {useRouter} from 'next/navigation';
import store from "@/state/store";
import {SizeGridProps} from "@/interfaces/sizes";
import {CartItemState} from "@/interfaces/cart";
import {addItemToCart} from "@/state/reducers/cart";
import {VariantsLinks} from "@/components/App/Product/VariantsLinks";
import {ProductDescription} from "@/components/App/Product/Description";


export const ProductPage = ({variant}: VariantPageProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const {sizeGrids, selected} = useAppSelector<SizeGridProps>(selectSizes)
    const initialSize = variant.sizes.find(size => size.stock !== 0)?.id
    const [selectedSize, setSelectedSize] = useState<number | undefined>(initialSize)
    const {push} = useRouter();

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = `${ref.current.scrollHeight + 8}px`
        }
    }, [ref.current])

    const handleGridChange = (slug: string) => {
        store.dispatch(selectGrid(slug))
    }

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
                old_price: variant.product.price,
            }
            store.dispatch(addItemToCart(data))
            push('/cart')
        }
    }

    return (
        <ProductContainer>
            <ImageColumn>
                {variant.images.map((image, key) =>
                    <ImageWrapper key={key}>
                        <Image fill src={image.image} alt={'alt' + key}/>
                    </ImageWrapper>
                )}
            </ImageColumn>
            <DescriptionColumn ref={ref}>
                <FlexSpaceBetween mb={2}>
                    <Caption>Код: {variant.code}</Caption>
                    <DropdownSelect transparent value={selected}
                                    options={sizeGrids.map(grid => ({label: grid.name, value: grid.slug,}))}
                                    onChange={handleGridChange}/>
                </FlexSpaceBetween>
                <H2 mb={2}>{variant.name}</H2>
                <PriceBlock>
                    <Price>{variant.product.price} ₴</Price>
                    {variant.product.old_price > variant.product.price &&
                        <OldPrice>{variant.product.old_price} ₴</OldPrice>}
                </PriceBlock>
                <VariantsLinks variants={variant.product.variants} selected={variant.id}/>
                <SizeList>
                    {variant.sizes.map((size, key) => {
                        return <SizeItem active={size.stock !== 0} selected={size.id === selectedSize} key={key}
                                  onClick={() => size.stock !== 0 && setSelectedSize(size.id)}>
                            {selected && <span>{size.size[selected]}</span>}
                        </SizeItem>
                    }

                    )}
                </SizeList>
                 <ProductPreview>
                    {variant.product.properties.map((property, key) =>
                        <li key={key}>
                            <Span mr={1}>{property.key}:</Span>
                            <Span>{property.value}</Span>
                        </li>
                    )}
                </ProductPreview>
                <Actions>
                    <BuyButton onClick={handleAddToCart}>Купить</BuyButton>
                    <AddToWishlistWrapper>
                        <Icon src={'/icons/heart.svg'}/>
                    </AddToWishlistWrapper>
                </Actions>

                <ProductDescription description={variant.product.description}/>
            </DescriptionColumn>
        </ProductContainer>
    )
}