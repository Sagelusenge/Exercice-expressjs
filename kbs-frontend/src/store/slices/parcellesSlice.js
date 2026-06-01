import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  parcelles: [],
  loading: false,
  error: null,
}

const parcellesSlice = createSlice({
  name: 'parcelles',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true
    },
    fetchSuccess: (state, action) => {
      state.loading = false
      state.parcelles = action.payload
    },
    fetchFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
  },
})

export const { fetchStart, fetchSuccess, fetchFailure } = parcellesSlice.actions
export default parcellesSlice.reducer
