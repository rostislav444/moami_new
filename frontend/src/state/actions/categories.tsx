import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";


export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async ( thunkAPI) => {
    const response = await fetch(BASE_URL + 'category/categories/', {
        method: 'GET',
        mode: 'cors'
    })
    return await response.json()
  }
)