import { configureStore } from "@reduxjs/toolkit";
import { userReducer, themeReducer, weatherReducer } from './features';

export const store = configureStore({
    reducer:{
        user: userReducer,
        theme: themeReducer,
        weather : weatherReducer
    }
})