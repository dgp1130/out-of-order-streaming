# Out of Order Streaming

Experimenting with out-of-order streaming using declarative shadow DOM.

Inspired by: https://mastodon.social/@passle/111709021119627922

## Demo

This demo is hosted at https://dsd-out-of-order-streaming.dwac.dev/. It
bootstraps a service worker and reloads the page. The service worker then takes
over and streams content out of order to the page. No client-side JavaScript!

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

async function getSecondSlowly(): Promise<string> {
  await new Promise((resolve) => {
    setTimeout(() => { resolve(); }, 1_000);
  });

  return 'Second';
}
```

`First` and `Third` will be displayed immediately, while `Second` will be
streamed in after a one second timeout.

(`streamInOrder` is standard streaming, but necessary to stream the root of the
document which can't leverage this out of order technique.)

The two files doing most of the work here are:
*   [`src/server.ts`](/src/server.ts) - Uses `streamOutOfOrder`.
*   [`src/streaming.ts`](/src/streaming.ts) - Implements `streamOutOfOrder`.

### Composition

We can compose multiple `streamOutOfOrder` calls in the same expression like so:

```typescript
async function* render(): AsyncGenerator<string, void, void> {
  yield* streamInOrder`
    ${streamOutOfOrder`
      <div>${first()}</div>
      ${streamOutOfOrder`
        <div>${second()}</div>
        <div>${third()}</div>
      `}
      <div>${fourth()}</div>
    `}
  `;
}
```

This still works and will parallelize all four operations. They can be rendered
in any order depending on which completes first.

This is done by generating a host element for each `streamOutOfOrder` call and
then binding the slots from the outer element to the inner element. The final
HTML looks like:

```html
<div>
  <template shadowrootmode="open">
    <div><slot name="outer_first"></slot></div>

    <div>
      <template shadowrootmode="open">
        <div><slot name="inner_second"></slot></div>
        <div><slot name="inner_third"></slot></div>
      </template>

      <!-- Binds `outer_*` slots to `inner_*` slots. -->
      <slot name="outer_second" slot="inner_second"></slot>
      <slot name="outer_third" slot="inner_third"></slot>
    </div>

    <div><slot name="outer_fourth"></slot></div>
  </template>

  <!-- Could be in any order -->
  <div slot="outer_first">First</div>
  <div slot="outer_second">Second</div>
  <div slow="outer_third">Third</div>
  <div slow="outer_fourth">Fourth</div>
</div>
```

## Caveats

This definitely isn't a comprehensive out-of-order streaming solution. There are
a few caveats to be aware of:

*   Cannot stream `<head>` content out of order. Only `<body>` content makes
    sense with DSD.
*   Cannot interpolate across a declarative shadow DOM boundary.
    *   Putting content inside a shadow root creates a new scope of slots.
        `streamOutOfOrder` automatically handles this for the shadow roots it
        creates, but it cannot detect and adapt shadow roots it is provided.
    *   Example:
        ```typescript
        streamOutOfOrder`
          <div>
            <template shadowrootmode="open">
              ${content}
            </template>
          </div>
        `;
        ```
    *   A more comprehensive parser could potentially modify input shadow roots
        to make this pattern possible.
*   This particular implementation creates a number of `<div>` elements, which
    can make styling and layout more difficult. A more intelligent parser could
    potentially put the shadow roots onto existing rendered elements and avoid
    changing the actual realized DOM structure.
*   Because each `streamOutOfOrder` call creates a new shadow root, styles are
    not inherited in child elements. Shadow DOM is providing style isolation we
    don't actually want. Styles would need to be loaded inside each shadow root,
    which can get complicated in practice.

## Internal

Some more docs related to managing this repository.

### Deployment

The demo site is hosted on Netlify and can be deployed manually with the
following command:

```shell
npm run -s netlify -- deploy -s "${SITE_ID}" --prod -m "Manual deployment."
```
