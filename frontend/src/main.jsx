import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './css/index.css'
import App from './App.jsx'
import { registerServiceWorker } from './registerServiceWorker.js'

// Capture before React mounts — the event can fire before useEffect runs
window.__installPromptEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPromptEvent = e;
});

createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </>
)

registerServiceWorker()
