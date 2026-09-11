# 9. Drive Hub custom composables and their React equivalents

Drive Hub has six custom composables in `app/composables/`:

```text
useAuth
useDrivingSchools
useSchoolSearchOptions
useScrollReveal
useAdminWorkspace
useAdminDirectory
```

Nuxt auto-imports top-level exports from this directory, so pages/components
can call them without a manual import. React custom Hooks are normally imported
explicitly.

## What custom composables accomplish

A composable packages stateful behavior rather than UI markup. It can own:

- Reactive state
- Derived state
- Async data and refresh behavior
- Mutations and their status/errors
- Browser subscriptions with lifecycle cleanup
- Domain-specific lookup or normalization logic

This is almost the same motivation as a React custom Hook: components express
intent while the Hook/composable owns a reusable mechanism.

```text
Vue component -> useDrivingSchools() -> reactive schools + mutations
React component -> useDrivingSchools() -> query result + mutations
```

The same name does not mean the implementations are interchangeable. Nuxt's
version builds on `useFetch` and its SSR payload; a React version must choose a
router/framework/query system that provides equivalent server data transfer.

## State-sharing rule

Extracting logic does not automatically make all state global.

```ts
export function useAuth() {
  const mutationStatus = ref('idle')
  // ...
}
```

Each call creates its own `mutationStatus`. The `useUserSession()` inside it is
shared through the authentication module, but the wrapper's mutation status is
local to that composable instance.

The React rule is similar: each custom Hook call receives independent
`useState` instances unless the Hook reads a shared Context/external store.

`useFetch` adds another nuance: AsyncData calls that resolve to the same key can
share request state. The custom composable instance is local, while its
underlying keyed Nuxt data may be shared/deduplicated.

## 1. `useAuth()`

Source: [`app/composables/useAuth.ts`](../../app/composables/useAuth.ts)

### Responsibility

`useAuth` adapts `nuxt-auth-utils` to Drive Hub's endpoints and UI needs:

```ts
const session = useUserSession()
const mutationStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const mutationError = shallowRef<unknown>(null)
```

It exposes:

| Returned value | Meaning |
| --- | --- |
| `user` | Reactive current session user. |
| `loggedIn` | Reactive authentication flag. |
| `sessionReady` | Whether session initialization is complete. |
| `login(input)` | POST credentials, then refresh session. |
| `register(input)` | POST account data, then refresh session. |
| `logout()` | POST logout, then refresh cleared session. |
| `mutationStatus` | Read-only lifecycle of the most recent auth action. |
| `mutationError` | Read-only error from that action. |

All three mutations share `runMutation`:

```text
action starts
  -> status = pending; previous error cleared
  -> $fetch endpoint
  -> session.fetch() refreshes canonical session state
  -> status = success

failure
  -> error captured
  -> status = error
  -> original error rethrown for page-specific messaging
```

The composable separates reusable mechanics from presentation. The login page
chooses its error copy and redirect behavior; the composable owns the request
and session refresh.

### Closest React architecture

Use an Auth Context for shared session state and a custom Hook for access:

```tsx
type AuthContextValue = {
  user: User | null
  ready: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function useSession() {
  const session = useContext(AuthContext)
  if (!session) throw new Error('AuthProvider is missing')
  return session
}
```

Then a mutation wrapper:

```tsx
function useAuth() {
  const session = useSession()
  const [mutationStatus, setMutationStatus] =
    useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [mutationError, setMutationError] = useState<unknown>(null)

  async function runMutation<T>(operation: () => Promise<T>) {
    setMutationStatus('pending')
    setMutationError(null)

    try {
      const result = await operation()
      await session.refreshSession()
      setMutationStatus('success')
      return result
    } catch (error) {
      setMutationError(error)
      setMutationStatus('error')
      throw error
    }
  }

  return {
    user: session.user,
    loggedIn: session.user !== null,
    sessionReady: session.ready,
    mutationStatus,
    mutationError,
    login: (input: LoginInput) =>
      runMutation(() => api.post('/api/auth/login', input)),
    logout: () =>
      runMutation(() => api.post('/api/auth/logout'))
  }
}
```

This matches the client state organization. To match Nuxt fully, the React
framework must also load the session on the server and hydrate the provider
without a duplicate browser request. Context alone does not do that.

### Why it is valuable

Without this composable, every auth screen would duplicate endpoint paths,
pending/error transitions, and session refresh. Centralization also makes it
harder to forget the essential `session.fetch()` after cookie-changing actions.

## 2. `useDrivingSchools(options)`

Source:
[`app/composables/useDrivingSchools.ts`](../../app/composables/useDrivingSchools.ts)

### Responsibility

