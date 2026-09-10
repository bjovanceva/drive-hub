# 8. Nuxt and Vue Router composables compared with React

This chapter covers framework-level APIs used by Drive Hub. Unlike `ref` and
`computed`, these APIs understand Nuxt routing, SSR, HTML metadata, async-data
payloads, or the installed authentication module.

## Quick mapping

| Nuxt/Vue Router API | Closest React equivalent | Important gap |
| --- | --- | --- |
| `useRoute()` | React Router `useLocation` + `useParams` + `useSearchParams` | Vue/Nuxt exposes one reactive route object. |
| `useRouter()` | React Router `useNavigate`, `useHref`, `matchPath`, router instance APIs | No single React Router Hook covers the entire router object. |
| `navigateTo()` | React Router `useNavigate()`; framework `redirect()` on server | Nuxt helper works in universal Nuxt context. |
| `onBeforeRouteLeave()` | React Router `useBlocker()` | Close for blocking, not identical lifecycle semantics. |
| `onBeforeRouteUpdate()` | `useEffect` on params/location or route-loader revalidation | No direct core equivalent. |
| `useFetch()` | Framework loader/query library (`loader`, TanStack Query, Next data APIs) | Bare React has no SSR-payload-aware equivalent. |
| `useSeoMeta()` | React 19 `<title>`/`<meta>`, React Helmet Async, or framework metadata API | Bare client effect is not equivalent for SSR. |
| `useUserSession()` | Auth context + `useContext`, backed by a server session loader | No built-in React auth/session Hook. |
| `definePageMeta()` | React Router route configuration/`handle`, plus framework layout conventions | It is a Nuxt compiler macro, not a Hook. |
| `defineNuxtRouteMiddleware()` | React Router loader/middleware/guard logic | Nuxt integrates it with SSR and client navigation. |

## `useRoute()`: read the current route

Drive Hub reads dynamic parameters and query strings:

```ts
const route = useRoute()

const schoolId = computed(() => Number(route.params.id))
const section = computed(() => route.query.section ?? 'users')
```

The returned route object contains values such as:

- `path` and `fullPath`
- `params`
- `query`
- `name`
- `meta`
- matched route records

It is reactive, so a computed value or watcher that reads route fields updates
when navigation changes them.

### React Router equivalent

React Router splits this across Hooks:

```tsx
const location = useLocation()
const { id } = useParams()
const [searchParams] = useSearchParams()

const schoolId = Number(id)
const section = searchParams.get('section') ?? 'users'
```

Conceptual mapping:

```text
route.path / route.fullPath -> useLocation()
route.params                -> useParams()
route.query                 -> useSearchParams()
route.meta                  -> route handle/matches, depending on router setup
```

In React, the component reruns with new snapshots after navigation. In Vue,
`route` remains a reactive object and dependent computed values/watchers rerun.

### Watch a field, not the whole route

Drive Hub correctly watches:

```ts
watch(
  () => route.fullPath,
  () => close()
)
```

Usually watch the specific param/query/path needed rather than the entire route
object. The React equivalent places that specific value in an Effect dependency
array:

```tsx
useEffect(() => {
  close()
}, [location.pathname, location.search])
```

## `useRouter()`: access router operations

Drive Hub uses the router primarily to resolve a destination before checking
whether a navigation link is active:

```ts
const route = useRoute()
const router = useRouter()

const isProfileActive = computed(() =>
  isNavigationActive(route, router.resolve(userRoutes.profile))
)
```

`useRouter()` exposes operations such as `push`, `replace`, `back`, and
`resolve`, plus routing configuration/state.

### React Router equivalents

Programmatic navigation:

```tsx
const navigate = useNavigate()

navigate('/profile')
navigate('/profile', { replace: true })
navigate(-1)
```

Active link rendering is usually more declarative in React Router:

```tsx
<NavLink
  to="/profile"
  className={({ isActive }) => isActive ? 'active' : undefined}
>
  Profile
</NavLink>
```

Vue Router/Nuxt also gives `<NuxtLink>` active classes, so custom
`router.resolve` logic should be reserved for Drive Hub's particular active-path
rules rather than treated as mandatory.

## `navigateTo()`: universal programmatic navigation

Pages call:

```ts
await navigateTo({
  path: '/schools',
  query: { location, category }
})
```

Route middleware returns it:

```ts
export default defineNuxtRouteMiddleware((to) => {
  if (!loggedIn.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
```

Nuxt's helper can represent navigation on both sides:

- During server-side navigation/middleware, it can become an HTTP redirect.
- In the browser, it drives Vue Router navigation.

Always `await` or otherwise deliberately handle it in component code, and
**return it from route middleware**. Nitro API handlers use server response
helpers such as `sendRedirect`, not `navigateTo`.

