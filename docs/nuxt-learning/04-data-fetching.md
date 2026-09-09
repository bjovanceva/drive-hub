# 4. `useFetch` versus `fetch`, `$fetch`, Axios, and `useAsyncData`

## The conclusion first

`useFetch` is usually the best fit for data a Nuxt page/component needs while it
is being rendered because it participates in SSR, Nuxt's payload, hydration,
Vue reactivity, navigation loading, refresh, and request-context forwarding.

It is not a universally better HTTP client. For an imperative action caused by
a user—submit, delete, approve, log in—`$fetch` is generally the simpler fit.
For non-HTTP async work or a custom client, wrap the operation in
`useAsyncData`. Axios remains reasonable where its client/interceptor ecosystem
is required, but Axios alone does not become SSR-payload-aware.

## Four layers that are easy to confuse

```text
native fetch
  └─ web-platform HTTP request/response API

$fetch
  └─ ofetch/Nuxt-friendly request utility
      ├─ convenient parsed response/errors/options
      └─ internal Nitro call optimization on the server

useAsyncData
  └─ manages an arbitrary async result in Nuxt's SSR/hydration lifecycle

useFetch
  └─ convenient useAsyncData + $fetch integration for HTTP data
```

Axios sits beside `$fetch` as another HTTP client. It is not underneath Nuxt's
async-data lifecycle unless you explicitly put it there.

## Capability comparison

| Capability | native `fetch` | `$fetch` | Axios | `useFetch` |
| --- | ---: | ---: | ---: | ---: |
| Make HTTP requests | Yes | Yes | Yes | Yes |
| Automatically parse common response bodies | Manual `response.json()` | Yes | Yes | Yes |
| Throw a rich error for non-2xx by default | No | Yes | Yes | Through `$fetch`/AsyncData error |
| Nitro internal API shortcut during SSR | No | Yes | No | Yes |
| Nuxt SSR payload transfer | No | No | No | Yes |
| Avoid duplicate hydration request automatically | No | No | No | Yes |
| Return Vue refs for data/status/error | No | No | No | Yes |
| `refresh`, `clear`, dedupe, watch options | No | No | No | Yes |
| Axios instances/interceptors | No | No | Yes | Not Axios; use ofetch hooks/custom `useFetch` |
| Best default for a click-triggered mutation | Possible | Yes | Possible | Usually no |
| Best default for initial page data | No | No by itself | No by itself | Yes |

"No" often means "not built in," not "impossible." You can build lifecycle and
serialization plumbing around any client. `useAsyncData` is Nuxt's standard way
to add that plumbing.

## The double-fetch problem

Consider this component setup:

```ts
const dashboard = await $fetch('/api/dashboard')
```

In a universal component, setup participates in server rendering and the
browser creates the client component tree for hydration. `$fetch` only knows it
was asked to perform a request; it does not register the result as Nuxt page
data. A naive lifecycle becomes:

```text
server setup  -> request dashboard -> render HTML
browser setup -> request dashboard again -> hydrate/update
```

This duplicates work and can make the client begin with data that differs from
the HTML. The equivalent render-time request should be:

```ts
const { data: dashboard } =
  await useFetch<DashboardResponse>('/api/dashboard')
```

Then the lifecycle is:

```text
server useFetch
  -> request data
  -> place result in Nuxt payload
  -> render HTML from result

browser useFetch during hydration
  -> find matching payload entry
  -> restore data ref
  -> do not repeat the initial request
```

## What `useFetch` returns

```ts
const {
  data,       // Ref<T | null>
  status,     // 'idle' | 'pending' | 'success' | 'error'
  error,      // Ref of the request/async error
  refresh,    // re-run the request
  execute,    // explicitly execute it
  clear       // reset/cancel async-data state
} = await useFetch<T>('/api/example')
```

These are reactive refs, not an Axios response object. Templates unwrap refs
automatically, while script normally uses `.value`:

```ts
const itemCount = computed(() => data.value?.length ?? 0)
```

## Why `useFetch` is SSR-aware

SSR-aware means more than "can run in Node."

### It registers async page/component data

Nuxt knows the request belongs to the component tree currently rendering and
can coordinate it with server rendering and client navigation.

### It serializes the result

The resolved value can be placed in Nuxt's payload. The browser restores the
same value for hydration.

### It supplies reactive lifecycle state

`data`, `status`, and `error` are Vue refs. `refresh()` reruns the operation and
updates consumers.

### It coordinates navigation

By default, async data integrates with Nuxt/Vue Suspense. On client navigation,
non-lazy data can delay completing the new route until its required data is
ready. `{ lazy: true }` or `useLazyFetch` lets navigation complete while the
page displays a pending state.

