import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getWeather } from '../services/api'

export const fetchWeather = createAsyncThunk('weather/fetchWeather', async () => {
    const data = await getWeather()
    return data
})

const initialState = {
    value: '',
    status: 'idle',
    error: null,
}

const weatherSlice = createSlice({
    name: 'Weather',
    initialState,
    reducers: {
        updateWeather: (state, action) => {
            state.value = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWeather.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchWeather.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.value = action.payload
            })
            .addCase(fetchWeather.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message
            })
    }
})

export const { updateWeather } = weatherSlice.actions
export default weatherSlice.reducer
