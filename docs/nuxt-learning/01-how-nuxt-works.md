# 1. How Nuxt works

## The short version

Nuxt is a framework around Vue that coordinates three jobs:

1. It builds and runs a Vue application.
2. It builds and runs a Nitro server.
3. It transfers routing, rendered HTML, and state between those runtimes so an
   initially server-rendered page becomes a client-side application.

This is why Nuxt is more than "Vue with a router" and is also not exactly a
frontend plus a completely separate backend. One source project describes a
system whose code has multiple execution targets.

```text
Nuxt project
├── app/                 Vue application source
│   ├── app.vue          root component
│   ├── pages/           application/page routes
│   ├── layouts/         persistent page wrappers
│   ├── components/      UI building blocks
│   ├── composables/     reusable reactive behavior
│   └── middleware/      Vue Router navigation guards
├── server/              Nitro-only source
│   ├── api/             /api/* HTTP handlers
│   ├── services/        application/domain operations in this project
│   ├── repositories/    data-access abstractions in this project
│   └── utils/           server helpers, including Prisma and authorization
├── shared/              code deliberately usable by app and server
├── public/              files served as-is
└── nuxt.config.ts       Nuxt/build/runtime configuration
```

The names `services/` and `repositories/` are Drive Hub's architecture, not
special Nuxt directories. By contrast, `app/pages/` and `server/api/` are
scanned by Nuxt and have framework-defined behavior.

## The two kinds of routes

Drive Hub contains two route systems that can share similar URLs but have
different purposes.

### Application routes

A file in `app/pages/` defines a UI route:

```text
app/pages/index.vue                          -> /
app/pages/dashboard.vue                      -> /dashboard
app/pages/schools/[id].vue                   -> /schools/:id
app/pages/schools/[id]/cars/create.vue       -> /schools/:id/cars/create
```

These routes render Vue component trees. A full request may SSR them; after
hydration, Vue Router can navigate between them in the browser.

### Server/API routes

A file in `server/api/` defines an HTTP handler:

```text
server/api/dashboard.get.ts                         -> GET /api/dashboard
server/api/driving-schools/index.get.ts              -> GET /api/driving-schools
server/api/driving-schools/[id].get.ts               -> GET /api/driving-schools/:id
server/api/driving-schools/[id]/vehicles.post.ts     -> POST /api/driving-schools/:id/vehicles
```

The suffix restricts the HTTP method. These handlers return data or HTTP
responses; they are not Vue pages and are not hydrated.

An ASP.NET Core comparison is useful:

```text
Nuxt/Nitro                              ASP.NET Core
─────────────────────────────────────   ─────────────────────────────────
server/api/dashboard.get.ts             [HttpGet("/api/dashboard")]
defineEventHandler(event => ...)         controller/minimal API handler
server middleware                       ASP.NET middleware
event/context                            HttpContext
createError({ statusCode: 401 })         unauthorized/error response
```

The analogy stops at the Vue renderer: Nitro also hosts Nuxt's server-rendering
entry point, while a separate ASP.NET API often returns only JSON to a separate
React build.

## What happens on a full page request

Consider opening `/schools/12` directly.

```text
Browser
  │
  │ GET /schools/12 (document request)
  ▼
Nitro server
  │
  ├─ matches the Nuxt application renderer
  ├─ resolves app/pages/schools/[id].vue
  ├─ builds the Vue component tree:
  │    app.vue
  │      └─ default layout
  │           └─ schools/[id].vue
  ├─ runs page setup for SSR
  ├─ useFetch calls internal /api/driving-schools/12 and /vehicles handlers
  ├─ handlers validate, authorize, call services/repositories/Prisma
  ├─ waits for SSR data
  ├─ Vue renders the tree to HTML
  └─ Nuxt includes serialized payload and client asset references
  │
  ▼
Browser receives HTML + payload references + client JS
  │
  ├─ paints meaningful HTML
  ├─ loads the Vue/Nuxt client build
  └─ hydrates the existing DOM
```

During SSR, a relative `useFetch('/api/...')` can call the Nitro handler
internally rather than making a public network round trip back to the same
server. It is still useful to think of the API boundary as a real HTTP contract:
the browser will call that URL normally during later client-side navigation or
refreshes.

## The component tree in this project

[`app/app.vue`](../../app/app.vue) contains:

```vue
<NuxtLayout>
  <NuxtPage />
</NuxtLayout>
```

At `/dashboard`, the conceptual tree is:

```text
app.vue
└── NuxtLayout
    └── layouts/default.vue
        ├── AddHeader
        ├── <slot>
        │   └── pages/dashboard.vue
        └── AppFooter
```

