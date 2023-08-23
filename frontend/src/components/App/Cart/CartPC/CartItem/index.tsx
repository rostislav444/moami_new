import {OldPrice, ProductDetails, ProductPhoto, ProductPrice, ProductQty, ProductTotal} from "@/components/App/Cart/CartPC/style";
import {CartItemProps}                                                                  from "@/interfaces/cart";
import {Counter}                                                                        from "@/components/Shared/Counter";
import {Caption, InfoTitle}                                                             from "@/components/Shared/Typograpy";

export const CartItem = ({item, handelRemoveItem, handleUpdate}: CartItemProps) => {
    return <>
        <ProductPhoto>
            <img src={item.image} alt="product"/>
        </ProductPhoto>
        <ProductDetails>
            <InfoTitle bold>{item.name}</InfoTitle>
            <Caption mt={4}>Размер: {item.size[item.selectedGrid]} ({item.selectedGrid})</Caption>
        </ProductDetails>
        <ProductPrice>
            <OldPrice>{item.old_price} ₴</OldPrice>
            <InfoTitle mt={1}>{item.price} ₴</InfoTitle>
        </ProductPrice>
        <ProductQty>
            <Counter value={item.quantity} onChange={quantity => handleUpdate(item.id, quantity)}
                     maxValue={item.stock}/>
        </ProductQty>
        <ProductTotal>
            <InfoTitle>{item.price * item.quantity} ₴</InfoTitle>
        </ProductTotal>
    </>

}