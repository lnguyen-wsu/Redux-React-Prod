import './App.css';
import { Login, Profile, Theme } from './components';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard</h1>
      </header>
      <div className="App-container">
        <div className="App-section">
          <Profile />
        </div>
        <div className="App-section">
          <Login />
          <Theme />
        </div>
      </div>
    </div>
  );
}

export default App;
