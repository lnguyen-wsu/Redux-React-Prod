async function weatherApiRequest(baseUrl) {
    if (!baseUrl || typeof baseUrl !== 'string') throw new Error('Wrong type')
    try {
        new URL(baseUrl)
    } catch (error) {
        throw new Error(error.message)
    }

    try {
        const res = await fetch(baseUrl)
        if (!res.ok) throw new Error('Network response was not ok')
        const json = await res.json()
        const data = json && json.current_weather && json.current_weather.temperature
        if (data === undefined || data === null) throw new Error('No data')
        return data
    } catch (error) {
        throw new Error(error.message)
    }
}

const weatherUrl =
    process.env.REACT_APP_WEATHER_URL ||
    'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true'

export const getWeather = async () => {
    try {
        const data = await weatherApiRequest(weatherUrl)
        return data
    } catch (error) {
        throw new Error(error.message)
    }
}