This is the client-side gateway to `/api/driving-schools`:

```ts
const query = computed(() => ({
  location: normalizedLocation,
  category: normalizedCategory
}))

const request = useFetch<DrivingSchoolDto[]>('/api/driving-schools', {
  query
})
```

It returns read state:

```text
schools, status, error, refresh
```

and mutation behavior:

```text
createDrivingSchool(input)
deleteDrivingSchool(id)
mutationStatus
mutationError
```

Both successful mutations call `request.refresh()`, so displayed data is
reloaded from the authoritative endpoint.

### Reactive input flow

Callers can pass a plain value, ref, computed ref, or getter because the type is
`MaybeRefOrGetter` and the composable uses `toValue`:

```ts
const location = computed(() => route.query.location as string)
const category = computed(() => route.query.category as string)

const { schools } = useDrivingSchools({ location, category })
```

```text
route query changes
  -> location/category computed values change
  -> query computed value changes
  -> useFetch reacts to request input
  -> GET request uses new filters
  -> schools ref updates
  -> templates using schools update
```

### Closest React equivalent with TanStack Query

TanStack Query is not currently a Drive Hub dependency; it is shown because it
maps closely to Nuxt AsyncData query/mutation responsibilities:

```tsx
function useDrivingSchools(options: {
  location?: string
  category?: string
} = {}) {
  const queryClient = useQueryClient()
  const queryKey = [
    'driving-schools',
    options.location ?? null,
    options.category ?? null
  ] as const

  const schoolsQuery = useQuery({
    queryKey,
    queryFn: () => api.get<DrivingSchoolDto[]>('/api/driving-schools', {
      params: {
        location: options.location,
        category: options.category
      }
    }).then(response => response.data)
  })

  const createSchool = useMutation({
    mutationFn: (input: CreateDrivingSchoolInput) =>
      api.post<DrivingSchoolDto>('/api/driving-schools', input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['driving-schools']
    })
  })

  const deleteSchool = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/driving-schools/${id}`),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['driving-schools']
    })
  })

  return { schoolsQuery, createSchool, deleteSchool }
}
```

Mapping:

```text
Nuxt useFetch data/status/error -> React Query useQuery result
Nuxt request.refresh()          -> refetch/invalidateQueries
Drive Hub runMutation          -> useMutation lifecycle
reactive query computed        -> queryKey based on current React render values
```

SSR still requires the React framework's query prefetch/dehydrate/hydrate
integration. A client-only `useQuery` is not automatically equal to Nuxt
`useFetch` during SSR.

### Bare React alternative

It can be built from `useState` and `useEffect`, but then Drive Hub must own
abort handling, race prevention, cache keys, loading/error state, refetching,
SSR preloading, and hydration. That is exactly the infrastructure Nuxt's
AsyncData layer already supplies.

## 3. `useSchoolSearchOptions()`

Source:
[`app/composables/useSchoolSearchOptions.ts`](../../app/composables/useSchoolSearchOptions.ts)

### Responsibility

It loads the backend-defined cities and licence categories once per matching
Nuxt async-data key:

```ts
const request = useFetch<SchoolSearchOptionsDto>('/api/search-options', {
  default: () => ({ locations: [], categories: [] })
})
```

Then exposes purpose-specific computed values:

```ts
return {
  locationOptions: computed(() => request.data.value.locations),
  categoryOptions: computed(() => request.data.value.categories),
  status: request.status,
  error: request.error,
  refresh: request.refresh
}
```

The homepage and school directory no longer know how the API response is
structured beyond the fields they consume. They also cannot drift into separate
hard-coded lists.

### React equivalent

With a query library:

```tsx
function useSchoolSearchOptions() {
  const query = useQuery({
    queryKey: ['school-search-options'],
    queryFn: () => api.get<SchoolSearchOptionsDto>('/api/search-options')
      .then(response => response.data),
    initialData: { locations: [], categories: [] }
  })

  return {
    locationOptions: query.data.locations,
    categoryOptions: query.data.categories,
    status: query.status,
    error: query.error,
    refresh: query.refetch
  }
}
```

React values are read directly from the current render; Vue returns computed
refs. The domain-facing API is almost identical.

## 4. `useScrollReveal(options)`

Source:
[`app/composables/useScrollReveal.ts`](../../app/composables/useScrollReveal.ts)

### Responsibility

This is the clearest lifecycle composable in the project. It:

1. Returns a template ref named `target`.
2. Waits until the component mounts in the browser.
3. Respects `prefers-reduced-motion`.
4. Observes when the target enters the viewport.
5. Reveals it once and disconnects the observer.
6. Cancels both the observer and animation frame when unmounted.

```ts
const {
  target: revealTarget,
  isMotionReady,
  isRevealed
} = useScrollReveal({ threshold: 0.22 })
```

The consumer binds:

```vue
<article
  ref="revealTarget"
  :class="{
    'is-motion-ready': isMotionReady,
    'is-revealed': isRevealed
  }"
