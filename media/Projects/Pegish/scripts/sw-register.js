// Service worker registration (scoped to Pegish folder only)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const pathOk = location.pathname.replace(/\\/g,'/').includes('/media/Projects/Pegish/');
      if (!pathOk) {
        // Do not register outside Pegish directory
        return;
      }
      navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .then(registration => {
          // Service worker registered successfully, scope limited to Pegish directory
          // If for any reason scope is broader than expected, unregister defensively
          if (registration.scope && !registration.scope.endsWith('/media/Projects/Pegish/')) {
            registration.unregister();
          }
        })
        .catch(() => {/* no-op */});
    } catch (_) { /* no-op */ }
  });
}
