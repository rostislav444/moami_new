import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";


export const fetchSizeGrids = createAsyncThunk(
    'sizes/fetchSizeGrids',
    async (thunkAPI) => {
        const response = await fetch(BASE_URL + 'sizes/size-grids/', {
            method: 'GET',
            mode: 'cors'
        })
        return await response.json()
    }
)