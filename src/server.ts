/** @fileoverview Simple server embedded in a service worker. */

import { streamInOrder, streamOutOfOrder } from './streaming.js';

export function serveIndex(): Response {
  return new Response(readableStreamFromGenerator(renderHtml()), {
    headers: {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked',
    },
  });
}

function readableStreamFromGenerator(
  generator: AsyncGenerator<string, void, void>,
): ReadableStream {
  return new ReadableStream<string>({
    async start(controller: ReadableStreamController<any>): Promise<void> {
      const encoder = new TextEncoder();
      for await (const chunk of generator) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

async function* renderHtml(): AsyncGenerator<string, void, void> {
  yield* streamInOrder`
<!DOCTYPE>
<html>
  <head>
    <title>Out of Order Streaming Demo</title>
    <meta charset="utf8">
  </head>
  <body>
    <h1>Out of Order Streaming Demo</h1>

    ${streamOutOfOrder`
      <header>
        <h2>${title()}</h2>
      </header>

      <main>
        ${content()}
      </main>

      <footer>Copyright ${year()}</footer>
    `}
  </body>
</html>
  `;
}

async function title(): Promise<string> {
  await timeout(2_000);
  return `Hello, World!`;
}

async function content(): Promise<string> {
  await timeout(1_000);
  return 'This is some interesting text content.';
}

function year(): string {
  return new Date().getFullYear().toString();
}

function timeout(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => { resolve(); }, ms);
  });
}
