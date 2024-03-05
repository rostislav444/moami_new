import {configureStore}             from "@reduxjs/toolkit";
import userReducer                  from "@/state/reducers/user";
import {UserState}                  from '@/interfaces/user'
import cartReducer                  from "@/state/reducers/cart";
import {CartState}                  from '@/interfaces/cart'
import categoriesReducer            from "@/state/reducers/categories";
import {CategoryState}              from '@/interfaces/categories'
import collectionsReducer           from "@/state/reducers/collections";
import sizesReducer                 from "@/state/reducers/sizes";
import {SizesState}                 from '@/interfaces/sizes'
import {CollectionsState}           from "@/interfaces/collections";
import PagesReducer                 from "@/state/reducers/pages";
import {PagesProps}                 from "@/interfaces/pages";
import routingReducer, {RouteProps} from "@/state/reducers/routing";

const reducer = {
    user: userReducer,
    cart: cartReducer,
    categories: categoriesReducer,
    collections: collectionsReducer,
    sizes: sizesReducer,
    pages: PagesReducer,
    routing: routingReducer,
}

const createStore = (preloadedState: any) => {
    return configureStore({
        reducer: reducer,
        preloadedState,
    })
}


let reduxStore: any;

export const initializeStore = (preloadedState: any) => {
    let _reduxStore = reduxStore ?? createStore(preloadedState)

    if (reduxStore && preloadedState && preloadedState !== reduxStore.getState()) {
        _reduxStore = createStore({
            ...reduxStore.getState(),
            ...preloadedState,
        })
        reduxStore = undefined
    }

    if (typeof window === 'undefined') return _reduxStore
    if (!reduxStore) reduxStore = _reduxStore

    return _reduxStore
}

export type AppDispatch = ReturnType<typeof createStore>['dispatch']

export type RootState = {
    user: UserState,
    cart: CartState,
    categories: CategoryState,
    collections: CollectionsState,
    sizes: SizesState,
    pages: PagesProps,
    routing: RouteProps,
}
