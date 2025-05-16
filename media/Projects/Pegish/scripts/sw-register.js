// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        // Service worker registered successfully
      })
      .catch(err => {
        // Silent error handling for service worker registration
      });
  });
}
