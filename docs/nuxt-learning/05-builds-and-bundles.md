# 5. The client build, SSR build, and Nitro output

## The precise mental model

People often say Nuxt creates "two bundles." That is a useful first model, but
the production pipeline has an extra step:

```text
Nuxt source
  │
  ├─ client build
  │    └─ browser JavaScript, CSS, manifests, processed assets
  │
  └─ server/SSR app build
       └─ server-executable Vue renderer and server-side component chunks
             │
             ▼
       Nitro packages the deployable server
       ├─ SSR renderer
       ├─ API/server route handlers
       ├─ server utilities and dependencies
       └─ deployment-preset adapter/entry point
```

So there are two compilation targets for the Vue application—client and
server—and Nitro then produces the deployable server output that contains the
SSR side plus backend handlers.

## What goes into the client build

The browser needs code that can run after it receives HTML:

- Vue's client runtime and Nuxt client runtime
- Hydration logic
- Vue Router and route records
- Interactive versions of normal pages/layouts/components
- Event handlers such as `@click`, `@submit`, and input bindings
- Reactive/computed behavior needed in the browser
- Client-side route middleware
- Client plugins and browser-safe dependencies
- Processed CSS and assets
- Small loaders/manifests that allow route-level chunks to be loaded on demand

In Drive Hub, examples include:

- `dashboard.vue` code needed to expand details, refresh data, navigate, and
  reactively update the template
- `useDrivingSchools` code needed when filters change or the user creates or
  deletes a school
- `AddHeader` event/navigation behavior
- CSS from `app/assets/css/main.css` and component `<style>` blocks

It must **not** include:

- Prisma client/database access
- `DATABASE_URL`
- session signing secrets
- Nitro request objects
- server services and repositories that use trusted resources
- raw source just because it exists in the repository

Code reachable from a normal Vue component is considered potentially
browser-bound unless a supported server-only boundary allows the build to
exclude it. Never rely on minification or "the method is not clicked" to hide a
secret.

## What goes into the server side

The deployed server needs:

- Nitro's runtime and request router
- The Vue SSR renderer
- Server-compiled forms of normal SSR pages, layouts, and components
- `server/api/*` handlers
- Server middleware and server plugins
- Drive Hub's services, repositories, Prisma integration, and authorization
- Server runtime configuration
- Manifests that tell the renderer which client assets correspond to rendered
  components
- Adapters/chunks required by the chosen deployment preset

This server code can use request headers, cookies, environment variables,
database connections, and filesystem/server APIs supported by its deployment
environment.

## Where does an SSR page go?

This question has two different answers.

### Where does the page's compiled code go?

For a normal interactive universal page such as
[`app/pages/dashboard.vue`](../../app/pages/dashboard.vue):

```text
dashboard.vue source
  ├─ compiled for the server -> SSR page chunk used to produce HTML
  └─ compiled for the client -> browser page chunk used to hydrate/interact
```

The source file is not simply copied into either output. Vue templates are
compiled differently for each target:

- The server version is optimized to render HTML/SSR output.
- The client version is optimized to create/hydrate VNodes, attach behavior,
  and patch the browser DOM.

### Where does the page's generated HTML go?

With request-time SSR, the HTML usually does **not** live as a permanent
`dashboard.html` build file. Nitro generates it in memory for each matching
request (or retrieves it from a configured cache) and sends it as the HTTP
response.

```text
.output server contains rendering code
            │
GET /dashboard
            │
            ▼
execute rendering code now
            │
            ▼
HTML response (per request)
```

With prerendering, the answer changes: Nuxt/Nitro executes the renderer at
build time and writes static HTML/payload artifacts into the public output.

This is the key distinction:

```text
SSR:       store renderer code; generate HTML for a request
Prerender: run renderer during build; store generated HTML
CSR:       serve app shell/assets; generate page content in browser
```

## Normal page code exists on both sides for a reason

Take this button:

```vue
<button @click="refresh()">Try again</button>
```

The server build needs to know how to output the `<button>` in the right place.
It does not attach a live browser click listener. The client build needs the
component, `refresh` closure, and Vue runtime integration so hydration can
attach that listener.

Likewise, a computed value may run:

- On the server to determine the initial HTML.
- In the browser during hydration to reconstruct expected state.
- Again later whenever its reactive dependencies change.

This is why normal setup code should be deterministic and valid in both
environments unless guarded.

## Important exceptions

### Server API code

`server/api/dashboard.get.ts` and its service/Prisma dependency graph belong to
the server output only. They never hydrate and should never enter the client
dependency graph.

### Client-only pages/components

A `.client.vue` page/component or content inside `<ClientOnly>` is not rendered
as normal content during SSR. Its browser code belongs to the client side. A
stable fallback may be SSR-rendered.

### Server-only pages/components

A `.server.vue` page/component is rendered on the server and its rendering code
can be excluded from the client build. Server components have restrictions:
they are not a general way to put arbitrary interactive UI and secrets in the
same component.

### Routes with `{ ssr: false }`

Nuxt 4 can exclude a page component from the server bundle when build-time
analysis proves every route reaching it is client-only. If a page is also
reachable through an SSR-enabled alias/child path, it may need to remain in the
server build.

### `shared/`

Code in `shared/` is intentionally eligible for both the Vue app and Nitro. It
must be portable and must not expose secrets. Drive Hub's route constants and
auth types are good examples.

