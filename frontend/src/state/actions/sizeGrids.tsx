import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";
import {RequestHeaders} from "@/utils/requestHeaders";

export const fetchSizeGrids = createAsyncThunk(
    'sizes/fetchSizeGrids',
    async (thunkAPI) => {
        const response = await fetch(BASE_URL + 'sizes/size-grids/', {
            method: 'GET',
            headers: RequestHeaders(),
            mode: 'cors'
        })
        return await response.json()
    }
)