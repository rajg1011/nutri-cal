import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

const isInAppBrowser = () =>
  /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|MicroMessenger|TikTok/i.test(navigator.userAgent);

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [iosInApp, setIosInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIOS()) {
      setShowIOSBanner(true);
      setIosInApp(isInAppBrowser());
      return;
    }

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

  const handleDismiss = () => setDismissed(true);

  if (dismissed) return null;

  if (showIOSBanner) {
    return (
      <div className="install-banner">
        <div className="install-banner-text">
          <span className="install-banner-title">Install NutriCal</span>
          {iosInApp ? (
            <span className="install-banner-sub">Open this page in <strong>Safari / Chrome</strong> to install</span>
          ) : (
            <span className="install-banner-sub">Tap <strong>Share</strong> then <strong>Add to Home Screen</strong></span>
          )}
        </div>
        <button className="install-banner-close" onClick={handleDismiss} aria-label="Dismiss">&#x2715;</button>
      </div>
    );
  }

  if (!installEvent) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        <span className="install-banner-title">Install NutriCal</span>
        <span className="install-banner-sub">Add to your home screen for quick access</span>
      </div>
      <button className="install-banner-btn" type="button" onClick={handleInstall}>Install</button>
      <button className="install-banner-close" type="button" onClick={handleDismiss} aria-label="Dismiss">&#x2715;</button>
    </div>
  );
}
