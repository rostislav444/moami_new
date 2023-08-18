import {Actions, AddToWishlistWrapper, BuyButton, DescriptionColumn, OldPrice, Price, PriceBlock, ProductContainer, ProductPreview, SizeItem, SizeList} from "@/components/App/Product/style";
import {useEffect, useRef, useState}                                                                                                                    from "react";
import {VariantPageProps}                                                                                                                               from "@/interfaces/variant";
import {Caption, H2, Span}                                                                                                                              from "@/components/Shared/Typograpy";
import {FlexSpaceBetween}                                                                                                                               from "@/components/Shared/Blocks";
import {Icon}                                                                                                                                           from "@/components/Shared/Icons";
import {useAppSelector}                                                                                                                                 from "@/state/hooks";
import {selectGrid, selectSizes}                                                                                                                        from "@/state/reducers/sizes";
import {DropdownSelect}                                                                                                                                 from "@/components/Shared/choices";
import {useRouter}                                                                                                                                      from 'next/navigation';
import {SizeGridState}                                                                                                                                  from "@/interfaces/sizes";
import {CartItemState}                                                                                                                                  from "@/interfaces/cart";
import {addItemToCart}                                                                                                                                  from "@/state/reducers/cart";
import {VariantsLinks}                                                                                                                                  from "@/components/App/Product/VariantsLinks";
import {ProductDescription}                                                                                                                             from "@/components/App/Product/Description";
import {ProductImageGallery}                                                                                                                            from "@/components/App/Product/Galery";
import {event}                                                                                                                                          from "@/lib/FacebookPixel";
import {useStore}                                                                                                                                       from "react-redux";


export const ProductPage = ({variant}: VariantPageProps) => {
    const store = useStore()

    const descriptionColumnRef = useRef<HTMLDivElement>(null)

    const initialSize = variant.sizes.find(size => size.stock !== 0)?.id
    const [selectedSize, setSelectedSize] = useState<number | undefined>(initialSize)
    const {push} = useRouter();

    const sizeGrids = variant.product.size_grids
    const productPreferredSizeGrid = variant.product.product_preferred_size_grid
    const {selected} = useAppSelector<SizeGridState>(selectSizes)
    const [selectedGrid, setSelectedGrid] = useState<string>(sizeGrids.find(grid => grid.slug === selected)?.slug || productPreferredSizeGrid || sizeGrids[0].slug);


    useEffect(() => {
        if (descriptionColumnRef.current) {
            descriptionColumnRef.current.style.height = `${descriptionColumnRef.current.scrollHeight + 8}px`
        }
    }, [descriptionColumnRef.current])

    const handleGridChange = (slug: string) => {
        setSelectedGrid(slug)
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
            event('AddToCart', {
                content_name: variant.name,
                content_ids: [variant.id],
                content_type: 'product',
                value: variant.product.price,
                currency: 'UAH'
            })
            push('/cart')
        }
    }

    return (
        <ProductContainer>
            <ProductImageGallery images={variant.images}/>
            <DescriptionColumn ref={descriptionColumnRef}>
                <FlexSpaceBetween mb={2}>
                    <Caption>Код: {variant.code}</Caption>
                    <DropdownSelect transparent value={selectedGrid}
                                    options={sizeGrids.map(grid => ({label: grid.name, value: grid.slug,}))}
                                    onChange={handleGridChange}/>
                </FlexSpaceBetween>
                <H2 mb={2}>{variant.name}</H2>
                <PriceBlock>
                    <Price>{variant.product.price} ₴</Price>
                    {variant.product.old_price > variant.product.price &&
                        <OldPrice>{variant.product.old_price} ₴</OldPrice>}
                </PriceBlock>
                <ProductDescription description={variant.product.description} parent={descriptionColumnRef}/>
                <VariantsLinks variants={variant.product.variants} selected={variant.id}/>

                <SizeList>
                    {variant.sizes.map((size, key) => {
                            return <SizeItem active={size.stock !== 0} selected={size.id === selectedSize} key={key}
                                             onClick={() => size.stock !== 0 && setSelectedSize(size.id)}>
                                {selectedGrid && <span>{size.size[selectedGrid]}</span>}
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


            </DescriptionColumn>
        </ProductContainer>
    )
}