During server rendering, Nuxt waits for render-time async data so it can send a
consistent populated result. `await` is still valuable for straightforward
control flow, but it is not accurate to think that merely removing `await`
automatically makes server-rendered data lazy. Use Nuxt's `lazy`/`server`/
`immediate` options to express lifecycle behavior.

### It derives a key and can share/dedupe state

Nuxt associates calls with async-data keys. Calls using the same resolved key
share their async-data state, so options affecting that state need to be
consistent. Explicit keys are useful in abstractions; URL/options commonly
allow `useFetch` to generate one.

### It forwards the request context

During SSR, the server is making a request on behalf of an incoming browser
request. `useFetch` uses Nuxt's request-aware fetching so relevant headers such
as cookies can reach an internal API handler. Hop-by-hop or unsafe headers are
not blindly forwarded.

This is essential for Drive Hub's session-scoped endpoint:

```text
browser cookie
  -> GET /dashboard
  -> SSR useFetch('/api/dashboard')
  -> API receives the relevant request context
  -> requireOrdinaryUser(event)
```

## Drive Hub's read/mutation pattern

[`app/composables/useDrivingSchools.ts`](../../app/composables/useDrivingSchools.ts)
uses the intended separation:

```ts
const request = useFetch<DrivingSchoolDto[]>('/api/driving-schools', {
  query
})
```

The school list is render data, so it uses `useFetch`. Creation is an explicit
mutation, so it uses `$fetch`:

```ts
function createDrivingSchool(input: CreateDrivingSchoolInput) {
  return runMutation(() => $fetch<DrivingSchoolDto>(
    '/api/driving-schools',
    { method: 'POST', body: input }
  ))
}
```

After success, the composable calls:

```ts
await request.refresh()
```

This creates a clean state machine:

```text
initial page/read
  -> useFetch GET
  -> SSR payload or browser response

user submits form
  -> $fetch POST
  -> mutation succeeds
  -> refresh the useFetch GET
  -> reactive list updates
```

Using `useFetch` for the POST would imply that form submission is declarative
render-time data, risk accidental execution, and complicate control over when
the side effect occurs.

## Native `fetch`: what is missing

Native `fetch` is a lower-level browser/server API:

```ts
const response = await fetch('/api/dashboard')

if (!response.ok) {
  throw new Error(`Request failed: ${response.status}`)
}

const data = await response.json() as DashboardResponse
```

You manually own response parsing and HTTP-status handling. More importantly,
the call does not tell Nuxt to transfer the value in its hydration payload.

Native `fetch` is still useful for code intentionally independent of Nuxt, for
special streaming/standards-level control, or inside an adapter whose lifecycle
is handled elsewhere. It is not the ergonomic default for initial Nuxt page
data.

## `$fetch`: Nuxt's imperative request utility

`$fetch` returns the parsed body directly:

```ts
const result = await $fetch('/api/account/profile', {
  method: 'PATCH',
  body: form
})
```

Good uses include:

- Form submission
- Login/logout
- Create/update/delete actions
- Requests in an event handler
- A request whose result is immediately consumed rather than managed as page
  async data
- The HTTP function inside `useAsyncData`

Avoid calling `$fetch` directly at the top of universally rendered component
setup for initial data unless you intentionally handle the payload/double-run
behavior yourself.

## Axios: still an option, but not the lifecycle

Axios provides instances, interceptors, transformations, and a familiar API:

```ts
const response = await api.get<DashboardResponse>('/api/dashboard')
```

By itself, this is an HTTP operation. To make its result Nuxt SSR-aware:

```ts
const { data, status, error, refresh } = await useAsyncData(
  'dashboard',
  async () => {
    const response = await api.get<DashboardResponse>('/api/dashboard')
    return response.data
  }
)
```

Here the responsibilities are explicit:

```text
Axios        -> HTTP transport/client behavior
useAsyncData -> SSR, payload, hydration, refs, refresh
```

Be careful with relative URLs and cookies on the server. A browser Axios
instance assumes the browser's current origin and cookie behavior; SSR has no
browser origin and must deliberately forward the incoming request context.
`useFetch` handles Nuxt's internal case by default. A custom Axios setup needs
equivalent server-aware base URL/header logic.

If Axios is present only because "React projects use Axios," `$fetch`/`useFetch`
usually provides a smaller and more integrated Nuxt approach. If an
organization already has a mature Axios SDK with interceptors and generated
types, wrapping it with `useAsyncData` may be the more pragmatic design.

## `useAsyncData`: lifecycle without assuming HTTP

Use `useAsyncData` when the async operation is not simply `$fetch(url,
options)`, or when multiple sources must be composed:

```ts
const { data } = await useAsyncData('school-summary', async () => {
  const [school, vehicles] = await Promise.all([
    $fetch(`/api/driving-schools/${schoolId.value}`),
    $fetch(`/api/driving-schools/${schoolId.value}/vehicles`)
  ])

  return { school, vehicles }
})
```

