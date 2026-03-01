import { useDispatch } from "react-redux"
import { login, logout } from "../../features/user";
import './Login.css';

function Login() {
    const dispatch = useDispatch();
    return (
        <div className="login-container">
            <h2>Authentication</h2>
            <div className="login-actions">
                <button 
                    className="login-button btn-login"
                    onClick={() => {
                        dispatch(login({
                            name: "Lawn",
                            age: 45,
                            email: "abc@gmail.com"
                        }))
                    }}
                >
                    <span className="login-icon">🔐</span>
                    Sign In
                </button>
                <button
                    className="login-button btn-logout"
                    onClick={() => {
                        dispatch(logout())
                    }}
                >
                    <span className="login-icon">🚪</span>
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default Login