### React equivalent depends on context

In a client component:

```tsx
const navigate = useNavigate()
navigate('/schools?location=skopje')
```

In a React Router data loader/action:

```tsx
return redirect('/login')
```

In a server-rendering framework, use its server redirect API. `useNavigate`
alone is not a full equivalent to Nuxt's universal helper because it is a
client/router Hook.

## `onBeforeRouteLeave()`: block leaving a page

Drive Hub prevents leaving the administration page while a mutation is busy:

```ts
onBeforeRouteLeave(() => !busy.value)
```

The guard runs before the current route component is left. Returning `false`
cancels navigation.

### Closest React Router equivalent: `useBlocker`

```tsx
const blocker = useBlocker(busy)
```

A real React implementation normally renders a confirmation UI when
`blocker.state === 'blocked'` and calls `blocker.proceed()` or `blocker.reset()`.

Neither framework can reliably prevent every external event with a client
router guard. Closing the tab, refreshing, or browser process termination may
require `beforeunload`, and browsers deliberately restrict that behavior.

## `onBeforeRouteUpdate()`: guard reuse of the same component

Drive Hub also uses:

```ts
onBeforeRouteUpdate(() => !busy.value)
```

This matters when navigation changes params/query while Vue Router reuses the
current route component instead of unmounting it.

React Router has no identical component Hook. Depending on the goal:

- Use `useBlocker` to block navigation.
- Observe params/search values with `useEffect` to react after a change.
- Put data requirements in route loaders so they rerun/revalidate for the new
  URL.

Watching a param after it changed is not the same as a guard that can cancel the
change, so choose by behavior, not by name.

## `useFetch()`: SSR-aware async data

Drive Hub's pages and custom composables use:

```ts
const { data, status, error, refresh } =
  await useFetch<DashboardResponse>('/api/dashboard')
```

It combines an HTTP request with:

- Server-rendering integration
- Nuxt payload serialization
- Hydration reuse instead of an immediate duplicate request
- Reactive data/error/status refs
- Refresh and request deduplication behavior
- Navigation/Suspense coordination
- Internal request-context/header forwarding

Chapter [4. Data fetching](./04-data-fetching.md) explains the full lifecycle.

### There is no bare React equivalent

This is not equivalent to:

```tsx
useEffect(() => {
  fetch('/api/dashboard').then(/* ... */)
}, [])
```

That pattern runs after the browser commits the component, does not render the
data into initial server HTML by itself, and does not transfer a server result
into hydration.

Closest React solutions depend on the framework:

| React environment | Closest pattern |
| --- | --- |
| React Router data APIs | Route `loader` + `useLoaderData`, with SSR setup when applicable |
| TanStack Query | Query Hook plus server prefetch/dehydrate/hydrate configuration |
| Next.js | Server Component/data fetch for server data; client query/action for interactive refresh |
| Remix-style framework | Loader returning route data, consumed by the route component |
| Bare SPA | `useEffect`/custom Hook/query library, but no SSR-payload feature unless you build it |

The exact React alternative is therefore a framework data-loading mechanism,
not one core React Hook.

## `useSeoMeta()`: typed head metadata

Pages declare:

```ts
useSeoMeta({
  title: 'Driving Schools | Drive Hub',
  description: 'Compare verified driving schools...'
})
```

Nuxt can render these values into the initial document `<head>`, update them on
client navigation, deduplicate tags, and type common SEO/Open Graph fields.

Reactive values should be passed with getters:

```ts
useSeoMeta({
  title: () => `${school.value?.name ?? 'School'} | Drive Hub`
})
```

### React equivalents

React 19 supports rendering metadata tags in components:

```tsx
return (
  <>
    <title>Driving Schools | Drive Hub</title>
    <meta name="description" content="Compare verified driving schools..." />
    {/* page */}
  </>
)
```

In other setups, common equivalents are React Helmet Async or a framework's
metadata/head API. Next.js, for example, has a Metadata API.

This client-only pattern is weaker for SSR:

```tsx
useEffect(() => {
  document.title = 'Driving Schools | Drive Hub'
}, [])
```

It updates only after browser JavaScript runs, does not provide the title to the
initial HTML response, and handles only a fraction of head management.

## `useUserSession()`: SSR-aware authenticated session state

`nuxt-auth-utils` provides the project with:

```ts
const session = useUserSession()

session.user       // reactive current user
session.loggedIn   // reactive authentication flag
session.ready      // session loading/readiness state
await session.fetch() // refresh session data
```

Drive Hub wraps it in `useAuth()` so components also receive login, register,
logout, and mutation state.

The session is coordinated with the Nuxt request and browser cookie. Server API
handlers still enforce authorization; a reactive `loggedIn` flag is not a
security boundary.

