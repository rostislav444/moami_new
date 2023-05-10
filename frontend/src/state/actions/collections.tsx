import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";


export const fetchCollections = createAsyncThunk(
  'collections/fetchCollections',
  async ( thunkAPI) => {
    const response = await fetch(BASE_URL + 'category/collections/', {
        method: 'GET',
        mode: 'cors'
    })
    return await response.json()
  }
)