>
```

### SSR-safe design

The composable creates refs during SSR but accesses `window` and
`IntersectionObserver` only inside `onMounted`. Server-rendered content is not
hidden until the browser declares motion ready. This avoids blank SSR content
and hydration disagreement while preserving the entrance animation.

### Close React equivalent

```tsx
function useScrollReveal(options: ScrollRevealOptions = {}) {
  const target = useRef<HTMLElement | null>(null)
  const [isMotionReady, setMotionReady] = useState(false)
  const [isRevealed, setRevealed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMotionReady(true)
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      setRevealed(true)
      observer.disconnect()
    }, {
      threshold: options.threshold ?? 0.18,
      rootMargin: options.rootMargin ?? '0px 0px -5% 0px'
    })

    if (target.current) observer.observe(target.current)

    const frame = requestAnimationFrame(() => setMotionReady(true))

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [options.threshold, options.rootMargin])

  return { target, isMotionReady, isRevealed }
}
```

Mapping here is direct:

```text
Vue template ref                 -> React useRef DOM ref
Vue ref booleans                 -> React useState booleans
onMounted + onBeforeUnmount      -> one useEffect with cleanup
```

The options object must be handled carefully in React dependencies. Depending
on `options` itself would rerun the effect if the caller creates a new object on
every render; depending on primitive fields avoids that.

## 5. `useAdminWorkspace()`

Source:
[`app/composables/useAdminWorkspace.ts`](../../app/composables/useAdminWorkspace.ts)

### Responsibility

This is a page-controller composable for the administration workspace. It owns
three kinds of state:

#### Server-backed query state

```ts
const request = await useFetch<AdminOverview>('/api/admin/overview')
```

#### Local UI state

```ts
const editor = ref<AdminEditorState | null>(null)
const deletion = ref<AdminDeleteRequest | null>(null)
const busy = ref(false)
const notice = ref('')
const mutationError = ref('')
```

#### Commands

```text
close
edit
askDelete
save
remove
assign
```

Every write passes through `mutate`, which prevents overlapping operations,
clears stale notices, performs the request, closes dialogs, refreshes the
overview, and translates errors for the UI.

```text
administration.vue
  -> asks useAdminWorkspace for state and commands
  -> passes commands to panels/modals
  -> composable sends API mutation
  -> refreshes one authoritative overview
  -> all dependent panels receive updated reactive data
```

This keeps a very large page from containing request orchestration and modal
state transitions alongside its template.

### Closest React custom Hook

```tsx
function useAdminWorkspace() {
  const queryClient = useQueryClient()
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview
  })

  const [editor, setEditor] = useState<AdminEditorState | null>(null)
  const [deletion, setDeletion] = useState<AdminDeleteRequest | null>(null)
  const [notice, setNotice] = useState('')
  const [mutationError, setMutationError] = useState('')

  const mutation = useMutation({
    mutationFn: runAdminOperation,
    onSuccess: async (_result, variables) => {
      setEditor(null)
      setDeletion(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
      setNotice(variables.successMessage)
    },
    onError: error => {
      setMutationError(authErrorMessage(error))
    }
  })

  return {
    overview,
    editor,
    deletion,
    notice,
    mutationError,
    busy: mutation.isPending,
    // edit, close, askDelete, save, remove, assign...
  }
}
```

React `useState` maps to the local refs, `useQuery` maps to the initial overview,
and `useMutation` maps to the reusable mutation lifecycle. A `useReducer` could
be even clearer if the editor/deletion/notices grow into a formal state machine.

### Why this composable is page-scoped

It represents one administration workspace instance. Making every editor flag
global would increase coupling. The server-backed overview may be keyed/shared,
but open dialogs and notices should usually remain local to the page.

## 6. `useAdminDirectory(source)`

Source:
[`app/composables/useAdminDirectory.ts`](../../app/composables/useAdminDirectory.ts)

### Responsibility

The admin API returns normalized collections. UI panels repeatedly need names
for foreign-key IDs. This composable creates indexed Maps:

```ts
const users = computed(() =>
  new Map(toValue(source).users.map(user => [user.id, user]))
)
```

and lookup functions:

```ts
const userName = (id: number | null) =>
  id === null ? 'Unassigned' : users.value.get(id)?.name ?? 'Unknown user'
