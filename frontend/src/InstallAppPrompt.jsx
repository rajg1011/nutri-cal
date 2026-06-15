import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIOS()) {
      setShowIOSBanner(true);
      return;
    }

    // Pick up the event captured in main.jsx before React mounted
    if (window.__installPromptEvent) {
      setInstallEvent(window.__installPromptEvent);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.__installPromptEvent = event;
      setInstallEvent(event);
    };

    const handleAppInstalled = () => {
      window.__installPromptEvent = null;
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    window.__installPromptEvent = null;
    setInstallEvent(null);
  };

  if (showIOSBanner) {
    return (
      <div className="install-ios-banner">
        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install NutriCal.
      </div>
    );
  }

  if (!installEvent) return null;

  return (
    <button className="install-app-btn" type="button" onClick={handleInstall}>
      Install App
    </button>
  );
}
