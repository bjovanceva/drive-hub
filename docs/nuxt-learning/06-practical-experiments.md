# 6. Practical experiments

These exercises make the server/browser boundary visible. They are designed
for the current Drive Hub repository.

## Before starting

Install dependencies and start Nuxt:

```bash
npm install
npm run dev
```

Use the URL printed by Nuxt, normally `http://localhost:3000`.

## Experiment 1: prove that SSR returned page content

Open a second terminal:

```bash
curl -s http://localhost:3000/ | less
```

Search inside the response for a visible landing-page heading. If the heading
is in the document response, it existed before browser JavaScript ran.

Compare this with the response for an API:

```bash
curl -i http://localhost:3000/api/categories
```

Expected conceptual difference:

```text
GET /                 -> HTML document, payload, script/style references
GET /api/categories   -> serialized data response, no Vue page hydration
```

An authenticated route may redirect or return an authentication-aware result
without a session cookie. That itself demonstrates that the server participates
before the browser application starts.

## Experiment 2: disable JavaScript

In browser developer tools, disable JavaScript and perform a full refresh on a
public page such as `/schools` or `/categories`.

Observe:

- Server-rendered text and links can still be visible.
- Vue event handlers, client transitions, and reactive updates do not work.
- A normal link may still perform a full browser navigation.

This separates SSR from hydration:

```text
visible content with JS disabled = SSR HTML
interactivity that disappeared   = client runtime/hydration
```

Re-enable JavaScript after the experiment.

## Experiment 3: see full navigation versus client navigation

Open the browser Network panel and enable "Preserve log."

1. Paste `http://localhost:3000/schools` into the address bar.
2. Observe a request whose type is `document`.
3. Click an internal school link rendered with `<NuxtLink>`.
4. Observe route chunks/data requests, but normally no new full `document`
   request.
5. Refresh the school detail page.
6. Observe a new `document` request and server rendering.

This proves that an SSR-capable route can still be visited through
client-side rendering after the initial hydration.

## Experiment 4: inspect the Nuxt payload

This project enables Nuxt DevTools in `nuxt.config.ts`.

1. Open a page that uses `useFetch`, such as `/schools/:id`.
2. Open Nuxt DevTools.
3. Inspect the Payload/Async Data views.
4. Find data corresponding to the school and vehicles requests.
5. Compare it with the page's rendered content.

The important relationship is:

```text
server useFetch result
      ├─ used to render HTML
      └─ serialized as Nuxt payload
                       └─ restores browser data ref during hydration
```

Do not treat payload data as secret; the browser user can inspect it.

## Experiment 5: verify that initial `useFetch` is not duplicated

Use the Network panel with a cold full load of a public detail page:

1. Clear the log.
2. Load `/schools/<valid-id>` by typing it into the address bar.
3. Look for browser XHR/fetch calls to
   `/api/driving-schools/<id>` immediately after the HTML response.

Because those `useFetch` calls run for SSR and transfer their data in the Nuxt
payload, the browser should not need to repeat the same initial calls solely for
hydration.

Then navigate to another page client-side or call `refresh()`. An API request
at that point is expected: it is post-hydration client behavior.

Development tools/modules can add requests, so classify each network entry by
initiator and URL rather than assuming every request came from the page.

## Experiment 6: inspect the production targets

Build the app:

```bash
npm run build
```

Inspect the two output areas:

```bash
find .output/public -maxdepth 2 -type f | sort | less
find .output/server -maxdepth 3 -type f | sort | less
```

Look for:

- Hashed `.js` and `.css` files under `.output/public/_nuxt`.
- Server page/style chunks under `.output/server/chunks/build`.
- The Nitro renderer under `.output/server/chunks/routes`.
- Server/service/API chunks outside the public directory.
- `.output/server/index.mjs`, the Node server entry point.

Do not expect filenames to match this document exactly. Hashes and chunk
splitting change whenever the source or build tool changes.

Run the production build locally:

```bash
NODE_ENV=production node .output/server/index.mjs
```

Visit the printed/local address and repeat the HTML and network experiments.
Stop the server with `Ctrl+C`.

## Experiment 7: trace `/dashboard` end to end

Read these files in order:

1. [`app/pages/dashboard.vue`](../../app/pages/dashboard.vue)
2. [`app/middleware/auth.ts`](../../app/middleware/auth.ts)
3. [`server/api/dashboard.get.ts`](../../server/api/dashboard.get.ts)
4. [`server/utils/authorization.ts`](../../server/utils/authorization.ts)
5. [`server/services/DashboardService.ts`](../../server/services/DashboardService.ts)
6. [`server/utils/prisma.ts`](../../server/utils/prisma.ts)

For each file, label it:

| File | Runtime | Responsibility |
| --- | --- | --- |
| page | Server and browser | Render UI, own reactive presentation state |
| route middleware | Universal/client navigation | Redirect unsuitable page navigation |
| API handler | Server only | Establish HTTP/auth boundary |
| authorization helper | Server only | Validate trusted session/database role |
| service | Server only | Create dashboard domain DTO |
| Prisma helper | Server only | Access database |

Then trace the result back upward:

```text
Prisma records
 -> DashboardService response
 -> API JSON/serialized value
 -> useFetch data ref and Nuxt payload
 -> dashboard computed values/template
 -> SSR HTML
 -> hydrated interactive dashboard
```

## Experiment 8: compare an SSR read with a mutation

Read [`app/composables/useDrivingSchools.ts`](../../app/composables/useDrivingSchools.ts).

Mark these phases:

```text
useFetch GET
  -> initial render data
  -> can execute during SSR
  -> payload reuse during hydration

$fetch POST or DELETE
  -> only called from create/delete function
  -> user/action-triggered mutation
  -> request.refresh() reloads authoritative list
```

In the browser Network panel, perform a permitted mutation in a development
database. You should see the mutation followed by a GET refresh. Only do this
with disposable/test data because deletion is a real server operation.

## Experiment 9: intentionally observe a hydration warning (optional)

Do this only on a temporary branch or with an immediately reversible local
edit. Put a nondeterministic value in a small public page template:

```vue
<p>Hydration test: {{ Math.random() }}</p>
```

Full-refresh the route and inspect the browser console. The server and browser
are likely to produce different values, causing a hydration warning.

Then replace it with SSR-aware state:

```ts
const hydrationTest = useState('hydration-test', () => Math.random())
```

```vue
<p>Hydration test: {{ hydrationTest }}</p>
```

The server value is serialized and restored in the browser, so both initial
renders agree. Remove all experiment code afterward.

## Experiment 10: test a client-only route rule safely

On a temporary branch, add:

```ts
export default defineNuxtConfig({
  // existing configuration...
  routeRules: {
    '/categories': { ssr: false }
  }
})
```

Restart the dev server, request `/categories`, and compare:

- The raw document response
- Behavior with JavaScript disabled
- Network requests after the browser app starts
- The normal SSR behavior after removing the rule

This makes `{ ssr: false }` concrete: the route still exists, but its Vue
content is produced in the browser.

## Questions you should be able to answer afterward

1. Why is `/dashboard` both a server-renderable page and an interactive browser
   component?
2. Why is `/api/dashboard` not hydrated?
3. Why does route middleware not replace API authorization?
4. Why can `useFetch` avoid a browser request during hydration?
5. Why is `$fetch` more appropriate for `POST`/`DELETE` actions?
6. Where is the compiled dashboard page on the server, and why is there no
   permanent `dashboard.html` for request-time SSR?
7. Which Drive Hub source files must never enter the public client bundle?
8. What changes when navigation happens through `<NuxtLink>` rather than a page
   refresh?

