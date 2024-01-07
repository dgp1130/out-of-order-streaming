/** @fileoverview Registers the service worker and reloads the page. */

await navigator.serviceWorker.register('/service-worker.js', {
  type: 'module',
});

await new Promise<void>((resolve) => {
  setTimeout(() => { resolve(); }, 1_000);
});

console.log('Service worker installed, reloading!');
location.reload();
