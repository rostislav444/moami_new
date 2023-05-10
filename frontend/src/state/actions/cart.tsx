import {createAsyncThunk} from "@reduxjs/toolkit";
import {CartState} from "@/interfaces/cart";
import {BASE_URL} from "@/context/api";
import axios from "axios";

axios.defaults.withCredentials = true; // Enable sending cookies

interface AddItemToCartParams {
    size_id: number;
    quantity: number;
}


// export const addItemToCart = createAsyncThunk<CartState, AddItemToCartParams>(
//     "cart/addItem",
//     async ({size_id, quantity}) => {
//         const sessionId = localStorage.getItem('session-id');
//
//         const response = await fetch(`${BASE_URL}cart/`, {
//             method: "POST",
//             body: JSON.stringify({size_id, quantity}),
//             credentials: 'include',
//
//             headers: {
//                 "Content-Type": "application/json",
//                 'Cookie': `sessionid=${sessionId}`,
//
//             },
//             mode: "cors",
//
//         });
//         const data = await response.json();
//         return data;
//     }
// );
//
//
// export const updateItemInCart = createAsyncThunk<CartState, AddItemToCartParams>(
//     "cart/updateItem",
//     async ({size_id, quantity}) => {
//         const response = await fetch(`${BASE_URL}cart/`, {
//             method: "PUT",
//             body: JSON.stringify({size: size_id, quantity}),
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             mode: "cors",
//         });
//         const data = await response.json();
//         return data;
//     }
// );
//
//
// export const removeItemFromCart = createAsyncThunk<CartState, number>(
//     "cart/removeItem",
//     async (id) => {
//         const response = await fetch(`${BASE_URL}cart/${id}/`, {
//             method: "DELETE",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             mode: "cors",
//         });
//         const data = await response.json();
//         return data;
//     }
// );
