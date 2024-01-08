# Out of Order Streaming

Experimenting with out-of-order streaming using declarative shadow DOM.

Inspired by: https://mastodon.social/@passle/111709021119627922

## Demo

This demo is hosted at https://dsd-out-of-order-streaming.dwac.dev/. It
bootstraps a service worker and reloads the page. The service worker then takes
over and streams content out of order to the page.

## Internal

Some more docs related to managing this repository.

### Deployment

The demo site is hosted on Netlify and can be deployed manually with the
following command:

```shell
npm run -s netlify -- deploy -s "${SITE_ID}" --prod -m "Manual deployment."
```
