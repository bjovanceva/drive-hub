# 2. SSR and hydration

## SSR: what it is

Server-side rendering means executing the Vue component tree on a server to
produce HTML for a browser's document request.

It is a rendering technique, not the same thing as an API and not the same
thing as hosting a static HTML file.

```text
GET /schools/12
      │
      ▼
run Vue page setup on the server
      │
      ▼
resolve render-time data
      │
      ▼
render Vue virtual DOM to an HTML string
      │
      ▼
HTTP response containing useful page HTML
```

With a traditional React SPA, the initial server may return something close to:

```html
<div id="root"></div>
<script src="/assets/app.js"></script>
```

The browser must download and run JavaScript before React can construct most of
the visible page. A simplified Nuxt SSR response can already contain:

```html
<main>
  <h1>City Drive School</h1>
  <p>Skopje</p>
</main>
```

It also references client JavaScript and includes or references serialized
Nuxt payload data. The exact production HTML is optimized and should not be
treated as a hand-authored stable format.

## Why SSR exists

SSR can improve:

- First content display because the browser can paint returned HTML before the
  client application has finished starting.
- Search and social discovery because meaningful content and metadata are
  present in the document response.
- Per-request rendering because the server can use cookies, authentication, or
  request headers before generating a page.

SSR also has costs:

- The server performs work for page requests unless a response is cached or
  prerendered.
- Component code must be valid for the server environment.
- The browser still needs client JavaScript for interactivity.
- Server and client output must agree closely enough to hydrate.
- Slow blocking data makes time-to-first-byte slower even if the final response
  is complete.

SSR is therefore a trade, not a free performance switch. Public content pages
usually benefit strongly. A private, interaction-heavy dashboard may benefit
less from SEO, but SSR can still provide a complete initial view and consistent
session-aware rendering.

## SSR is not these other things

| Concept | What it does | When it happens |
| --- | --- | --- |
| SSR | Produces HTML from Vue on a server. | Initial/full document request. |
| Prerendering/SSG | Produces HTML ahead of requests. | Build time. |
| Hydration | Attaches the browser Vue runtime to SSR DOM. | Browser startup after SSR HTML arrives. |
| CSR | Produces or updates UI in the browser. | Initial SPA render or after startup/navigation. |
| API handler | Produces an HTTP response, commonly JSON. | Whenever the endpoint is requested. |

An API handler can participate in SSR, but it is not itself SSR:

```text
page SSR -> calls /api/dashboard -> receives JSON -> renders that JSON as HTML
```

## Hydration: the missing half of universal rendering

SSR HTML is immediately displayable, but HTML alone does not contain Vue's
reactivity or JavaScript event listeners. Hydration is how Vue activates it.

Suppose the source component is:

```vue
<script setup lang="ts">
const count = ref(0)
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

SSR can send a button that says `Count: 0`. The HTML does not encode the
function for `@click`. During hydration, the browser-side Vue application:

1. Executes/reconstructs the same component tree with transferred state.
2. Walks the DOM that the server already produced.
3. Matches Vue's expected nodes with existing nodes.
4. Connects reactive state and attaches the click listener.

After that, clicking changes the reactive value and Vue patches the DOM. That
later update is normal client reactivity, not hydration.

```text
server                                browser
───────────────────────────           ─────────────────────────────
render component tree                 parse and paint HTML
serialize relevant state     ───────>  restore same initial state
emit client asset links      ───────>  load client build
                                      match component tree to DOM
                                      attach event handlers
                                      ── hydration complete ──
                                      handle clicks/navigation/updates
```

## What gets transferred

Conceptually, the response supplies three pieces:

```text
HTML
+ client asset references
+ serialized Nuxt payload/state
```

The payload is why `useFetch` matters. If `/api/dashboard` resolves during SSR,
Nuxt records that async data for the page. In the browser, the corresponding
`useFetch` can restore the server result instead of immediately issuing the
same request again.

Not all server memory is serialized. Local variables in a Nitro service,
database connections, request objects, and secrets stay on the server. Only
state that participates in a Nuxt serialization mechanism is transferred.
Serialization also means values cross a boundary: do not return database
clients, functions, DOM nodes, or arbitrary class behavior as page payload.

## Drive Hub example: `/dashboard`

[`app/pages/dashboard.vue`](../../app/pages/dashboard.vue) contains:

```ts
const { data, error, status, refresh } =
  await useFetch<DashboardResponse>('/api/dashboard')
