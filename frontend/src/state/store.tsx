import {configureStore} from '@reduxjs/toolkit'
import categoriesReducer from '@/state/reducers/categories'
import cartReducer from '@/state/reducers/cart'
import userReducer from '@/state/reducers/user'
import sizeGridsReducer from '@/state/reducers/sizes'
import languageReducer from '@/state/reducers/language'
import collectionsReducer from '@/state/reducers/collections'

const store = configureStore({
    reducer: {
        user: userReducer,
        language: languageReducer,
        categories: categoriesReducer,
        collections: collectionsReducer,
        cart: cartReducer,
        sizes: sizeGridsReducer,
    },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store


