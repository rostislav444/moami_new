import {Action, AnyAction, combineReducers, configureStore, ThunkAction,} from '@reduxjs/toolkit';
import {createWrapper, HYDRATE} from 'next-redux-wrapper';

import userReducer from "@/state/reducers/user";
import cartReducer from "@/state/reducers/cart";
import categoriesReducer from "@/state/reducers/categories";
import sizesReducer from "@/state/reducers/sizes";
import PagesReducer from "@/state/reducers/pages";
import routingReducer from "@/state/reducers/routing";


const combinedReducer = combineReducers({
    user: userReducer,
    cart: cartReducer,
    categories: categoriesReducer,
    // sizes: sizesReducer,
    pages: PagesReducer,
    // routing: routingReducer,
});

const reducer = (state: ReturnType<typeof combinedReducer>, action: AnyAction) => {
    switch (action.type) {
        case HYDRATE:
            return {
                ...state,
                ...action.payload,
            }

        default:
            console.log('DEFAULT', action)
            return combinedReducer(state, action);
    }
};

export const makeStore = () =>
    configureStore({
        // @ts-ignore
        reducer,
        devTools: true,
    });

type Store = ReturnType<typeof makeStore>;

export type AppDispatch = Store['dispatch'];
export type RootState = ReturnType<Store['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

export const wrapper = createWrapper(makeStore, {debug: true});