```

On a full authenticated request, the flow is:

```text
1. Browser sends GET /dashboard with its session cookie.
2. Nitro starts rendering pages/dashboard.vue.
3. The auth route middleware evaluates the session-aware navigation.
4. useFetch requests /api/dashboard in the SSR request context.
5. server/api/dashboard.get.ts calls requireOrdinaryUser(event).
6. DashboardService queries Prisma and creates a role-specific response.
7. useFetch stores that result in Nuxt async data.
8. dashboard.vue renders names, progress, lessons, and assignments to HTML.
9. Nuxt sends that HTML plus the serialized async-data result.
10. The browser paints it and hydrates using the same dashboard data.
11. @click="refresh()", <details>, links, and other behavior become active.
```

Step 10 is hydration. Step 6 is data access. Step 8 is SSR. A later `refresh()`
is a new client-side fetch and reactive render; it is not a second hydration.

## Hydration mismatch

A hydration mismatch means the browser-side component's expected initial
output differs from the DOM rendered by the server.

```text
server expected/rendered:  <p>Random: 0.123</p>
browser initially expects: <p>Random: 0.849</p>
```

Vue may warn, discard/recreate some DOM, lose performance, or produce subtle
visual and interaction bugs.

### Frequent causes

#### Non-deterministic render values

```vue
<!-- Incorrect for shared initial rendering -->
<p>{{ Math.random() }}</p>
```

The server and browser generate different values. Use SSR-aware state when the
value must survive the boundary:

```ts
const randomValue = useState('example-random', () => Math.random())
```

#### Browser-only APIs during SSR

```ts
// Fails on the server: localStorage is not defined there.
const theme = localStorage.getItem('theme')
```

If this truly belongs only in the browser:

```ts
const theme = ref('light')

onMounted(() => {
  theme.value = localStorage.getItem('theme') ?? 'light'
})
```

Use cookies or another universal source when the server must render the same
preference. `onMounted` runs after the component is mounted in the browser, not
during SSR.

#### Time-zone or time-sensitive rendering

The server and browser may have different clocks or zones. Drive Hub avoids
part of this ambiguity by explicitly specifying `Europe/Skopje` in dashboard
formatters. Values can still cross a minute boundary, so rapidly changing
"time ago" text needs careful handling.

#### Client-only conditions changing the initial tree

Do not make the server render one structure and the browser immediately expect
another based on `window.innerWidth`. Prefer CSS media queries, or use
`<ClientOnly>` with a stable fallback when browser-only rendering is intended.

#### Mutating external state in component setup

Component setup can run once for SSR and again while the browser creates the
hydrating application. Side effects such as analytics, writes, or mutations do
not belong there unless designed for both contexts. Put browser-only effects in
`onMounted`; put server mutations behind explicit API requests.

## Does hydration download HTML again?

No. Hydration uses the DOM parsed from the document response. It loads the
client JavaScript chunks and restores state, but it does not normally request
the same HTML again or rebuild the entire document from scratch.

## Does hydration call every API again?

It should not immediately repeat SSR-aware `useFetch`/`useAsyncData` calls whose
results exist in the Nuxt payload. A raw `$fetch`, native `fetch`, or Axios call
placed directly in component setup has no automatic Nuxt payload contract, so
it can run once on the server and again during browser startup.

## Does a page keep hydrating forever?

No. Hydration is a startup transition. Once complete, the page is an ordinary
reactive Vue application until a full document load starts the lifecycle again.

## React comparison

React's broad concepts are similar:

- Server rendering produces HTML.
- `hydrateRoot` attaches React behavior to existing server DOM.
- The server and client initial trees must match.
- Frameworks such as Next.js add routing, server data transport, and build
  boundaries around React.

The main conceptual comparison is therefore Nuxt to Next.js/Remix rather than
Nuxt to a bare Create React App/Vite SPA. Vue's API and Nuxt's payload details
differ, but the two-phase idea—server HTML followed by client activation—is the
same.

## Further reading

- [Nuxt rendering modes](https://nuxt.com/docs/4.x/guide/concepts/rendering)
- [Nuxt hydration best practices](https://nuxt.com/docs/4.x/guide/best-practices/hydration)
- [Vue SSR hydration](https://vuejs.org/guide/scaling-up/ssr.html#client-hydration)
- [Nuxt `useHydration` (advanced)](https://nuxt.com/docs/4.x/api/composables/use-hydration)

