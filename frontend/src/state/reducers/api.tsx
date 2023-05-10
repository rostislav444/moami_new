import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FetchState {
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: FetchState = {
  loading: false,
  error: null,
  data: null,
};

export const fetchSlice = createSlice({
  name: 'fetch',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
    },
  },
});

export const { setLoading, setError, setData } = fetchSlice.actions;

export default fetchSlice.reducer;
