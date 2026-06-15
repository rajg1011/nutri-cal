import './css/LoadingScreen.css';
import SaladIcon from './assets/icons/SaladIcon';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-ring">
        <div className="loading-bowl"><SaladIcon size={40} /></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