Other valid operations include an SDK call, filesystem operation in an
appropriate server context, or a custom async computation. The handler should
return a serializable, truthy defined result; `null`/`undefined` can prevent
Nuxt from recognizing useful cached data and cause duplicate client work.

For the simple HTTP case:

```ts
useFetch('/api/schools')
```

is approximately the convenience form of:

```ts
useAsyncData(/* generated key */, () => requestAwareFetch('/api/schools'))
```

The exact internal implementation is framework-owned; treat this as a mental
model, not source-code equivalence.

## Reactive URLs and query parameters

Drive Hub's school composable builds a computed query:

```ts
const query = computed(() => ({
  location: toValue(options.location),
  category: toValue(options.category)
}))

const request = useFetch('/api/driving-schools', { query })
```

Reactive fetch inputs are watched. Changing a filter can rerun the request.
This is closer to a React query keyed by its inputs than to a one-time
`useEffect(() => fetch(...), [])`.

When a value should not trigger an automatic fetch, disable watching and call
`refresh`/`execute` intentionally. Be especially wary of reactive request
bodies: changing a form field should not repeatedly send a mutation.

## Useful options

```ts
const { data, status } = useFetch('/api/items', {
  server: true,             // allow execution during SSR (default)
  lazy: false,              // coordinate/block navigation (default)
  immediate: true,          // start automatically (default)
  default: () => [],        // initial data shape
  pick: ['id', 'name'],     // keep selected response properties
  transform: result => result.items,
  query: { page: 1 },
  watch: false,
  dedupe: 'cancel'
})
```

Important scenarios:

- `{ server: false }`: do not fetch this data during SSR. The SSR page must
  render a valid empty/loading state; the browser fetches after startup.
- `{ lazy: true }` or `useLazyFetch`: client navigation can finish before data,
  so the template must handle `status === 'pending'`.
- `default`: stabilizes initial types/UI, but do not mistake default placeholder
  data for a successful response.
- `pick`/`transform`: reduce or normalize what is serialized into the payload.

## Error and status handling

Drive Hub pages frequently use:

```vue
<section v-if="error">Could not load.</section>
<section v-else-if="status === 'pending' && !data">Loading…</section>
<section v-else>...</section>
```

This handles initial loading and refresh without erasing already displayed
data. A refresh may set a pending state while `data` still holds the previous
successful value.

Choose deliberately between:

- Rendering an inline recoverable error.
- Throwing `createError`/`showError` for a route-level error page.
- Returning a 404 from the API and mapping it to a page error.

Do not silently convert every error to an empty array; "there are no schools"
and "the server failed" are different states.

## Common mistakes

### Using `useFetch` inside a click handler

Composables should be called in Nuxt/Vue setup context, not created ad hoc on
each click. Define `useFetch` once and call `refresh`/`execute`, or use `$fetch`
for an imperative action.

### Using `$fetch` for initial setup data

It can execute twice in universal rendering because it does not transfer the
result through the Nuxt payload by itself.

### Assuming `await useFetch` returns the JSON value

It returns an AsyncData object containing refs. Use `data.value` in script and
`data` in templates.

### Destructuring `.value` too early

This loses reactivity:

```ts
const { data } = await useFetch('/api/items')
const items = data.value // snapshot, not a computed relationship
```

Prefer keeping `data` or deriving:

```ts
const items = computed(() => data.value ?? [])
```

### Treating payload reuse as permanent caching

Avoiding the immediate hydration request is not a promise that data never
expires. Refresh behavior, client navigation, prerendered payloads, and HTTP or
Nitro cache policies are separate concerns.

### Returning secrets to an SSR-aware composable

Payload data goes to the browser. Server execution does not make its return
value secret. Filter DTOs on the server before returning them.

## Practical selection guide

```text
Do I need data to render this page/component?
├─ yes
│  ├─ ordinary HTTP request -> useFetch
│  └─ SDK/custom/multi-step async work -> useAsyncData
│       └─ Axios may be the inner transport if needed
└─ no, a user action triggers it
   ├─ ordinary HTTP mutation/action -> $fetch
   ├─ existing Axios client required -> Axios
   └─ browser-standard low-level behavior needed -> fetch
```

## Further reading

- [Nuxt data fetching guide](https://nuxt.com/docs/4.x/getting-started/data-fetching)
- [`useFetch` API](https://nuxt.com/docs/4.x/api/composables/use-fetch)
- [`useAsyncData` API](https://nuxt.com/docs/4.x/api/composables/use-async-data)
- [`useRequestFetch` and SSR header forwarding](https://nuxt.com/docs/4.x/api/composables/use-request-fetch)
- [Custom `useFetch` recipe](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch)

