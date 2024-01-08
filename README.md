# Out of Order Streaming

Experimenting with out-of-order streaming using declarative shadow DOM.

Inspired by: https://mastodon.social/@passle/111709021119627922

## Demo

This demo is hosted at https://dsd-out-of-order-streaming.dwac.dev/. It
bootstraps a service worker and reloads the page. The service worker then takes
over and streams content out of order to the page.

## Algorithm

This works by taking advantage of the fact that declarative shadow DOM puts
light DOM content at the _end_ of a component. Take this example:

```html
<div>
  <template shadowrootmode="open">
    <ul>
      <li>First</li>
      <li><slot name="content"></slot></li>
      <li>Third</li>
    </ul>
  </template>
  <div slot="content">Second</div>
</div>
```

Here, `Second` is moved to the _end_ of the root. Meaning `Third` can be
streamed before it.

This demo attempts to make a reusable function to generate this format
automatically. Using it looks like:

```typescript
async function* render(): AsyncGenerator<string, void, void> {
  yield* streamInOrder`
<!DOCTYPE>
<html>
  <head><!-- ... --></head>
  <body>
    ${streamOutOfOrder`
      <div>First</div>
      <div>${getSecondSlowly()}</div>
      <div>Third</div>
    `}
  </body>
</html>
  `;
}

function getSecondSlowly(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(); }, 1_000);
  });
}
```

`First` and `Third` will be displayed immediately, while `Second` will be
streamed in after a one second timeout.

(`streamInOrder` is standard streaming, but necessary to stream the root of the
document which can't leverage this out of order technique.)

The two files doing most of the work here are:
*   [`src/server.ts`](/src/server.ts) - Uses `streamOutOfOrder`.
*   [`src/streaming.ts`](/src/streaming.ts) - Implements `streamOutOfOrder`.

## Internal

Some more docs related to managing this repository.

### Deployment

The demo site is hosted on Netlify and can be deployed manually with the
following command:

```shell
npm run -s netlify -- deploy -s "${SITE_ID}" --prod -m "Manual deployment."
```
