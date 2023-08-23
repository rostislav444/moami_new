import {CartProductsProps} from "@/interfaces/cart";
import {CartItem}          from "@/components/App/Cart/CartMobile/CartItem";
import {CartSummery}       from "@/components/App/Cart/CartMobile/CarSummery";


export const CartMobile = ({items, quantity, total, handelRemoveItem, handleUpdate,}: CartProductsProps) => {
    return <div>{
        items.map(item =>
            <CartItem
                key={item.id}
                item={item}
                handelRemoveItem={handelRemoveItem}
                handleUpdate={handleUpdate}
            />
        )}
        <CartSummery total={total} quantity={quantity}/>
    </div>
}