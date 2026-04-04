import { BookOpen, BarChart2, Activity } from 'lucide-react';
import './css/Login.css';
import GoogleIcon from './assets/google';

const Login = ({ onLogin }) => {
  return (
    <div className="login-container fade-in">
      <div className="login-header">
        <div className="login-logo">
          <span className="login-logo-icon">🥗</span>
        </div>
        <h1 className="login-title">NutriCal</h1>
        <p className="login-subtitle">Your smart Indian food calorie tracker</p>
      </div>

      <div className="login-card">
        <h2 className="login-card-title">Welcome</h2>
        <p className="login-card-desc">Authenticate to continue tracking your calories</p>

        <button className="google-auth-btn" onClick={onLogin}>
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      <div className="login-features">
        <div className="feature-card">
          <BookOpen size={24} className="feature-icon" />
          <h4 className="feature-title">500+ Indian foods</h4>
          <p className="feature-desc">Log Foods</p>
        </div>
        <div className="feature-card">
          <BarChart2 size={24} className="feature-icon" />
          <h4 className="feature-title">Daily History</h4>
          <p className="feature-desc">Track daily intake</p>
        </div>
        <div className="feature-card">
          <Activity size={24} className="feature-icon" />
          <h4 className="feature-title">Custom goals</h4>
          <p className="feature-desc">Set daily goals</p>
        </div>
      </div>

      <div className="login-footer">
        This is a demo application. Data is not guaranteed to be saved permanently, so please avoid relying on it for important tracking.
      </div>
    </div>
  );
};

export default Login;
