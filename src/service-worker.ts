/** @fileoverview Sets up the service worker to render the index page. */

import { serveIndex } from './server.js';

self.addEventListener('fetch', (event) => {
  const evt = event as FetchEvent;

  // Only streaming the root URL.
  if (new URL(evt.request.url).pathname !== '/') return;

  evt.respondWith(serveIndex());
});

self.addEventListener('install', (event) => {
  (event as any).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting());
});

self.addEventListener('activate', (event) => {
  (event as any).waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.claim());
});
