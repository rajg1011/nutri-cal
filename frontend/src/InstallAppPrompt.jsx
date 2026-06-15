import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setCanInstall(false);
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

    setInstallEvent(null);
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button className="install-app-btn" type="button" onClick={handleInstall}>
      Install App
    </button>
  );
}
