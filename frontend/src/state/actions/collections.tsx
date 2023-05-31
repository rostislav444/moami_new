import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchCollections = createAsyncThunk(
  'collections/fetchCollections',
//   async ( thunkAPI) => {
//     const response = await fetch(BASE_URL + 'category/collections/', {
//         method: 'GET',
//         mode: 'cors'
//     })
//     return await response.json()
//   }
// )
    async (locale: string | undefined, thunkAPI) => {
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/category/collections/')
        return response.data
    }
)