```

This changes repeated lookup cost and presentation consistency:

```text
Without index: each displayed row may scan an entire array with find()
With Map:      rebuild index when source changes, then perform direct lookups
```

It also centralizes fallback labels such as `Unknown user` and `Unassigned`.

### Closest React equivalent

```tsx
function useAdminDirectory(overview: AdminOverview) {
  const users = useMemo(
    () => new Map(overview.users.map(user => [user.id, user])),
    [overview.users]
  )

  const schools = useMemo(
    () => new Map(overview.schools.map(school => [school.id, school])),
    [overview.schools]
  )

  const userName = (id: number | null) =>
    id === null ? 'Unassigned' : users.get(id)?.name ?? 'Unknown user'

  const schoolName = (id: number | null) =>
    id === null ? '—' : schools.get(id)?.name ?? 'Unknown school'

  return { users, schools, userName, schoolName }
}
```

`computed` automatically discovers its reactive dependency. React `useMemo`
must list array references explicitly. `useCallback` is necessary only if stable
lookup function identity matters to memoized consumers or Effect dependencies;
it is not automatically required.

### Is this necessarily a React Hook?

If indexing is cheap or already performed by the API/store, a pure function may
be simpler:

```ts
function createAdminDirectory(overview: AdminOverview) {
  return {
    users: new Map(overview.users.map(user => [user.id, user]))
  }
}
```

In Vue, `useAdminDirectory` is legitimately a composable because it creates
computed reactive state. In React, use the `use` prefix only when the function
actually calls Hooks.

## How the composables fit together

```text
Framework/module primitives
├── useFetch
├── useUserSession
├── ref / shallowRef / computed / watch
└── onMounted / onBeforeUnmount
        │
        ▼
Drive Hub composables
├── useAuth
│   └── session + auth mutations
├── useDrivingSchools
│   └── filtered query + create/delete + refresh
├── useSchoolSearchOptions
│   └── shared search reference data
├── useScrollReveal
│   └── browser observer lifecycle
├── useAdminWorkspace
│   └── admin query + dialogs + commands
└── useAdminDirectory
    └── derived ID-to-entity indexes
        │
        ▼
Pages and components consume domain-oriented state/actions
```

## Design review: what these composables do well

- They are named after domain behavior rather than generic lifecycle wrappers.
- Pages do not repeat endpoint URLs and mutation-state boilerplate.
- Initial read data uses `useFetch`; user-triggered writes use `$fetch`.
- Browser-only work is isolated behind mount/unmount hooks.
- Mutable internal state is exposed read-only when callers should use actions.
- API DTOs are adapted into UI-facing computed values without storing redundant
  copies.
- Backend authorization remains outside the client composables.

## Boundaries to keep in mind as the project grows

### Avoid composables that become hidden global stores accidentally

Local refs are usually instance-local. If the application needs truly shared
client state, choose an explicit `useState` key, Pinia store, module-provided
state, or lifted owner. Do not assume the `use` name makes values global.

### Keep server mutations imperative

Continue using returned actions and `$fetch` for POST/PATCH/DELETE. Do not put
reactive request bodies into automatically watched `useFetch` calls.

### Give large workflows an explicit state model

`useAdminWorkspace` is manageable now. If editor, confirmation, optimistic
updates, and concurrency grow, a reducer/state machine may communicate valid
transitions better than several booleans and nullable refs.

### Preserve SSR-safe return values

Data returned through `useFetch` can enter the browser payload. DTOs must not
contain secrets, database objects, or functions.

### Avoid duplicating presentation state

Prefer `computed`/`useMemo` for values derivable from query data. Store only
user choices and workflow state that cannot be derived.

## How to translate a future React Hook into a Vue composable

Use this conversion process:

```text
React useState                -> Vue ref/reactive
React derived render value    -> Vue computed (when reactive/reused)
React useMemo                 -> Vue computed
React useEffect               -> Vue watch or lifecycle hook, depending on why
React useRef DOM node         -> Vue template ref
React Effect cleanup          -> onBeforeUnmount/onUnmounted or watch cleanup
React Context shared state    -> useState/Pinia/provide-inject/module composable
React query Hook              -> useFetch/useAsyncData + $fetch mutations
React Router Hooks            -> useRoute/useRouter/navigateTo
```

Do not translate mechanically. First identify whether the original Hook owns
state, derives a value, synchronizes an external system, loads route data, or
shares context. Then select the Vue/Nuxt mechanism for that responsibility.

## Official references

- [Nuxt composables directory and auto-importing](https://nuxt.com/docs/4.x/directory-structure/app/composables)
- [Nuxt data-fetching composables](https://nuxt.com/docs/4.x/getting-started/data-fetching)
- [React custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [TanStack Query `useQuery`](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery)
- [TanStack Query `useMutation`](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useMutation)
- [TanStack Query query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

