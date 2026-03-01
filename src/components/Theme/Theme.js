import { useState } from 'react';
import { useTheme, useWeather } from '../../hooks';
import './Theme.css';

function Theme() {
    const [inputValue, setInputValue] = useState('');
    const { setColor } = useTheme();
    useWeather();

    const handleColorChange = () => {
        setColor(inputValue);
        setInputValue('');
    };

    const presetColors = ['#2563eb', '#dc2626', '#059669', '#9333ea', '#f59e0b'];

    return (
        <div className="theme-container">
            <h2>Theme Customization</h2>
            <div className="theme-form">
                <div className="color-input-group">
                    <label>Color Hex Code</label>
                    <input
                        type="text"
                        className="color-input"
                        placeholder="#2563eb"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleColorChange()}
                    />
                    <div className="color-preview" style={{ color: inputValue || '#2563eb' }}>
                        ◼
                    </div>
                </div>

                <button className="theme-button" onClick={handleColorChange}>
                    <span className="theme-button-icon">🎨</span>
                    Apply Color
                </button>

                <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Preset Colors</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {presetColors.map((col) => (
                            <button
                                key={col}
                                onClick={() => setColor(col)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    border: '2px solid #e5e7eb',
                                    background: col,
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Theme