## The production `.output` directory

For the default Node server preset, `npm run build` creates a deployable
`.output` directory. High-level structure:

```text
.output/
├── public/
│   ├── _nuxt/
│   │   ├── hashed browser JavaScript chunks
│   │   ├── extracted CSS
│   │   └── client build metadata/assets
│   ├── favicon.svg
│   └── robots.txt
├── server/
│   ├── index.mjs               production server entry point
│   └── chunks/
│       ├── build/              server-compiled Vue/SSR chunks
│       ├── routes/             SSR renderer/server routing chunks
│       └── ...                 Nitro handlers and dependencies
└── nitro.json                  build/preset metadata
```

The exact filenames and chunk grouping are implementation details and change
between builds. They are content-hashed, minified, split, and tree-shaken.
Never import application code from `.output`; edit source and rebuild.

The current local output illustrates both sides:

```text
.output/public/_nuxt/dashboard.<hash>.css
.output/public/_nuxt/<hash>.js
.output/server/chunks/build/dashboard-<hash>.mjs
.output/server/chunks/routes/renderer.mjs
```

The browser receives files from `.output/public`. It cannot request arbitrary
files inside `.output/server` as public assets.

## Development output versus production output

`npm run dev` prioritizes fast rebuilds, source maps, hot module replacement,
and developer diagnostics. `.nuxt/` contains generated development/build
artifacts and types. It is not the source of truth and should not be committed.

`npm run build` creates the optimized deployable `.output/`. Both directories
are disposable: delete/regenerate them to fix stale generated artifacts, but
never edit them as the implementation.

## Production request flow from the built output

With the Node preset:

```bash
NODE_ENV=production node .output/server/index.mjs
```

Then a request behaves conceptually as:

```text
GET /dashboard
  -> .output/server/index.mjs / Nitro
  -> route matching and request middleware
  -> SSR renderer chunk
  -> server-compiled dashboard page chunk
  -> internal dashboard API handler/service/Prisma
  -> HTML references browser chunks in /_nuxt/*
  -> response

GET /_nuxt/<hash>.js
  -> static file from .output/public/_nuxt

GET /api/dashboard
  -> Nitro API handler
  -> JSON response (no Vue page rendering)
```

Static assets and server/API requests share a deployment endpoint in this
setup, but their code and exposure remain separated.

## What tree-shaking can and cannot guarantee

Build tools remove or split unused code, and Nuxt understands explicit
client/server conventions. However, security must come from architectural
boundaries:

```ts
// Safe location: server/api or another server-only dependency graph
const secret = useRuntimeConfig().session.password
```

Do not import a server utility into `app/` and hope a branch removes it:

```ts
// Bad boundary even if guarded later
import prisma from '../../server/utils/prisma'
```

Use an API handler as the boundary. Client code sends permitted input; server
code reads secrets, authorizes, accesses the database, and returns a safe DTO.

## Source-to-target map for Drive Hub

| Source | Client build | Server output | Notes |
| --- | --- | --- | --- |
| `app/pages/dashboard.vue` | Yes | Yes, SSR form | Normal universal interactive page. |
| `app/layouts/default.vue` | Yes | Yes, SSR form | Rendered and hydrated around pages. |
| `app/components/AddHeader.vue` | Yes | Yes, SSR form | Markup on server, interaction in browser. |
| `app/middleware/auth.ts` | Yes | Yes | Navigation middleware can participate in both initial universal rendering and client navigation. |
| `app/composables/useDrivingSchools.ts` | Yes | Yes when imported by SSR tree | Fetch lifecycle runs according to its use context. |
| `server/api/dashboard.get.ts` | No | Yes | Nitro HTTP handler. |
| `server/services/DashboardService.ts` | No | Yes | Server-only dependency of handler. |
| `server/utils/prisma.ts` | No | Yes | Database boundary. |
| `shared/constants/routes.ts` | Potentially | Potentially | Safe shared constants; inclusion depends on imports. |
| `public/favicon.svg` | Served as-is | Hosted by Nitro/static layer | Not bundled through Vue. |
| `app/assets/css/main.css` | Extracted browser CSS | SSR uses style metadata | Processed by the builder. |

"Yes" means eligible/reachable in that target, not necessarily one dedicated
file. Bundlers can inline, merge, split, or remove code.

## Comparison with a separate React + .NET build

```text
Separate architecture
React build -> static browser files
.NET build  -> API server
SSR         -> absent unless another renderer/service is added

Nuxt architecture
Vue client build ─┐
Vue SSR build   ──┼─> coordinated Nitro .output
Nitro API build ──┘
```

The Nuxt approach reduces integration work for universal rendering, routing,
and initial data reuse. The separate approach creates a stronger organizational
and deployment boundary, may reuse an established backend ecosystem, and can
serve multiple clients independently. "Better" depends on the system rather
than bundle count.

## Further reading

- [Nuxt builders and the build-output contract](https://nuxt.com/docs/4.x/guide/going-further/builders)
- [Nuxt deployment output](https://nuxt.com/docs/4.x/getting-started/deployment)
- [Nuxt rendering modes, including server bundle behavior](https://nuxt.com/docs/4.x/guide/concepts/rendering)
- [Nuxt assets](https://nuxt.com/docs/4.x/getting-started/assets)

