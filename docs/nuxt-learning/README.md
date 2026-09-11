# Nuxt learning notes for Drive Hub

These notes explain the Nuxt runtime model behind this project. They assume a
background in React, browser APIs, Axios, REST, and server frameworks such as
ASP.NET Core, Spring, or Django.

The central question throughout the notes is not only "what syntax do I write?"
but also:

1. Which runtime executes this code: Nitro, the browser, or both?
2. Is this initial server rendering, hydration, or normal client-side behavior?
3. Is this a page request, a client navigation, or an API request?
4. How is data transferred from the server-rendered page to the browser?

## Reading order

1. [How Nuxt works](./01-how-nuxt-works.md)
2. [SSR and hydration](./02-ssr-and-hydration.md)
3. [Pages, routes, and per-route rendering](./03-routes-and-rendering.md)
4. [`useFetch` vs `fetch`, `$fetch`, Axios, and `useAsyncData`](./04-data-fetching.md)
5. [The client build, SSR build, and Nitro output](./05-builds-and-bundles.md)
6. [Practical experiments](./06-practical-experiments.md)
7. [Vue reactivity and lifecycle compared with React](./07-vue-reactivity-and-lifecycle.md)
8. [Nuxt and Vue Router composables compared with React](./08-nuxt-composables-and-routing.md)
9. [Drive Hub custom composables and their React equivalents](./09-drive-hub-composables.md)

## What is true in Drive Hub today

- The project uses Nuxt 4 and Vue 3.
- SSR is enabled because [`nuxt.config.ts`](../../nuxt.config.ts) does not set
  `ssr: false`.
- There are currently no `routeRules`, so normal application pages use Nuxt's
  default universal rendering.
- Files in [`app/pages/`](../../app/pages/) define Vue application routes.
- Files in [`server/api/`](../../server/api/) define server-only HTTP API
  routes under `/api`.
- [`app/app.vue`](../../app/app.vue) is the root Vue component. It renders the
  selected layout and page.
- [`app/layouts/default.vue`](../../app/layouts/default.vue) wraps pages with
  the shared header and footer.
- Pages use `useFetch` for SSR-aware read data and generally use `$fetch` for
  form submissions and other mutations.
- Nitro runs the API handlers, SSR renderer, session/authorization code,
  services, repositories, and Prisma access. The browser must never receive
  database credentials or server-only implementation code.

## One-screen mental model

```text
                        one Nuxt source project
                                  │
                    nuxt build / development build
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
        browser-facing build                 server-facing build
      Vue runtime, hydration,               Nitro, API handlers,
      event handlers, router,               SSR renderer, services,
      styles and public assets              repositories, secrets
                 │                                 │
                 └──────── coordinated by Nuxt ────┘
```

"Two builds" does not mean two unrelated applications. They are two execution
targets compiled from one component tree. A normal page component can
contribute code to both targets: a server-compiled form renders its first HTML,
and a client-compiled form hydrates that HTML and handles later interactions.

## Terminology used in these notes

| Term | Meaning |
| --- | --- |
| Nitro | Nuxt's server engine and deployable server runtime. |
| SSR | Executing the Vue application on the server to produce HTML for a request. |
| Universal rendering | The normal Nuxt mode in which an initial page is rendered on the server and then hydrated in the browser. |
| Hydration | Vue connecting the browser runtime to server-created DOM using the same component tree and transferred state. |
| CSR | Rendering a view in the browser instead of producing its HTML on the server. |
| Payload | Serialized Nuxt data/state sent with an SSR or prerendered response so the browser can restore the same state. |
| Client navigation | A route change handled by Vue Router after the application is hydrated, without requesting a whole new HTML document. |
| Full navigation | A browser document request, such as typing a URL, refreshing, or following a non-intercepted external link. |

## Official references

- [Nuxt 4 introduction](https://nuxt.com/docs/4.x/getting-started/introduction)
- [Nuxt 4 directory structure](https://nuxt.com/docs/4.x/directory-structure)
- [Nuxt rendering modes](https://nuxt.com/docs/4.x/guide/concepts/rendering)
- [Nuxt data fetching](https://nuxt.com/docs/4.x/getting-started/data-fetching)
