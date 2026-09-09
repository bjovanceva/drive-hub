# 3. Pages, routes, and per-route rendering

## Two separate decisions

It helps to separate:

1. **Which component handles a URL?** File-based application routing answers
   this from `app/pages/`.
2. **How should the server produce that route?** Global `ssr` and Nitro
   `routeRules` choose SSR, client-only rendering, prerendering, or caching.

Defining `app/pages/dashboard.vue` creates `/dashboard`; it does not by itself
opt the route out of SSR. In the current project, that page is universally
rendered because SSR is enabled globally and no route rule says otherwise.

## Application route definitions

Nuxt converts page filenames into Vue Router records:

| Source file | Application URL |
| --- | --- |
| `app/pages/index.vue` | `/` |
| `app/pages/login.vue` | `/login` |
| `app/pages/dashboard.vue` | `/dashboard` |
| `app/pages/schools/index.vue` | `/schools` |
| `app/pages/schools/[id].vue` | `/schools/:id` |
| `app/pages/schools/[id]/cars/create.vue` | `/schools/:id/cars/create` |

`[id]` is a dynamic segment. The page reads it through `useRoute()`:

```ts
const route = useRoute()
const schoolId = computed(() => Number(route.params.id))
```

This resembles a React Router route like `path="schools/:id"`, except Nuxt
derives the route record from the filesystem.

## Nested pages are component nesting, not just path nesting

This project has both:

```text
app/pages/schools/[id].vue
app/pages/schools/[id]/cars/create.vue
app/pages/schools/[id]/categories/add.vue
```

Because `[id].vue` is the parent page, it needs a `<NuxtPage>` outlet where a
child can render. Drive Hub conditionally renders the school detail UI for the
exact parent URL and uses:

```vue
<NuxtPage v-else />
```

for child URLs. This is similar to a React Router parent element containing an
`<Outlet />`.

## API route definitions

Nuxt also scans `server/api/`, but those are Nitro handlers rather than pages:

```ts
// server/api/driving-schools/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  // validate, authorize, call service...
})
```

That maps to `GET /api/driving-schools/:id`. A `.post.ts`, `.patch.ts`, or
`.delete.ts` suffix maps the same path shape to a different HTTP method.

Do not confuse a rendering rule for `/dashboard` with an API rule for
`/api/dashboard`. Page rendering and API behavior are separate.

## Global SSR

Nuxt uses universal rendering by default. The project currently has no `ssr`
property, which is equivalent to leaving SSR enabled.

To make the entire Vue application a client-rendered SPA:

```ts
export default defineNuxtConfig({
  ssr: false
})
```

That is a global architectural choice. It does not merely switch off one
endpoint. Nitro server APIs can still exist in a server deployment, but the Vue
application no longer asks Nitro to render its page HTML.

## Per-route rendering with `routeRules`

