import {ItemData, ItemImage, ItemInfo, OldPrice, PriceWrapper} from "@/components/App/Cart/CartMobile/CartItem/style";
import {Caption, InfoTitle, P}                                 from "@/components/Shared/Typograpy";
import {CartItemState}                                         from "@/interfaces/cart";


interface MobileItemDataProps {
    item: CartItemState,
}


export const MobileItemData = ({item}: MobileItemDataProps) => {
    return <ItemData>
        <ItemImage>
            <img src={item.image} alt={item.name}/>
        </ItemImage>
        <ItemInfo>
            <InfoTitle bold>{item.name}</InfoTitle>
            <PriceWrapper>
                <P>{item.price} ₴</P>
                {item.old_price >= item.price && <OldPrice>{item.old_price} ₴</OldPrice>}
            </PriceWrapper>
            {/* TODO Add selected size grid for this product */}
            <Caption mt={1}>Размер: {item.size[item.selectedGrid]} ({item.selectedGrid})</Caption>
            <Caption>Кол-во: {item.quantity} шт.</Caption>
        </ItemInfo>
    </ItemData>
}