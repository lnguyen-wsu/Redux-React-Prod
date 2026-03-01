import { useDispatch } from "react-redux"
import {useState} from 'react'
import { changeColor } from "../features/theme";

export default function ThemeUpdate() {
    const dispatch = useDispatch();
    const [theme, setTheme] = useState("")
    return (
        <div>
            <input 
                type="text"
                onChange={(state) => {
                    setTheme(state.target.value)
                }}
            />
            <button
                onClick={() => {
                    dispatch(changeColor(theme))
                }}
            >Update</button>
        </div>
    )
}
