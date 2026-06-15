export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    try {
      const registration = await navigator.serviceWorker.register('/serviceWorker.js');
      await registration.update();
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}