Hybrid rendering uses `routeRules` in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/schools/**': { ssr: true },
    '/dashboard/**': { ssr: false },
    '/api/**': { cors: true }
  }
})
```

Interpretation:

- `/` is produced at build time and served as a static asset.
- `/schools` and descendants can be rendered on the server per document
  request. (`ssr: true` is redundant with the current default but documents the
  intention or can override a broader rule.)
- `/dashboard` and descendants render their Vue UI only in the browser.
- `/api/**` receives a server-response policy; this is not page SSR.

Drive Hub does **not** currently contain these rules. The snippet is a teaching
example, not a recommendation already applied to the app.

### Common route-rule properties

| Rule | Effect |
| --- | --- |
| `{ ssr: false }` | Do not server-render the matching Vue pages; render them in the browser. |
| `{ prerender: true }` | Generate matching page output at build time. |
| `{ swr: 3600 }` | Cache a server response and allow stale-while-revalidate behavior for the specified time. |
| `{ isr: 3600 }` | Use supported platform/CDN incremental regeneration semantics. |
| `{ redirect: '/new' }` | Return/perform a redirect for the matching path. |
| `{ headers: { ... } }` | Add response headers. |

Caching semantics depend on Nitro's deployment preset/platform, so do not
choose `swr` or `isr` from the name alone. Authentication and user-specific HTML
need especially careful cache keys/policies to avoid leaking one user's page to
another.

## Which strategy fits which Drive Hub page?

This is a design analysis, not a change to the current configuration.

| Route | Plausible strategy | Reasoning |
| --- | --- | --- |
| `/` | SSR or prerender | Public landing content benefits from fast HTML and indexing. Prerender works if content is not request-specific. |
| `/schools` | SSR, SWR, or carefully prerendered | Public directory content benefits from HTML, but freshness and query filters matter. |
| `/schools/:id` | SSR or cache with invalidation | Public, indexable content; data changes after admin operations. |
| `/login`, `/register` | SSR or CSR | Little SEO value, but universal rendering is simple and produces a quick shell. |
| `/dashboard` | SSR or CSR | Private and user-specific. SSR can render a ready initial view; CSR reduces server rendering work but shows a loading state and adds a browser request waterfall. Never publicly cache it. |
| `/administration` | Often CSR is reasonable | Private, highly interactive, and not indexable. SSR is still valid if a complete first view is valuable. |

There is no universal rule that "dashboards must be CSR." The decision is based
on first-load experience, server cost, caching, browser-only dependencies, and
complexity—not SEO alone.

## Page suffixes and component boundaries

Nuxt 4 supports explicit build/runtime boundaries:

- `example.client.vue` is client-only and its contents are not SSR-rendered.
- `example.server.vue` is a server-only page/component pattern with important
  interaction and nesting constraints.
- `<ClientOnly>` renders enclosed content only on the client, with an optional
  server fallback.
- `import.meta.client` and `import.meta.server` allow guarded code paths.

Use these deliberately. Making a large page client-only merely to work around a
single browser-only library discards SSR for the whole subtree. Often the better
design is to isolate that library in a small client-only component.

## Route middleware is not server middleware

Drive Hub's page:

```ts
definePageMeta({ layout: 'default', middleware: 'auth' })
```

selects `app/middleware/auth.ts`, a Nuxt route middleware. It participates in
Vue application navigation. It can run in the universal lifecycle, but its job
is navigation/redirect behavior.

By contrast, `server/middleware/*` (none currently present here) runs in Nitro
for server requests. API authorization belongs in server handlers/utilities,
not solely in Vue route middleware.

```text
route middleware                       server authorization
──────────────────────────────────     ─────────────────────────────────
improves navigation UX                 establishes actual security boundary
may redirect away from a page          rejects unauthorized HTTP calls
cannot stop a direct API client        evaluates trusted server-side session
```

## Rendering choice decision tree

```text
Does the initial content need request-specific server data?
├─ no
│  ├─ content changes only on deploy -> consider prerendering
│  └─ rich app, HTML not important    -> CSR may be enough
└─ yes
   ├─ should initial response contain the content? -> SSR
   └─ acceptable to fetch after browser boot?      -> CSR

Then independently ask:
- Can the response be cached safely?
- Is it public or user-specific?
- Does browser-only code prevent universal execution?
- How fresh must the result be?
```

## Common mistakes

### Putting `ssr: true` inside `definePageMeta`

Rendering strategy is normally expressed through Nuxt config route rules, not
ordinary page metadata:

```ts
// nuxt.config.ts
routeRules: {
  '/schools/**': { ssr: true }
}
```

### Assuming `ssr: false` disables the `/api` server

It disables server rendering for the matching Vue application route. API
availability depends on whether a Nitro server is included and deployed. A
pure static `nuxt generate` deployment does not include a live server.

### Confusing prerendering with SSR on every request

Both can return finished HTML. SSR generates it at request time; prerendering
generates it during the build. That changes freshness, hosting, and access to
request-specific cookies.

### Publicly caching authenticated pages

Never add broad SWR/ISR caching to `/dashboard` or `/administration` without a
carefully designed user-aware cache. The safe default is no shared HTML cache.

## Further reading

- [Nuxt pages directory and dynamic routes](https://nuxt.com/docs/4.x/directory-structure/app/pages)
- [Nuxt rendering modes and route rules](https://nuxt.com/docs/4.x/guide/concepts/rendering)
- [Nuxt prerendering](https://nuxt.com/docs/4.x/getting-started/prerendering)
- [Nuxt server directory](https://nuxt.com/docs/4.x/directory-structure/server)

