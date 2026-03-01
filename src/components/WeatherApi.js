import React from 'react'
import {useState, useEffect} from 'react'
import {weatherApi} from '../features/weatherApi'

function WeatherApi() {
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [temp, setTemp] = useState(null)

    useEffect(() =>{
        const getWeather = async() =>{
            try {
                const res = await weatherApi();
                setTemp(res)
            } catch (error) {
                setError(error.message)
            }finally{
                setLoading(false)
            }
        }

        getWeather()

    },[])
    return (
        <div>
            {loading && <p>Loading ...</p>}
            {error && <p>Error is {error}</p>}
            {!loading && temp && <p>Weather is {temp}</p> }
        </div>
    )
}

export default WeatherApi