### React equivalent: a system, not one Hook

A typical React design is:

```tsx
const AuthContext = createContext<AuthContextValue | null>(null)

function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
```

The `AuthProvider` must still:

- Load/receive the user from a secure server session.
- Make initial session data available during SSR/hydration if SSR is used.
- Refresh after login/logout.
- Protect server endpoints independently.

React Router loaders, Next.js server/session libraries, or an auth SDK may
provide parts of this. `useContext` only distributes a value; it does not create
secure authentication.

## `definePageMeta()`: page route configuration

Every page chooses a layout and sometimes middleware:

```ts
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})
```

This is a Nuxt compiler macro. It is processed out of the component and becomes
route metadata. It can configure layout, middleware, route identity/path,
transitions, keep-alive behavior, validation, and other page concerns.

### React equivalent

React has no page compiler convention. React Router commonly declares this on
a route object:

```tsx
{
  path: '/dashboard',
  element: <DashboardPage />,
  loader: requireUser,
  handle: { layout: 'default' }
}
```

The actual layout may use nested routes:

```tsx
<Route element={<DefaultLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
</Route>
```

Next.js or another meta-framework uses its own file/layout/metadata conventions.
`definePageMeta` is closer to framework route configuration than to a React
Hook.

## `defineNuxtRouteMiddleware()`: reusable navigation guard

Drive Hub's `auth`, `admin`, and `guest` middleware use:

```ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

Named middleware is referenced from `definePageMeta`. In an SSR application it
can execute for the initial server render and again during initial client
startup, then on later matching client navigations. It belongs to the Vue app,
not Nitro server middleware.

### React alternatives

Preferred React Router data-router approach:

```tsx
async function dashboardLoader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  if (!user) throw redirect('/login')
  return { user }
}
```

A client-only wrapper is another common pattern:

```tsx
function RequireUser({ children }: PropsWithChildren) {
  const { user, ready } = useAuth()
  if (!ready) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}
```

The loader is closer to Nuxt middleware when the router/framework also executes
it on the server. The wrapper is browser/component rendering logic and can show
a loading flash if session data is not hydrated.

In both ecosystems, page guards do not secure the API. The server must
authorize every protected operation.

## SSR/runtime matrix

| API | Server render | Hydration/client startup | Later browser navigation |
| --- | ---: | ---: | ---: |
| `useRoute` | Reads incoming matched route | Reads synchronized route | Reactively updates |
| `useRouter` | Available in Nuxt app context | Connects to client router | Drives/resolves navigation |
| `navigateTo` | Can produce redirect | Can navigate router | Can navigate router |
| route middleware | Runs for initial SSR route | Can run again for initial route | Runs before matching navigation |
| `useFetch` | Fetches and serializes render data | Reuses payload | Fetches/loads next data as needed |
| `useSeoMeta` | Produces document head tags | Reconciles head state | Updates head for new page |
| `useUserSession` | Reads request/session context | Restores client session state | Remains reactive/refetchable |

## Common React-to-Nuxt mistakes

### Fetching route data in `onMounted`

That recreates a client-only `useEffect` waterfall and gives up SSR data
rendering. Use `useFetch` unless the data is intentionally browser-only.

### Using `window.location` for internal links

That forces a full document navigation. Prefer `<NuxtLink>` or `navigateTo` so
the hydrated application can use client routing.

### Calling `navigateTo` without returning it from middleware

The middleware must return the result so Nuxt understands that navigation was
redirected or cancelled.

### Reading route data once into a plain variable

If it must update without remounting, derive it with `computed` or watch the
specific route field.

### Treating `useUserSession` as backend authorization

Client-visible state can be manipulated. It decides UI/navigation behavior;
Nitro authorization helpers decide whether an HTTP operation is allowed.

## Official references

- [Nuxt `useRoute`](https://nuxt.com/docs/4.x/api/composables/use-route)
- [Nuxt `useRouter`](https://nuxt.com/docs/4.x/api/composables/use-router)
- [Nuxt `navigateTo`](https://nuxt.com/docs/4.x/api/utils/navigate-to)
- [Nuxt `useFetch`](https://nuxt.com/docs/4.x/api/composables/use-fetch)
- [Nuxt `useSeoMeta`](https://nuxt.com/docs/4.x/api/composables/use-seo-meta)
- [Nuxt `definePageMeta`](https://nuxt.com/docs/4.x/api/utils/define-page-meta)
- [Nuxt route middleware](https://nuxt.com/docs/4.x/directory-structure/app/middleware)
- [Vue Router Composition API](https://router.vuejs.org/guide/advanced/composition-api)
- [React Router Hooks](https://reactrouter.com/api/hooks)
- [`nuxt-auth-utils`](https://nuxt.com/modules/auth-utils)

