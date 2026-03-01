import { createSlice } from '@reduxjs/toolkit'

const initialState = { value: '' }

export const themeReducer = createSlice({
    name: 'Theme',
    initialState,
    reducers: {
        updateColor: (state, action) => {
            state.value = action.payload
        }
    }
})

export const { updateColor } = themeReducer.actions
export default themeReducer.reducer

