import {CartTable, RemoveButton}      from "./style";
import Link                           from "next/link";
import {CartTableProps}               from "@/interfaces/cart";
import {H4}                           from "@/components/Shared/Typograpy";
import {Counter}                      from "@/components/Shared/Counter";
import {selectCart, updateItemInCart} from "@/state/reducers/cart";
import {useRouter}                    from "next/navigation";
import {useAppSelector}               from "@/state/hooks";
import {useEffect}                    from "react";
import {useStore}                     from "react-redux";


export const CartTablePC = () => {
    const {push} = useRouter();
    const store = useStore()
    const {items, quantity, total} = useAppSelector(selectCart)
    const {selected} = useAppSelector(state => state.sizes)

    useEffect(() => {
        quantity === 0 && push('/')
    }, [quantity]);

    const handelRemoveItem = (id: number) => {
        store.dispatch({type: 'cart/removeItemFromCart', payload: id})
    }

    const handleUpdate = (id: number, quantity: number) => {
        store.dispatch(updateItemInCart({id, quantity}))
    }

    return <CartTable>
        <div className="cart-row cart-header">
            <div className="cart-cell">
                <H4>Фото</H4>
            </div>
            <div className="cart-cell">
                <H4>Детали</H4>
            </div>
            <div className="cart-cell">
                <H4>Цена</H4>
            </div>
            <div className="cart-cell">
                <H4>Кол-во</H4>
            </div>
            <div className="cart-cell">
                <H4></H4>
            </div>
            <div className="cart-cell">
                <H4>Всего</H4>
            </div>
        </div>

        {items.map(item => {
            const updateQuantity = (quantity: number) => handleUpdate(item.id, quantity)

            return (
                <div className="cart-row item-row" key={item.id}>
                    <div className="cart-cell cart-image">
                        <Link href={`/product/${item.slug}`}>
                            <img src={item.image} alt={item.name}/>
                        </Link>
                    </div>
                    <div className="cart-cell cart-name">
                        <h4>{item.name}</h4>
                        <p>size: {selected && item.size[selected]}</p>
                    </div>
                    <div className="cart-cell cart-price">
                        <span>{item.price} ₴</span>
                    </div>
                    <div className="cart-cell cart-quantity">
                        <Counter value={item.quantity} onChange={updateQuantity} maxValue={item.stock}/>
                    </div>
                    <div className="cart-cell cart-remove">
                        <RemoveButton onClick={() => handelRemoveItem(item.id)}>Remove</RemoveButton>
                    </div>
                    <div className="cart-cell cart-total">
                        <span>{item.price * item.quantity} ₴</span>
                    </div>
                </div>
            )
        })}
        <div className="cart-row cart-total-row">
            <div className="cart-cell"></div>
            <div className="cart-cell"></div>
            <div className="cart-cell"></div>
            <div className="cart-cell"></div>
            <div className="cart-cell cart-total-label">
                <span>Сума:</span>
            </div>
            <div className="cart-cell cart-total-value">
                <span>{total} ₴</span>
            </div>
        </div>
    </CartTable>
}