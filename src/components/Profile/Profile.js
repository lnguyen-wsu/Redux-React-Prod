import { useSelector } from "react-redux"
import { useTheme, useWeather } from '../../hooks';
import './Profile.css';

function Profile() {
    const user = useSelector((state) => state.user.value)
    const { color } = useTheme();
    const { weather, status: weatherStatus, error: weatherError } = useWeather();
    
    const getStatusBadgeClass = () => `status-${weatherStatus}`;
    
    return (
        <div className="profile-container" style={{ borderLeftColor: color || '#2563eb' }}>
            <h1>Profile</h1>
            
            <div className="profile-info">
                <div className="profile-item">
                    <label>Name</label>
                    <p>{user.name || 'Not set'}</p>
                </div>
                <div className="profile-item">
                    <label>Age</label>
                    <p>{user.age || 'Not set'}</p>
                </div>
                <div className="profile-item">
                    <label>Email</label>
                    <p>{user.email || 'Not set'}</p>
                </div>
            </div>

            <div className="weather-section">
                <h3>🌤️ Weather Information</h3>
                <div className="weather-status">
                    <span>Status:</span>
                    <span className={`status-badge ${getStatusBadgeClass()}`}>
                        {weatherStatus}
                    </span>
                </div>
                
                {weatherStatus === 'loading' && (
                    <div className="weather-info" style={{ background: '#fbbf24' }}>
                        <p>🔄 Fetching weather data...</p>
                    </div>
                )}
                
                {weatherStatus === 'succeeded' && weather && (
                    <div className="weather-info">
                        <p>Current Temperature in New York</p>
                        <div className="temperature">{weather}°C</div>
                        <p>Conditions: Clear</p>
                    </div>
                )}
                
                {weatherStatus === 'failed' && (
                    <div className="weather-error">
                        ❌ {weatherError || 'Failed to fetch weather'}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile