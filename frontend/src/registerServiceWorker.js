export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    // Refresh tag to prevent infinite reload -> As it reload then load event occur and so on.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
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
