const weatherApiGet = async (url) =>{
    if(!url || typeof(url) !== 'string'){
        throw new Error("Wrong type of baseUrl")
    }
    try {
        new URL(url)
    } catch (error) {
        throw new Error("Can't instantiate the URL object" + error.message)
    }

    try {
        const res = await fetch(url)
        if(!res.ok){
            throw new Error("Can't get the response")
        }
        const data = await res.json();
        let temp = data && data.current_weather && data.current_weather.temperature;
        if(temp === undefined || temp === null ) {
            throw new Error ("Something wrong")
        }
        return temp;

    } catch (error) {
        throw new Error ("Having issue" + error.message)
    }
} 


export const weatherApi = async()=>{
    let baseUrl = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true';
    try {
        const res = await weatherApiGet(baseUrl);
        return res;
    } catch (error) {
        throw new Error ("Having issue" + error.message)
    }
}
