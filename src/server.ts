/** @fileoverview Simple server embedded in a service worker. */

import { streamOutOfOrder } from './streaming.js';

export function serveIndex(): Response {
  return new Response(renderHtml(), {
    headers: {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked',
    },
  });
}

function renderHtml(): ReadableStream {
  return streamOutOfOrder`
<!DOCTYPE>
<html>
  <head>
    <title>Out of Order Streaming</title>
    <meta charset="utf8">
  </head>
  <body>
    <h1>Hello, ${'World'}!</h1>
  </body>
</html>
  `;
}
