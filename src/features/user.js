import { createSlice } from '@reduxjs/toolkit'

const initialValue = {
    name: "",
    age: 0,
    email: ""
}
export const userReducer = createSlice({
    name: "User",
    initialState: {value: initialValue},
    reducers:{
        login:(state, action) => {
            state.value = action.payload
        },
        logout:(state) =>{
            state.value = initialValue
        }
    }
})

export const {login, logout} = userReducer.actions
export default userReducer.reducer