`<NuxtPage>` is the outlet for the page matched by Vue Router. It plays a role
similar to React Router's `<Outlet>`. `<NuxtLayout>` selects a layout and passes
the page into its `<slot>`.

The same tree matters twice for a normal initial request:

- The SSR-compiled version runs on the server to generate HTML.
- The client-compiled version runs in the browser to hydrate and stay active.

That does **not** mean every line safely runs in both places. Browser globals
such as `window`, `document`, and `localStorage` do not exist during SSR. Server
secrets and database code must never be imported into browser-reachable source.

## Full navigation versus client navigation

This distinction explains many apparent inconsistencies.

### Full navigation

Typing `/dashboard` into the address bar or refreshing it creates a document
request:

```text
browser -> Nitro -> SSR -> full HTML -> hydration
```

### Client navigation

Clicking a `<NuxtLink>` after hydration is normally intercepted by Vue Router:

```text
hydrated browser app
  -> load the next page's client chunk if needed
  -> load its data/payload
  -> render the next component in the browser
```

The entire page document and header/footer do not need to be reloaded. A later
route can therefore be rendered client-side even though refreshing that same URL
would SSR it. "This route supports SSR" describes how the server can answer a
document request; it does not require every visit to perform a new full SSR
round trip.

## Why use Nuxt instead of a plain React/Vue SPA plus a separate API?

Nuxt is not universally better. It is better when its integrated concerns match
the product's needs.

| Concern | Nuxt universal app | SPA + separate API |
| --- | --- | --- |
| First page content | Server can return already rendered content. | Usually waits for JS boot and browser fetches. |
| SEO/social crawlers | Content and metadata can be in the document response. | Requires crawler JS support or separate prerendering. |
| Routing | Pages and server endpoints can be file-defined in one project. | Frontend and backend routing are configured independently. |
| Data transfer | Nuxt can serialize SSR data and reuse it during hydration. | The SPA normally fetches its initial data after boot. |
| Deployment | One Nitro output can host SSR and API code. | Frontend and API commonly have separate build/deploy pipelines. |
| Runtime complexity | Code must respect server/browser boundaries and hydration. | Frontend code generally assumes the browser only. |
| Backend ecosystem | Convenient for a TypeScript full-stack app. | .NET/Spring may be stronger for an existing enterprise domain/backend. |
| Independent scaling | Possible, but an integrated app couples some concerns. | UI and API can be versioned and scaled independently. |

For Drive Hub, Nuxt is useful because public school pages can arrive as HTML,
authenticated screens retain an SPA-like experience after hydration, and API
handlers can live beside the UI. A separate .NET or Spring service would still
be reasonable if the domain grew into multiple clients or needed an existing
backend platform. Nuxt could then remain the SSR frontend/BFF and call that
external service.

## A request-classification checklist

When reading code in this project, classify it before reasoning about it:

```text
Is the URL a page (/dashboard) or API (/api/dashboard)?
        │
        ├─ page
        │   ├─ full navigation -> Nitro SSR, then browser hydration
        │   └─ client navigation -> Vue Router/browser rendering
        │
        └─ API
            ├─ invoked while SSR runs -> Nitro can make an internal call
            └─ invoked in browser -> normal HTTP request to Nitro
```

Then ask whether the file is `app/`, `server/`, or `shared/`. This prevents the
most costly mistakes: accessing browser APIs during SSR, shipping secrets to the
client, and confusing navigation middleware with backend authorization.

## Common misunderstandings

### "Nitro is a separate backend application"

Nitro is a distinct runtime target, but Nuxt builds and coordinates it as part
of this application. It can also call a truly external backend when needed.

### "Every click SSRs the next page"

No. Once hydrated, internal `<NuxtLink>` navigation is usually handled in the
browser. A refresh of the destination URL SSRs it again.

### "A page file lives only on the server because the page is SSR"

Usually false. A normal interactive universal page contributes to both the SSR
and client builds. Chapter 5 explains the important exceptions.

### "Route middleware secures an API"

No. Files such as [`app/middleware/auth.ts`](../../app/middleware/auth.ts) guard
Vue navigation and improve UX. An attacker can call an API directly, so handlers
must enforce authorization too. Drive Hub does that with server-side guards such
as `requireOrdinaryUser(event)` in
[`server/api/dashboard.get.ts`](../../server/api/dashboard.get.ts).

## Further reading

- [Nuxt introduction and architecture](https://nuxt.com/docs/4.x/getting-started/introduction)
- [Nuxt 4 directory structure](https://nuxt.com/docs/4.x/directory-structure)
- [Nuxt server and Nitro](https://nuxt.com/docs/4.x/getting-started/server)
- [Nuxt pages directory](https://nuxt.com/docs/4.x/directory-structure/app/pages)

