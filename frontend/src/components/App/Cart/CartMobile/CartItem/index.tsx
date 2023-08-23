import {CartItemProps, CartItemState}                                                from "@/interfaces/cart";
import {ItemActions, ItemData, ItemImage, ItemInfo, OldPrice, PriceWrapper, Wrapper} from "@/components/App/Cart/CartMobile/CartItem/style";
import {Caption, InfoTitle, P}                                                       from "@/components/Shared/Typograpy";
import {Counter}                                                                     from "@/components/Shared/Counter";
import {Icon}                                                                        from "@/components/Shared/Icons";
import {MobileItemData}                                                              from "@/components/App/Cart/CartMobile/CartItem/ItemIData";
import {RemoveButton}                                                                from "@/components/App/Cart/style";



export const CartItem = ({item, handelRemoveItem, handleUpdate,}: CartItemProps) => {
    return <Wrapper>
        <MobileItemData item={item}/>
        <ItemActions>
            <Counter value={item.quantity} onChange={quantity => handleUpdate(item.id, quantity)}
                     maxValue={item.stock}/>
            <InfoTitle>Всего: {item.price * item.quantity} ₴</InfoTitle>
            <RemoveButton onClick={() => handelRemoveItem(item.id)}>
                <Icon src="/icons/close.svg"/>
            </RemoveButton>
        </ItemActions>
    </Wrapper>
}