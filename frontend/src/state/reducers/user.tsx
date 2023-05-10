import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import { UserState } from '@/interfaces/user'

const initialState: UserState = {
  uuid: null,
  email: null,
  phone: null,
  first_name: null,
  last_name: null,
  father_name: null,
  date_of_birth: null,
  token: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state = action.payload
    },
    clearUser: (state) => {
      state = initialState
    },
  },
})

export const { setUser, clearUser } = userSlice.actions

export const selectUser = (state: RootState) => state.user

export default userSlice.reducer